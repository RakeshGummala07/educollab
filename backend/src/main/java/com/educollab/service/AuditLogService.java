package com.educollab.service;

import com.educollab.entity.AuditLog;
import com.educollab.entity.User;
import com.educollab.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(User actor, AuditLog.ActionType actionType, String targetType, String targetId, String details) {
        auditLogRepository.save(AuditLog.builder()
                .actor(actor)
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .details(details)
                .build());
    }
}
