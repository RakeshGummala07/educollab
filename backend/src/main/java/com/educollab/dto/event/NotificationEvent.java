package com.educollab.dto.event;

import com.educollab.document.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {

    private Long recipientId;
    private String recipientEmail;     // needed for the email consumer
    private String recipientName;

    private Long actorId;
    private String actorUsername;
    private String actorFullName;
    private String actorAvatarUrl;

    private Notification.NotificationType type;

    private String title;
    private String message;

    private String entityType;
    private String entityId;
}
