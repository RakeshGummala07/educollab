package com.educollab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One row per user. Tracks AI token consumption against two independent
 * limits (whichever binds first blocks further use):
 *   - a rolling window (e.g. 50,000 tokens per 5 hours, resetting 5 hours
 *     after the window's first use — same spirit as Claude Code's usage limits)
 *   - a hard daily cap (e.g. 150,000 tokens/day, resetting at midnight)
 */
@Entity
@Table(name = "ai_token_usage")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTokenUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── Rolling window ───────────────────────────────────────────────────
    @Column(nullable = false)
    private LocalDateTime windowStartAt;

    @Column(nullable = false)
    @Builder.Default
    private Long tokensUsedInWindow = 0L;

    // ── Daily cap ────────────────────────────────────────────────────────
    @Column(nullable = false)
    private LocalDate dailyStartDate;

    @Column(nullable = false)
    @Builder.Default
    private Long tokensUsedToday = 0L;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public static AiTokenUsage freshFor(User user) {
        LocalDateTime now = LocalDateTime.now();
        return AiTokenUsage.builder()
                .user(user)
                .windowStartAt(now)
                .tokensUsedInWindow(0L)
                .dailyStartDate(now.toLocalDate())
                .tokensUsedToday(0L)
                .build();
    }
}
