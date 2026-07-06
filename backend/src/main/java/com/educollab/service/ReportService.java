package com.educollab.service;

import com.educollab.document.Post;
import com.educollab.document.Report;
import com.educollab.dto.request.ResolveReportRequest;
import com.educollab.dto.request.SubmitReportRequest;
import com.educollab.dto.response.ReportResponse;
import com.educollab.entity.AuditLog;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.EnrollmentRepository;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.MessageRepository;
import com.educollab.repository.mongo.PostRepository;
import com.educollab.repository.mongo.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuditLogService auditLogService;

    private static final int SNAPSHOT_MAX_LEN = 200;

    // ── Submit (any authenticated user) ────────────────────────────────────
    public ReportResponse submitReport(String reporterEmail, SubmitReportRequest req) {
        User reporter = findUser(reporterEmail);

        Long reportedUserId;
        String reportedUserName;
        String snapshot;

        switch (req.getContentType()) {
            case POST -> {
                Post post = postRepository.findByIdAndDeletedFalse(req.getContentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
                reportedUserId = post.getAuthorId();
                reportedUserName = post.getAuthorFullName();
                snapshot = truncate(post.getContent());
            }
            case COMMENT -> {
                if (req.getCommentId() == null || req.getCommentId().isBlank())
                    throw new BadRequestException("commentId is required for COMMENT reports");
                Post post = postRepository.findByIdAndDeletedFalse(req.getContentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
                Post.Comment comment = post.getComments().stream()
                        .filter(c -> c.getId().equals(req.getCommentId()) && !c.isDeleted())
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
                reportedUserId = comment.getAuthorId();
                reportedUserName = comment.getAuthorFullName();
                snapshot = truncate(comment.getContent());
            }
            case MESSAGE -> {
                var message = messageRepository.findById(req.getContentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
                reportedUserId = message.getSenderId();
                reportedUserName = message.getSenderFullName();
                snapshot = truncate(message.getContent());
            }
            default -> throw new BadRequestException("Unsupported content type");
        }

        if (reportedUserId.equals(reporter.getId()))
            throw new BadRequestException("You can't report your own content");

        Report report = Report.builder()
                .reporterId(reporter.getId())
                .reporterName(reporter.getFullName())
                .reportedUserId(reportedUserId)
                .reportedUserName(reportedUserName)
                .contentType(req.getContentType())
                .contentId(req.getContentId())
                .commentId(req.getCommentId())
                .contentSnapshot(snapshot)
                .reason(req.getReason())
                .description(req.getDescription())
                .status(Report.ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        return ReportResponse.from(reportRepository.save(report));
    }

    // ── List (teacher sees reports about their own enrolled students) ─────
    public List<ReportResponse> listReportsForTeacher(String teacherEmail, String statusFilter) {
        User teacher = findUser(teacherEmail);
        List<Long> myStudentIds = enrollmentRepository.findStudentsByTeacher(teacher).stream()
                .map(User::getId).collect(Collectors.toList());
        if (myStudentIds.isEmpty()) return List.of();

        List<Report> reports = (statusFilter == null || statusFilter.equalsIgnoreCase("all"))
                ? reportRepository.findByReportedUserIdInOrderByCreatedAtDesc(myStudentIds)
                : reportRepository.findByReportedUserIdInAndStatusOrderByCreatedAtDesc(
                        myStudentIds, Report.ReportStatus.valueOf(statusFilter.toUpperCase()));

        return reports.stream().map(ReportResponse::from).collect(Collectors.toList());
    }

    // ── Resolve / dismiss (teacher, only for their own students' content) ─
    @Transactional
    public ReportResponse resolveReport(String teacherEmail, String reportId, ResolveReportRequest req) {
        return finalizeReport(teacherEmail, reportId, Report.ReportStatus.RESOLVED, req.getNotes(),
                AuditLog.ActionType.REPORT_RESOLVED);
    }

    @Transactional
    public ReportResponse dismissReport(String teacherEmail, String reportId, ResolveReportRequest req) {
        return finalizeReport(teacherEmail, reportId, Report.ReportStatus.DISMISSED, req.getNotes(),
                AuditLog.ActionType.REPORT_DISMISSED);
    }

    private ReportResponse finalizeReport(String teacherEmail, String reportId, Report.ReportStatus status,
                                           String notes, AuditLog.ActionType actionType) {
        User teacher = findUser(teacherEmail);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        if (!enrollmentRepository.isStudentEnrolledUnderTeacher(teacher,
                userRepository.findById(report.getReportedUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("Reported user not found")))) {
            throw new BadRequestException("You don't have authority over this report");
        }

        report.setStatus(status);
        report.setResolvedAt(LocalDateTime.now());
        report.setResolvedByTeacherId(teacher.getId());
        report.setResolutionNotes(notes);
        Report saved = reportRepository.save(report);

        auditLogService.log(teacher, actionType, "REPORT", reportId,
                "Report against " + report.getReportedUserName() + " — " + status);

        return ReportResponse.from(saved);
    }

    private String truncate(String text) {
        if (text == null) return "";
        return text.length() > SNAPSHOT_MAX_LEN ? text.substring(0, SNAPSHOT_MAX_LEN) + "..." : text;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
