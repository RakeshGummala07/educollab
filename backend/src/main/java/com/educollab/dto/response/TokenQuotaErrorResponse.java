package com.educollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TokenQuotaErrorResponse {
    private LocalDateTime resetAt;
    private long secondsUntilReset;
    private boolean windowExhausted;
    private boolean dailyExhausted;
}
