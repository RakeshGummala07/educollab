package com.educollab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The teacher/admin who performed the action
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ActionType actionType;

    // e.g. "USER", "POST", "COMMENT", "MESSAGE", "REPORT"
    @Column(nullable = false, length = 20)
    private String targetType;

    // Kept as String since target IDs vary type (Long for MySQL entities,
    // ObjectId string for Mongo documents like Report/Post/Message)
    @Column(nullable = false, length = 50)
    private String targetId;

    @Column(length = 500)
    private String details;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ActionType {
        STUDENT_REMOVED,
        CHAT_RESTRICTED,
        CHAT_UNRESTRICTED,
        ACCOUNT_LOCKED,
        ACCOUNT_UNLOCKED,
        REPORT_RESOLVED,
        REPORT_DISMISSED
    }
}
