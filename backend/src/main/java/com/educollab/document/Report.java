package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    private String id;

    private Long reporterId;
    private String reporterName;

    // The user who authored the reported content — teachers only see
    // reports where this is one of their own enrolled students
    @Indexed
    private Long reportedUserId;
    private String reportedUserName;

    @Indexed
    private ContentType contentType;

    // Mongo ObjectId string (Post/Comment/Message) — content type tells us which collection
    private String contentId;

    // Only set for COMMENT reports: comments are embedded inside Post
    // documents, so contentId is the parent Post's id and this identifies
    // the specific comment within it.
    private String commentId;

    // Short snapshot of the content at report time, so it's still reviewable
    // even if the original is later edited or deleted
    private String contentSnapshot;

    private ReportReason reason;
    private String description;

    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;
    private Long resolvedByTeacherId;
    private String resolutionNotes;

    public enum ContentType {
        POST, COMMENT, MESSAGE
    }

    public enum ReportReason {
        SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, MISINFORMATION, OTHER
    }

    public enum ReportStatus {
        PENDING, RESOLVED, DISMISSED
    }
}
