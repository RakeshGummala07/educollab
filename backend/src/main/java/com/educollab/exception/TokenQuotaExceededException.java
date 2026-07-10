package com.educollab.exception;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class TokenQuotaExceededException extends RuntimeException {

    private final LocalDateTime resetAt;
    private final boolean windowExhausted;
    private final boolean dailyExhausted;

    public TokenQuotaExceededException(String message, LocalDateTime resetAt,
                                        boolean windowExhausted, boolean dailyExhausted) {
        super(message);
        this.resetAt = resetAt;
        this.windowExhausted = windowExhausted;
        this.dailyExhausted = dailyExhausted;
    }
}
