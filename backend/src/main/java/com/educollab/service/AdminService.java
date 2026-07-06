package com.educollab.service;

import com.educollab.document.Post;
import com.educollab.document.Notification;
import com.educollab.dto.request.RestrictChatRequest;
import com.educollab.dto.response.AdminStudentResponse;
import com.educollab.dto.response.AnalyticsResponse;
import com.educollab.dto.response.AuditLogResponse;
import com.educollab.entity.AuditLog;
import com.educollab.entity.Meeting;
import com.educollab.entity.MeetingAttendance;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.AuditLogRepository;
import com.educollab.repository.EnrollmentRepository;
import com.educollab.repository.MeetingAttendanceRepository;
import com.educollab.repository.MeetingRepository;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.PostRepository;
import com.educollab.repository.mongo.ReportRepository;
import com.educollab.document.Report;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final MeetingRepository meetingRepository;
    private final MeetingAttendanceRepository attendanceRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;

    // ══════════════════════════════════════════════════════════════════════
    // STUDENT MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════

    public List<AdminStudentResponse> listMyStudents(String teacherEmail) {
        User teacher = findUser(teacherEmail);
        return enrollmentRepository.findStudentsByTeacher(teacher).stream()
                .map(AdminStudentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeStudent(String teacherEmail, Long studentId) {
        User teacher = findUser(teacherEmail);
        User student = requireOwnStudent(teacher, studentId);

        enrollmentService.removeStudent(teacher.getId(), studentId);

        auditLogService.log(teacher, AuditLog.ActionType.STUDENT_REMOVED, "USER",
                String.valueOf(studentId), "Removed " + student.getFullName() + " from classroom");
    }

    @Transactional
    public AdminStudentResponse restrictChat(String teacherEmail, Long studentId, RestrictChatRequest req) {
        User teacher = findUser(teacherEmail);
        User student = requireOwnStudent(teacher, studentId);

        student.setChatRestricted(true);
        student.setChatRestrictedReason(req.getReason());
        student.setChatRestrictedAt(LocalDateTime.now());
        student = userRepository.save(student);

        auditLogService.log(teacher, AuditLog.ActionType.CHAT_RESTRICTED, "USER",
                String.valueOf(studentId), req.getReason());

        notificationService.notify(student.getId(), teacher.getId(),
                Notification.NotificationType.CHAT_RESTRICTED,
                "Your chat access has been restricted",
                teacher.getFullName() + " restricted your chat access: " + req.getReason(),
                "USER", String.valueOf(studentId));

        return AdminStudentResponse.from(student);
    }

    @Transactional
    public AdminStudentResponse unrestrictChat(String teacherEmail, Long studentId) {
        User teacher = findUser(teacherEmail);
        User student = requireOwnStudent(teacher, studentId);

        student.setChatRestricted(false);
        student.setChatRestrictedReason(null);
        student.setChatRestrictedAt(null);
        student = userRepository.save(student);

        auditLogService.log(teacher, AuditLog.ActionType.CHAT_UNRESTRICTED, "USER",
                String.valueOf(studentId), "Chat restriction lifted");

        notificationService.notify(student.getId(), teacher.getId(),
                Notification.NotificationType.CHAT_UNRESTRICTED,
                "Your chat access has been restored",
                teacher.getFullName() + " lifted your chat restriction — you can chat again",
                "USER", String.valueOf(studentId));

        return AdminStudentResponse.from(student);
    }

    @Transactional
    public AdminStudentResponse lockAccount(String teacherEmail, Long studentId) {
        User teacher = findUser(teacherEmail);
        User student = requireOwnStudent(teacher, studentId);

        student.setAccountNonLocked(false);
        student = userRepository.save(student);

        auditLogService.log(teacher, AuditLog.ActionType.ACCOUNT_LOCKED, "USER",
                String.valueOf(studentId), "Account suspended by teacher");

        return AdminStudentResponse.from(student);
    }

    @Transactional
    public AdminStudentResponse unlockAccount(String teacherEmail, Long studentId) {
        User teacher = findUser(teacherEmail);
        User student = requireOwnStudent(teacher, studentId);

        student.setAccountNonLocked(true);
        student = userRepository.save(student);

        auditLogService.log(teacher, AuditLog.ActionType.ACCOUNT_UNLOCKED, "USER",
                String.valueOf(studentId), "Account unsuspended by teacher");

        return AdminStudentResponse.from(student);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ANALYTICS
    // ══════════════════════════════════════════════════════════════════════

    public AnalyticsResponse getAnalytics(String teacherEmail) {
        User teacher = findUser(teacherEmail);
        List<User> students = enrollmentRepository.findStudentsByTeacher(teacher);
        List<Long> studentAndSelfIds = students.stream().map(User::getId).collect(Collectors.toList());
        studentAndSelfIds.add(teacher.getId());

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<Post> recentPosts = postRepository.findByAuthorIdInAndCreatedAtAfterAndDeletedFalse(
                studentAndSelfIds, weekAgo);

        List<Meeting> allMeetings = meetingRepository.findByTeacher(teacher);
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        List<Meeting> meetingsThisMonth = allMeetings.stream()
                .filter(m -> m.getStatus() == Meeting.MeetingStatus.ENDED
                        && m.getActualStart() != null
                        && !m.getActualStart().toLocalDate().isBefore(monthStart))
                .collect(Collectors.toList());

        double avgAttendance = computeAverageAttendanceRate(meetingsThisMonth, teacher.getId());

        List<Long> studentIds = students.stream().map(User::getId).collect(Collectors.toList());
        long pendingReports = studentIds.isEmpty() ? 0
                : reportRepository.countByReportedUserIdInAndStatus(studentIds, Report.ReportStatus.PENDING);

        long restrictedCount = students.stream().filter(s -> Boolean.TRUE.equals(s.getChatRestricted())).count();

        return AnalyticsResponse.builder()
                .totalStudents(students.size())
                .pendingEnrollmentRequests(enrollmentService.getPendingRequests(teacher.getId()).size())
                .postsThisWeek(recentPosts.size())
                .meetingsHeldThisMonth(meetingsThisMonth.size())
                .averageAttendanceRate(avgAttendance)
                .pendingReports(pendingReports)
                .restrictedStudentsCount(restrictedCount)
                .postsLast7Days(buildDailyCounts(recentPosts))
                .build();
    }

    private double computeAverageAttendanceRate(List<Meeting> meetings, Long teacherId) {
        if (meetings.isEmpty()) return 0.0;
        double totalRatio = 0.0;
        int counted = 0;
        for (Meeting m : meetings) {
            List<MeetingAttendance> rows = attendanceRepository.findByMeeting(m).stream()
                    .filter(a -> !a.getUser().getId().equals(teacherId))
                    .collect(Collectors.toList());
            if (rows.isEmpty()) continue;
            long present = rows.stream().filter(a -> a.getStatus() == MeetingAttendance.AttendanceStatus.PRESENT).count();
            totalRatio += (double) present / rows.size();
            counted++;
        }
        return counted == 0 ? 0.0 : Math.round((totalRatio / counted) * 1000) / 10.0; // one decimal place
    }

    private List<AnalyticsResponse.DailyCount> buildDailyCounts(List<Post> posts) {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        Map<String, Long> grouped = posts.stream()
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().toLocalDate().format(fmt), Collectors.counting()));

        return java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(i -> LocalDate.now().minusDays(6 - i))
                .map(date -> AnalyticsResponse.DailyCount.builder()
                        .date(date.format(fmt))
                        .count(grouped.getOrDefault(date.format(fmt), 0L))
                        .build())
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════════════════
    // AUDIT LOG
    // ══════════════════════════════════════════════════════════════════════

    public Page<AuditLogResponse> getAuditLog(String teacherEmail, Pageable pageable) {
        User teacher = findUser(teacherEmail);
        return auditLogRepository.findByActor(teacher, pageable).map(AuditLogResponse::from);
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private User requireOwnStudent(User teacher, Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        if (!enrollmentRepository.isStudentEnrolledUnderTeacher(teacher, student))
            throw new BadRequestException("This student is not enrolled under you");
        return student;
    }
}