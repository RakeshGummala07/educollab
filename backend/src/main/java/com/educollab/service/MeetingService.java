package com.educollab.service;

import com.educollab.document.MeetingChatMessage;
import com.educollab.document.Notification;
import com.educollab.dto.request.CreateMeetingRequest;
import com.educollab.dto.request.MeetingChatSendRequest;
import com.educollab.dto.response.*;
import com.educollab.entity.*;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.EnrollmentRepository;
import com.educollab.repository.MeetingAttendanceRepository;
import com.educollab.repository.MeetingJoinRequestRepository;
import com.educollab.repository.MeetingRepository;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.MeetingChatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingAttendanceRepository attendanceRepository;
    private final MeetingJoinRequestRepository joinRequestRepository;
    private final MeetingChatRepository chatRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LiveKitService liveKitService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.meeting.attendance-threshold-seconds:300}")
    private long attendanceThresholdSeconds;

    @Value("${app.meeting.auto-end-grace-minutes:15}")
    private long autoEndGraceMinutes;

    // ══════════════════════════════════════════════════════════════════════
    // CREATE / READ
    // ══════════════════════════════════════════════════════════════════════

    @Transactional
    public MeetingResponse createMeeting(String teacherEmail, CreateMeetingRequest req) {
        User teacher = findUser(teacherEmail);
        if (!teacher.isTeacher()) throw new BadRequestException("Only teachers can create meetings");
        if (!req.getScheduledEnd().isAfter(req.getScheduledStart()))
            throw new BadRequestException("scheduledEnd must be after scheduledStart");

        Meeting meeting = Meeting.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .teacher(teacher)
                .roomName("meeting-" + UUID.randomUUID().toString().substring(0, 12))
                .scheduledStart(req.getScheduledStart())
                .scheduledEnd(req.getScheduledEnd())
                .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 50)
                .waitingRoomEnabled(Boolean.TRUE.equals(req.getWaitingRoomEnabled()))
                .chatMode(req.getChatMode() != null ? req.getChatMode() : Meeting.ChatMode.EVERYONE)
                .status(Meeting.MeetingStatus.SCHEDULED)
                .build();

        meeting = meetingRepository.save(meeting);

        // Host attendance row, created up-front so role lookups always resolve
        attendanceRepository.save(MeetingAttendance.builder()
                .meeting(meeting).user(teacher)
                .role(MeetingAttendance.MeetingRole.HOST)
                .build());

        for (User student : enrollmentRepository.findStudentsByTeacher(teacher)) {
            notificationService.notify(student.getId(), teacher.getId(),
                    Notification.NotificationType.MEETING_SCHEDULED,
                    "New meeting scheduled",
                    teacher.getFullName() + " scheduled \"" + meeting.getTitle() + "\"",
                    "MEETING", String.valueOf(meeting.getId()));
        }

        return MeetingResponse.from(meeting);
    }

    public List<MeetingResponse> listMeetings(String userEmail, String statusFilter) {
        User user = findUser(userEmail);
        List<Meeting> meetings = user.isTeacher()
                ? meetingRepository.findByTeacher(user)
                : meetingRepository.findVisibleToStudent(user);

        return meetings.stream()
                .filter(m -> matchesFilter(m, statusFilter))
                .map(MeetingResponse::from)
                .collect(Collectors.toList());
    }

    private boolean matchesFilter(Meeting m, String filter) {
        if (filter == null || filter.equalsIgnoreCase("all")) return true;
        return switch (filter.toLowerCase()) {
            case "live" -> m.getStatus() == Meeting.MeetingStatus.LIVE;
            case "upcoming" -> m.getStatus() == Meeting.MeetingStatus.SCHEDULED;
            case "past" -> m.getStatus() == Meeting.MeetingStatus.ENDED
                    || m.getStatus() == Meeting.MeetingStatus.CANCELLED;
            default -> true;
        };
    }

    @Transactional(readOnly = true)
    public MeetingResponse getMeeting(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        requireAccess(user, meeting);
        MeetingResponse res = MeetingResponse.from(meeting);
        res.setLiveParticipantCount((int) attendanceRepository
                .findByMeetingAndCurrentlyPresentTrue(meeting).size());
        return res;
    }


    //------------------------------------------ LIFECYCLE --------------------------------------------------------------------
    

    @Transactional
    public MeetingResponse startMeeting(String teacherEmail, Long meetingId) {
        User teacher = findUser(teacherEmail);
        Meeting meeting = findMeeting(meetingId);
        requireHost(teacher, meeting);

        if (meeting.getStatus() == Meeting.MeetingStatus.LIVE) return MeetingResponse.from(meeting);
        if (meeting.getStatus() != Meeting.MeetingStatus.SCHEDULED)
            throw new BadRequestException("Meeting cannot be started from status " + meeting.getStatus());

        meeting.setStatus(Meeting.MeetingStatus.LIVE);
        meeting.setActualStart(LocalDateTime.now());
        meeting = meetingRepository.save(meeting);

        broadcastLifecycle(meeting.getId(), "STARTED");

        for (User student : enrollmentRepository.findStudentsByTeacher(teacher)) {
            notificationService.notify(student.getId(), teacher.getId(),
                    Notification.NotificationType.MEETING_STARTED,
                    "Meeting is live now",
                    teacher.getFullName() + " started \"" + meeting.getTitle() + "\"",
                    "MEETING", String.valueOf(meeting.getId()));
        }
        return MeetingResponse.from(meeting);
    }

    @Transactional
    public JoinMeetingResponse joinMeeting(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        requireAccess(user, meeting);

        // Host joining a still-SCHEDULED meeting auto-starts it
        if (meeting.getTeacher().getId().equals(user.getId())
                && meeting.getStatus() == Meeting.MeetingStatus.SCHEDULED) {
            meeting.setStatus(Meeting.MeetingStatus.LIVE);
            meeting.setActualStart(LocalDateTime.now());
            meeting = meetingRepository.save(meeting);
            broadcastLifecycle(meeting.getId(), "STARTED");
        }

        if (meeting.getStatus() != Meeting.MeetingStatus.LIVE)
            throw new BadRequestException("Meeting is not live yet");

        MeetingAttendance.MeetingRole role = resolveRole(meeting, user);
        boolean isModerator = role.isModerator();

        if (meeting.getLocked() && !isModerator)
            throw new BadRequestException("This meeting is locked by the host");

        if (meeting.getWaitingRoomEnabled() && !isModerator) {
            MeetingJoinRequest existing = joinRequestRepository.findByMeetingAndUser(meeting, user).orElse(null);
            if (existing == null) {
                try{

                    existing = MeetingJoinRequest.builder().meeting(meeting).user(user).build();
                    joinRequestRepository.save(existing);
                    messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/waiting-room",
                            JoinRequestResponse.from(existing));
                }
                catch(DataIntegrityViolationException e){
                    existing = joinRequestRepository.findByMeetingAndUser(meeting, user).orElseThrow(() -> e);
                }
            }
            if (existing.getStatus() != MeetingJoinRequest.JoinRequestStatus.APPROVED) {
                return JoinMeetingResponse.builder()
                        .meetingId(meetingId).roomName(meeting.getRoomName())
                        .waiting(true).build();
            }
        }

        MeetingAttendance attendance = attendanceRepository.findByMeetingAndUser(meeting, user)
                .orElse(MeetingAttendance.builder().meeting(meeting).user(user).role(role).build());
        LocalDateTime now = LocalDateTime.now();
        if (attendance.getFirstJoinedAt() == null) attendance.setFirstJoinedAt(now);
        attendance.setLastJoinedAt(now);
        attendance.setCurrentlyPresent(true);
        attendanceRepository.save(attendance);

        broadcastParticipants(meetingId, "JOINED", user.getId());

        return JoinMeetingResponse.builder()
                .meetingId(meetingId)
                .roomName(meeting.getRoomName())
                .livekitUrl(liveKitService.getWsUrl())
                .token(liveKitService.generateToken(meeting.getRoomName(), user.getId(), user.getFullName(), true))
                .role(attendance.getRole())
                .waiting(false)
                .build();
    }

    @Transactional
    public void leaveMeeting(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        closeAttendanceSession(meeting, user);
        broadcastParticipants(meetingId, "LEFT", user.getId());
    }

    private void closeAttendanceSession(Meeting meeting, User user) {
        attendanceRepository.findByMeetingAndUser(meeting, user).ifPresent(a -> {
            if (Boolean.TRUE.equals(a.getCurrentlyPresent()) && a.getLastJoinedAt() != null) {
                long elapsed = Duration.between(a.getLastJoinedAt(), LocalDateTime.now()).getSeconds();
                a.setDurationSeconds(a.getDurationSeconds() + Math.max(elapsed, 0));
            }
            a.setLastLeftAt(LocalDateTime.now());
            a.setCurrentlyPresent(false);
            a.setStatus(a.getDurationSeconds() >= attendanceThresholdSeconds
                    ? MeetingAttendance.AttendanceStatus.PRESENT
                    : a.getDurationSeconds() > 0
                        ? MeetingAttendance.AttendanceStatus.PARTIAL
                        : MeetingAttendance.AttendanceStatus.ABSENT);
            attendanceRepository.save(a);
        });
    }

    @Transactional
    public MeetingResponse endMeeting(String teacherEmail, Long meetingId) {
        User teacher = findUser(teacherEmail);
        Meeting meeting = findMeeting(meetingId);
        requireHost(teacher, meeting);
        return endMeetingInternal(meeting);
    }

    // System-triggered end (used by both the host-initiated endpoint and the
    // auto-end scheduler) — no auth check, callers must already have verified it
    @Transactional
    public MeetingResponse endMeetingInternal(Meeting meeting) {
        if (meeting.getStatus() != Meeting.MeetingStatus.LIVE) return MeetingResponse.from(meeting);

        meeting.setStatus(Meeting.MeetingStatus.ENDED);
        meeting.setActualEnd(LocalDateTime.now());
        meeting.setActiveScreenShareUserId(null);
        meeting = meetingRepository.save(meeting);

        liveKitService.endRoom(meeting.getRoomName());

        for (MeetingAttendance a : attendanceRepository.findByMeetingAndCurrentlyPresentTrue(meeting)) {
            closeAttendanceSession(meeting, a.getUser());
        }

        broadcastLifecycle(meeting.getId(), "ENDED");
        return MeetingResponse.from(meeting);
    }

    @Transactional
    public void deleteMeeting(String teacherEmail, Long meetingId) {
        User teacher = findUser(teacherEmail);
        Meeting meeting = findMeeting(meetingId);
        requireHost(teacher, meeting);
        if (meeting.getStatus() != Meeting.MeetingStatus.SCHEDULED)
            throw new BadRequestException("Only meetings that haven't started can be deleted — end it instead");
        joinRequestRepository.deleteByMeeting(meeting);
        chatRepository.deleteByMeetingId(meetingId);
        attendanceRepository.deleteByMeeting(meeting);
        meetingRepository.delete(meeting);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ATTENDANCE
    // ══════════════════════════════════════════════════════════════════════

    public List<AttendanceResponse> getAttendance(String teacherEmail, Long meetingId) {
        User teacher = findUser(teacherEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(teacher, meeting);
        return attendanceRepository.findByMeeting(meeting).stream()
                .map(AttendanceResponse::from)
                .collect(Collectors.toList());
    }

    // Lighter-weight roster available to ANY participant (not just moderators) —
    // used for the live "People" panel and the chat private-message dropdown.
    // getAttendance() above stays moderator-only since it's the full report.
    public List<AttendanceResponse> listParticipants(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        requireAccess(user, meeting);
        return attendanceRepository.findByMeeting(meeting).stream()
                .map(AttendanceResponse::from)
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // WAITING ROOM
    // ══════════════════════════════════════════════════════════════════════

    public List<JoinRequestResponse> listWaitingParticipants(String hostEmail, Long meetingId) {
        User host = findUser(hostEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(host, meeting);
        return joinRequestRepository.findPendingByMeeting(meeting).stream()
                .map(JoinRequestResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public void approveJoinRequest(String hostEmail, Long meetingId, Long targetUserId) {
        User host = findUser(hostEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(host, meeting);

        User target = findUserById(targetUserId);
        MeetingJoinRequest request = joinRequestRepository.findByMeetingAndUser(meeting, target)
                .orElseThrow(() -> new ResourceNotFoundException("No join request from this user"));
        request.setStatus(MeetingJoinRequest.JoinRequestStatus.APPROVED);
        joinRequestRepository.save(request);

        // Tell the waiting client it's clear to call POST /join again.
        // NOTE: this app's STOMP principal is keyed by email, not userId, so
        // convertAndSendToUser(userId, ...) would silently never be delivered —
        // same reason NotificationConsumer broadcasts to /topic/notifications/{userId}
        // instead of /user/{userId}/queue/... . We follow that same proven pattern here.
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/waiting-room/" + targetUserId,
                Map.of("status", "APPROVED"));
    }

    @Transactional
    public void denyJoinRequest(String hostEmail, Long meetingId, Long targetUserId) {
        User host = findUser(hostEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(host, meeting);

        User target = findUserById(targetUserId);
        MeetingJoinRequest request = joinRequestRepository.findByMeetingAndUser(meeting, target)
                .orElseThrow(() -> new ResourceNotFoundException("No join request from this user"));
        request.setStatus(MeetingJoinRequest.JoinRequestStatus.DENIED);
        joinRequestRepository.save(request);

        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/waiting-room/" + targetUserId,
                Map.of("status", "DENIED"));
    }

    // ══════════════════════════════════════════════════════════════════════
    // MODERATION (host / co-host only)
    // ══════════════════════════════════════════════════════════════════════

    @Transactional
    public void promoteToCoHost(String hostEmail, Long meetingId, Long targetUserId) {
        User host = findUser(hostEmail);
        Meeting meeting = findMeeting(meetingId);
        requireHost(host, meeting); // only the true host can grant co-host, not another co-host

        MeetingAttendance attendance = requireAttendance(meeting, targetUserId);
        attendance.setRole(MeetingAttendance.MeetingRole.CO_HOST);
        attendanceRepository.save(attendance);
        broadcastModeration(meetingId, "PROMOTED", targetUserId, null);
    }

    @Transactional
    public void demoteToParticipant(String hostEmail, Long meetingId, Long targetUserId) {
        User host = findUser(hostEmail);
        Meeting meeting = findMeeting(meetingId);
        requireHost(host, meeting);

        MeetingAttendance attendance = requireAttendance(meeting, targetUserId);
        if (attendance.getRole() == MeetingAttendance.MeetingRole.HOST)
            throw new BadRequestException("Cannot demote the meeting host");
        attendance.setRole(MeetingAttendance.MeetingRole.PARTICIPANT);
        attendanceRepository.save(attendance);
        broadcastModeration(meetingId, "DEMOTED", targetUserId, null);
    }

    @Transactional
    public void kickParticipant(String modEmail, Long meetingId, Long targetUserId) {
        User moderator = findUser(modEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(moderator, meeting);

        MeetingAttendance attendance = requireAttendance(meeting, targetUserId);
        if (attendance.getRole() == MeetingAttendance.MeetingRole.HOST)
            throw new BadRequestException("Cannot kick the meeting host");

        liveKitService.kickParticipant(meeting.getRoomName(), targetUserId);
        closeAttendanceSession(meeting, attendance.getUser());
        broadcastModeration(meetingId, "KICKED", targetUserId, moderator.getId());
    }

    @Transactional
    public void setParticipantAudio(String modEmail, Long meetingId, Long targetUserId, boolean muted) {
        User moderator = findUser(modEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(moderator, meeting);

        MeetingAttendance attendance = requireAttendance(meeting, targetUserId);
        liveKitService.setTrackMuted(meeting.getRoomName(), targetUserId, true, muted);
        attendance.setMicMuted(muted);
        attendanceRepository.save(attendance);
        broadcastModeration(meetingId, muted ? "MIC_MUTED" : "MIC_UNMUTED", targetUserId, moderator.getId());
    }

    @Transactional
    public void setParticipantVideo(String modEmail, Long meetingId, Long targetUserId, boolean off) {
        User moderator = findUser(modEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(moderator, meeting);

        MeetingAttendance attendance = requireAttendance(meeting, targetUserId);
        liveKitService.setTrackMuted(meeting.getRoomName(), targetUserId, false, off);
        attendance.setCameraOff(off);
        attendanceRepository.save(attendance);
        broadcastModeration(meetingId, off ? "CAMERA_OFF" : "CAMERA_ON", targetUserId, moderator.getId());
    }

    @Transactional
    public void muteAll(String modEmail, Long meetingId) {
        User moderator = findUser(modEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(moderator, meeting);

        liveKitService.muteAllExcept(meeting.getRoomName(), moderator.getId());
        List<MeetingAttendance> all = attendanceRepository.findByMeeting(meeting);
        for (MeetingAttendance a : all) {
            if (a.getUser().getId().equals(moderator.getId())) continue;
            a.setMicMuted(true);
        }
        attendanceRepository.saveAll(all);
        broadcastModeration(meetingId, "MUTE_ALL", null, moderator.getId());
    }

    @Transactional
    public MeetingResponse setLocked(String modEmail, Long meetingId, boolean locked) {
        User moderator = findUser(modEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(moderator, meeting);
        meeting.setLocked(locked);
        meeting = meetingRepository.save(meeting);
        broadcastLifecycle(meetingId, locked ? "LOCKED" : "UNLOCKED");
        return MeetingResponse.from(meeting);
    }

    @Transactional
    public MeetingResponse setChatMode(String modEmail, Long meetingId, Meeting.ChatMode chatMode) {
        User moderator = findUser(modEmail);
        Meeting meeting = findMeeting(meetingId);
        requireModerator(moderator, meeting);
        meeting.setChatMode(chatMode);
        meeting = meetingRepository.save(meeting);
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/lifecycle",
                Map.of("event", "CHAT_MODE_CHANGED", "chatMode", chatMode.name()));
        return MeetingResponse.from(meeting);
    }

    // ══════════════════════════════════════════════════════════════════════
    // HAND RAISE & SCREEN SHARE
    // ══════════════════════════════════════════════════════════════════════

    @Transactional
    public boolean toggleHandRaise(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        MeetingAttendance attendance = requireAttendance(meeting, user.getId());
        attendance.setHandRaised(!Boolean.TRUE.equals(attendance.getHandRaised()));
        attendanceRepository.save(attendance);
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/participants",
                Map.of("event", "HAND_RAISE", "userId", user.getId(), "raised", attendance.getHandRaised()));
        return attendance.getHandRaised();
    }

    @Transactional
    public void startScreenShare(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        requireAccess(user, meeting);

        if (meeting.getActiveScreenShareUserId() != null
                && !meeting.getActiveScreenShareUserId().equals(user.getId())) {
            throw new BadRequestException("Someone else is already sharing their screen");
        }
        meeting.setActiveScreenShareUserId(user.getId());
        meetingRepository.save(meeting);
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/participants",
                Map.of("event", "SCREEN_SHARE_STARTED", "userId", user.getId()));
    }

    @Transactional
    public void stopScreenShare(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        MeetingAttendance.MeetingRole role = resolveRole(meeting, user);

        boolean isOwner = user.getId().equals(meeting.getActiveScreenShareUserId());
        if (!isOwner && !role.isModerator())
            throw new BadRequestException("Only the presenter or host can stop this screen share");

        Long sharer = meeting.getActiveScreenShareUserId();
        meeting.setActiveScreenShareUserId(null);
        meetingRepository.save(meeting);
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/participants",
                Map.of("event", "SCREEN_SHARE_STOPPED", "userId", sharer != null ? sharer : user.getId()));
    }

    // ══════════════════════════════════════════════════════════════════════
    // CHAT
    // ══════════════════════════════════════════════════════════════════════

    @Transactional
    public MeetingChatResponse sendChatMessage(String senderEmail, Long meetingId, MeetingChatSendRequest req) {
        User sender = findUser(senderEmail);
        Meeting meeting = findMeeting(meetingId);
        requireAccess(sender, meeting);

        MeetingAttendance.MeetingRole role = resolveRole(meeting, sender);
        Long recipientId = req.getRecipientId();

        if (recipientId == null && !role.isModerator()) {
            switch (meeting.getChatMode()) {
                case PRIVATE_TO_HOST_ONLY -> recipientId = meeting.getTeacher().getId(); // auto-route to host
                case HOST_ONLY_BROADCAST -> throw new BadRequestException(
                        "Only the host can message everyone right now. Send a private message instead.");
                default -> { /* EVERYONE — public message allowed */ }
            }
        }

        User recipient = recipientId != null ? findUserById(recipientId) : null;

        MeetingChatMessage message = MeetingChatMessage.builder()
                .meetingId(meetingId)
                .senderId(sender.getId())
                .senderUsername(sender.getUsername())
                .senderFullName(sender.getFullName())
                .senderAvatarUrl(sender.getAvatarUrl())
                .content(req.getContent())
                .recipientId(recipientId)
                .recipientUsername(recipient != null ? recipient.getUsername() : null)
                .createdAt(LocalDateTime.now())
                .build();
        message = chatRepository.save(message);

        MeetingChatResponse response = MeetingChatResponse.from(message);

        if (recipientId == null) {
            messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/chat", response);
        } else {
            // Per-user topic, not /user/.../queue — see note in approveJoinRequest()
            messagingTemplate.convertAndSend(
                    "/topic/meeting/" + meetingId + "/chat/private/" + recipientId, response);
            if (!recipientId.equals(sender.getId())) {
                messagingTemplate.convertAndSend(
                        "/topic/meeting/" + meetingId + "/chat/private/" + sender.getId(), response);
            }
        }
        return response;
    }

    public List<MeetingChatResponse> getChatHistory(String userEmail, Long meetingId) {
        User user = findUser(userEmail);
        Meeting meeting = findMeeting(meetingId);
        requireAccess(user, meeting);
        return chatRepository.findVisibleToUser(meetingId, user.getId()).stream()
                .sorted(Comparator.comparing(MeetingChatMessage::getCreatedAt))
                .map(MeetingChatResponse::from)
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // WEBHOOK FALLBACK (defense-in-depth for attendance accuracy)
    // ══════════════════════════════════════════════════════════════════════

    @Transactional
    public void handleParticipantDisconnected(String roomName, Long userId) {
        meetingRepository.findByRoomName(roomName).ifPresent(meeting -> {
            if (meeting.getStatus() != Meeting.MeetingStatus.LIVE) return;
            userRepository.findById(userId).ifPresent(u -> closeAttendanceSession(meeting, u));
            broadcastParticipants(meeting.getId(), "LEFT", userId);
        });
    }

    @Transactional
    public void handleRoomFinished(String roomName) {
        meetingRepository.findByRoomName(roomName).ifPresent(this::endMeetingInternal);
    }

    // ══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private Meeting findMeeting(Long id) {
        return meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found: " + id));
    }

    private MeetingAttendance requireAttendance(Meeting meeting, Long userId) {
        User user = findUserById(userId);
        return attendanceRepository.findByMeetingAndUser(meeting, user)
                .orElseThrow(() -> new ResourceNotFoundException("User has no attendance record for this meeting"));
    }

    private void requireAccess(User user, Meeting meeting) {
        boolean isHost = meeting.getTeacher().getId().equals(user.getId());
        boolean isEnrolled = user.isStudent()
                && enrollmentRepository.isStudentEnrolledUnderTeacher(meeting.getTeacher(), user);
        if (!isHost && !isEnrolled)
            throw new BadRequestException("You don't have access to this meeting");
    }

    private void requireHost(User user, Meeting meeting) {
        if (!meeting.getTeacher().getId().equals(user.getId()))
            throw new BadRequestException("Only the meeting host can perform this action");
    }

    private void requireModerator(User user, Meeting meeting) {
        MeetingAttendance.MeetingRole role = resolveRole(meeting, user);
        if (!role.isModerator())
            throw new BadRequestException("Only the host or co-host can perform this action");
    }

    private MeetingAttendance.MeetingRole resolveRole(Meeting meeting, User user) {
        if (meeting.getTeacher().getId().equals(user.getId())) return MeetingAttendance.MeetingRole.HOST;
        return attendanceRepository.findByMeetingAndUser(meeting, user)
                .map(MeetingAttendance::getRole)
                .orElse(MeetingAttendance.MeetingRole.PARTICIPANT);
    }

    private void broadcastLifecycle(Long meetingId, String event) {
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/lifecycle",
                Map.of("event", event));
    }

    private void broadcastParticipants(Long meetingId, String event, Long userId) {
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/participants",
                Map.of("event", event, "userId", userId));
    }

    private void broadcastModeration(Long meetingId, String action, Long targetUserId, Long actorId) {
        messagingTemplate.convertAndSend("/topic/meeting/" + meetingId + "/moderation",
                Map.of("action", action,
                        "targetUserId", targetUserId != null ? targetUserId : 0,
                        "actorId", actorId != null ? actorId : 0));
    }

    // ══════════════════════════════════════════════════════════════════════
    // Exposed for the auto-end scheduler
    // ══════════════════════════════════════════════════════════════════════

    public List<Meeting> findStaleLiveMeetings() {
        return meetingRepository.findStaleLiveMeetings(LocalDateTime.now().minusMinutes(autoEndGraceMinutes));
    }
}
