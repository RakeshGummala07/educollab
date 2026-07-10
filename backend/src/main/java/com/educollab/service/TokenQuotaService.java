package com.educollab.service;

import com.educollab.dto.response.AiUsageResponse;
import com.educollab.entity.AiTokenUsage;
import com.educollab.entity.User;
import com.educollab.exception.TokenQuotaExceededException;
import com.educollab.repository.AiTokenUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Enforces two independent per-user AI token budgets, mirroring how
 * Claude Code's usage limits work:
 *   - a rolling window (e.g. 50,000 tokens / 5 hours) that resets exactly
 *     5 hours after the window's first recorded use — not on a fixed clock
 *   - a hard daily cap (e.g. 150,000 tokens/day) resetting at local midnight
 *
 * Real token counts come from the LLM provider's own response usage
 * metadata (see AiChatService), never estimated client-side.
 */
@Service
@RequiredArgsConstructor
public class TokenQuotaService {

    private final AiTokenUsageRepository usageRepository;

    @Value("${app.ai-quota.window-hours:5}")
    private long windowHours;

    @Value("${app.ai-quota.window-token-limit:50000}")
    private long windowTokenLimit;

    @Value("${app.ai-quota.daily-token-limit:150000}")
    private long dailyTokenLimit;

    /**
     * Call BEFORE making an AI request. Throws if either budget is already
     * exhausted; otherwise returns normally (does not reserve/deduct —
     * actual usage is recorded after the call completes via recordUsage()).
     */
    @Transactional
    public void checkQuotaOrThrow(User user) {
        AiTokenUsage usage = loadOrCreateForUpdate(user);
        normalize(usage);
        throwIfExhausted(usage);
        usageRepository.save(usage);
    }

    /** Call AFTER an AI request completes, with the ACTUAL token count used. */
    @Transactional
    public void recordUsage(User user, long tokensUsed) {
        if (tokensUsed <= 0) return;
        AiTokenUsage usage = loadOrCreateForUpdate(user);
        normalize(usage);
        usage.setTokensUsedInWindow(usage.getTokensUsedInWindow() + tokensUsed);
        usage.setTokensUsedToday(usage.getTokensUsedToday() + tokensUsed);
        usageRepository.save(usage);
    }

    /** Read-only snapshot for the UI's usage meter — never throws. */
    @Transactional
    public AiUsageResponse getUsage(User user) {
        AiTokenUsage usage = loadOrCreateForUpdate(user);
        normalize(usage);
        usageRepository.save(usage);

        boolean windowExhausted = usage.getTokensUsedInWindow() >= windowTokenLimit;
        boolean dailyExhausted = usage.getTokensUsedToday() >= dailyTokenLimit;

        return AiUsageResponse.builder()
                .tokensUsedInWindow(usage.getTokensUsedInWindow())
                .windowTokenLimit(windowTokenLimit)
                .windowResetAt(usage.getWindowStartAt().plusHours(windowHours))
                .tokensUsedToday(usage.getTokensUsedToday())
                .dailyTokenLimit(dailyTokenLimit)
                .dailyResetAt(usage.getDailyStartDate().plusDays(1).atStartOfDay())
                .exhausted(windowExhausted || dailyExhausted)
                .build();
    }

    // ── Internals ────────────────────────────────────────────────────────

    private AiTokenUsage loadOrCreateForUpdate(User user) {
        return usageRepository.findByUserForUpdate(user)
                .orElseGet(() -> AiTokenUsage.freshFor(user));
    }

    // Rolls the window/day forward if their period has elapsed. Must run
    // before every read AND every write so stale counters never linger.
    private void normalize(AiTokenUsage usage) {
        LocalDateTime now = LocalDateTime.now();

        if (usage.getWindowStartAt() == null
                || !now.isBefore(usage.getWindowStartAt().plusHours(windowHours))) {
            usage.setWindowStartAt(now);
            usage.setTokensUsedInWindow(0L);
        }

        LocalDate today = now.toLocalDate();
        if (usage.getDailyStartDate() == null || !usage.getDailyStartDate().isEqual(today)) {
            usage.setDailyStartDate(today);
            usage.setTokensUsedToday(0L);
        }
    }

    private void throwIfExhausted(AiTokenUsage usage) {
        boolean windowExhausted = usage.getTokensUsedInWindow() >= windowTokenLimit;
        boolean dailyExhausted = usage.getTokensUsedToday() >= dailyTokenLimit;

        if (!windowExhausted && !dailyExhausted) return;

        LocalDateTime windowResetAt = usage.getWindowStartAt().plusHours(windowHours);
        LocalDateTime dailyResetAt = usage.getDailyStartDate().plusDays(1).atStartOfDay();

        // If both are exhausted, you're blocked until the LATER of the two
        // clears — clearing only one still leaves you blocked by the other.
        LocalDateTime resetAt;
        if (windowExhausted && dailyExhausted) {
            resetAt = windowResetAt.isAfter(dailyResetAt) ? windowResetAt : dailyResetAt;
        } else if (windowExhausted) {
            resetAt = windowResetAt;
        } else {
            resetAt = dailyResetAt;
        }

        String reason = dailyExhausted && windowExhausted
                ? "You've used all your AI tokens for this 5-hour window and today's daily limit."
                : dailyExhausted
                    ? "You've reached today's AI token limit."
                    : "You've used all your AI tokens for this 5-hour window.";

        throw new TokenQuotaExceededException(reason, resetAt, windowExhausted, dailyExhausted);
    }
}
