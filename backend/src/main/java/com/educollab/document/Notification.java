package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    @Indexed
    private Long recipientId;          // Who receives this notification

    private Long actorId;              // Who triggered it (liker, commenter, sender)
    private String actorUsername;
    private String actorFullName;
    private String actorAvatarUrl;

    private NotificationType type;

    private String title;
    private String message;

    // Deep-link info — where clicking the notification should take the user
    private String entityType;         // "POST", "COMMENT", "CONVERSATION", "ENROLLMENT"
    private String entityId;

    @Builder.Default
    private boolean read = false;

    @Builder.Default
    private boolean emailSent = false;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum NotificationType {
        POST_LIKE,
        POST_COMMENT,
        COMMENT_REPLY,
        POST_SHARE,
        NEW_MESSAGE,
        ENROLLMENT_REQUEST,
        ENROLLMENT_APPROVED,
        ENROLLMENT_REJECTED,
        STUDENT_REMOVED,
        MEETING_SCHEDULED,
        MEETING_STARTED,
        SYSTEM
    }
}
