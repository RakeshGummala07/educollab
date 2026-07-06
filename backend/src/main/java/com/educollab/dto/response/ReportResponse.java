package com.educollab.dto.response;

import com.educollab.document.Report;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {

    private String id;
    private Long reporterId;
    private String reporterName;
    private Long reportedUserId;
    private String reportedUserName;
    private Report.ContentType contentType;
    private String contentId;
    private String commentId;
    private String contentSnapshot;
    private Report.ReportReason reason;
    private String description;
    private Report.ReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;

    public static ReportResponse from(Report r) {
        return ReportResponse.builder()
                .id(r.getId())
                .reporterId(r.getReporterId())
                .reporterName(r.getReporterName())
                .reportedUserId(r.getReportedUserId())
                .reportedUserName(r.getReportedUserName())
                .contentType(r.getContentType())
                .contentId(r.getContentId())
                .commentId(r.getCommentId())
                .contentSnapshot(r.getContentSnapshot())
                .reason(r.getReason())
                .description(r.getDescription())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .resolvedAt(r.getResolvedAt())
                .resolutionNotes(r.getResolutionNotes())
                .build();
    }
}
