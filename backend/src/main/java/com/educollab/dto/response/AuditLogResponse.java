package com.educollab.dto.response;

import com.educollab.entity.AuditLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {

    private Long id;
    private String actorName;
    private AuditLog.ActionType actionType;
    private String targetType;
    private String targetId;
    private String details;
    private LocalDateTime createdAt;

    public static AuditLogResponse from(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .actorName(a.getActor().getFullName())
                .actionType(a.getActionType())
                .targetType(a.getTargetType())
                .targetId(a.getTargetId())
                .details(a.getDetails())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
