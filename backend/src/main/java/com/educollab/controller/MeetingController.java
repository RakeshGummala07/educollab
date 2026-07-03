package com.educollab.controller;

import com.educollab.dto.request.ChatModeUpdateRequest;
import com.educollab.dto.request.CreateMeetingRequest;
import com.educollab.dto.response.*;
import com.educollab.service.MeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MeetingController {

    private final MeetingService meetingService;

    // ── Create / list / detail ──────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<MeetingResponse>> createMeeting(
            @Valid @RequestBody CreateMeetingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        MeetingResponse meeting = meetingService.createMeeting(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Meeting created", meeting));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> listMeetings(
            @RequestParam(required = false, defaultValue = "all") String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Meetings loaded",
                meetingService.listMeetings(userDetails.getUsername(), status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MeetingResponse>> getMeeting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Meeting loaded",
                meetingService.getMeeting(userDetails.getUsername(), id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMeeting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.deleteMeeting(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Meeting deleted"));
    }

    // ── Lifecycle ────────────────────────────────────────────────────────
    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<MeetingResponse>> startMeeting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Meeting started",
                meetingService.startMeeting(userDetails.getUsername(), id)));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<JoinMeetingResponse>> joinMeeting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Join info generated",
                meetingService.joinMeeting(userDetails.getUsername(), id)));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveMeeting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.leaveMeeting(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Left meeting"));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<ApiResponse<MeetingResponse>> endMeeting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Meeting ended",
                meetingService.endMeeting(userDetails.getUsername(), id)));
    }

    // ── Attendance ───────────────────────────────────────────────────────
    @GetMapping("/{id}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendance(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Attendance loaded",
                meetingService.getAttendance(userDetails.getUsername(), id)));
    }

    // Lighter roster, open to any participant — powers the live "People" panel
    @GetMapping("/{id}/participants")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> listParticipants(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Participants loaded",
                meetingService.listParticipants(userDetails.getUsername(), id)));
    }

    // ── Waiting room ─────────────────────────────────────────────────────
    @GetMapping("/{id}/waiting-room")
    public ResponseEntity<ApiResponse<List<JoinRequestResponse>>> listWaiting(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Waiting room loaded",
                meetingService.listWaitingParticipants(userDetails.getUsername(), id)));
    }

    @PostMapping("/{id}/waiting-room/{userId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveWaiting(
            @PathVariable Long id, @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.approveJoinRequest(userDetails.getUsername(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Participant approved"));
    }

    @PostMapping("/{id}/waiting-room/{userId}/deny")
    public ResponseEntity<ApiResponse<Void>> denyWaiting(
            @PathVariable Long id, @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.denyJoinRequest(userDetails.getUsername(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Participant denied"));
    }

    // ── Moderation ───────────────────────────────────────────────────────
    @PostMapping("/{id}/participants/{userId}/promote")
    public ResponseEntity<ApiResponse<Void>> promote(
            @PathVariable Long id, @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.promoteToCoHost(userDetails.getUsername(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Promoted to co-host"));
    }

    @PostMapping("/{id}/participants/{userId}/demote")
    public ResponseEntity<ApiResponse<Void>> demote(
            @PathVariable Long id, @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.demoteToParticipant(userDetails.getUsername(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Demoted to participant"));
    }

    @PostMapping("/{id}/participants/{userId}/kick")
    public ResponseEntity<ApiResponse<Void>> kick(
            @PathVariable Long id, @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.kickParticipant(userDetails.getUsername(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Participant removed"));
    }

    @PostMapping("/{id}/participants/{userId}/mute-audio")
    public ResponseEntity<ApiResponse<Void>> muteAudio(
            @PathVariable Long id, @PathVariable Long userId,
            @RequestParam(defaultValue = "true") boolean muted,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.setParticipantAudio(userDetails.getUsername(), id, userId, muted);
        return ResponseEntity.ok(ApiResponse.success(muted ? "Muted" : "Unmuted"));
    }

    @PostMapping("/{id}/participants/{userId}/mute-video")
    public ResponseEntity<ApiResponse<Void>> muteVideo(
            @PathVariable Long id, @PathVariable Long userId,
            @RequestParam(defaultValue = "true") boolean off,
            @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.setParticipantVideo(userDetails.getUsername(), id, userId, off);
        return ResponseEntity.ok(ApiResponse.success(off ? "Camera turned off" : "Camera turned on"));
    }

    @PostMapping("/{id}/mute-all")
    public ResponseEntity<ApiResponse<Void>> muteAll(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.muteAll(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Everyone muted"));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<MeetingResponse>> lock(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Meeting locked",
                meetingService.setLocked(userDetails.getUsername(), id, true)));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<MeetingResponse>> unlock(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Meeting unlocked",
                meetingService.setLocked(userDetails.getUsername(), id, false)));
    }

    @PutMapping("/{id}/chat-mode")
    public ResponseEntity<ApiResponse<MeetingResponse>> setChatMode(
            @PathVariable Long id, @Valid @RequestBody ChatModeUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Chat mode updated",
                meetingService.setChatMode(userDetails.getUsername(), id, request.getChatMode())));
    }

    // ── Hand raise & screen share ────────────────────────────────────────
    @PostMapping("/{id}/hand-raise")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleHandRaise(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        boolean raised = meetingService.toggleHandRaise(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Hand raise toggled", Map.of("raised", raised)));
    }

    @PostMapping("/{id}/screen-share/start")
    public ResponseEntity<ApiResponse<Void>> startScreenShare(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.startScreenShare(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Screen share started"));
    }

    @PostMapping("/{id}/screen-share/stop")
    public ResponseEntity<ApiResponse<Void>> stopScreenShare(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        meetingService.stopScreenShare(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Screen share stopped"));
    }

    // ── Chat history (initial load — live messages arrive over WebSocket) ─
    @GetMapping("/{id}/chat")
    public ResponseEntity<ApiResponse<List<MeetingChatResponse>>> getChatHistory(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Chat history loaded",
                meetingService.getChatHistory(userDetails.getUsername(), id)));
    }
}
