package com.educollab.dto.response;

import com.educollab.document.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private Long actorId;
    private String actorUsername;
    private String actorFullName;
    private String actorAvatarUrl;
    private String type;
    private String title;
    private String message;
    private String entityType;
    private String entityId;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .actorId(n.getActorId())
                .actorUsername(n.getActorUsername())
                .actorFullName(n.getActorFullName())
                .actorAvatarUrl(n.getActorAvatarUrl())
                .type(n.getType() != null ? n.getType().name() : "SYSTEM")
                .title(n.getTitle())
                .message(n.getMessage())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
