package com.educollab.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiUsageResponse {

    private long tokensUsedInWindow;
    private long windowTokenLimit;
    private LocalDateTime windowResetAt;

    private long tokensUsedToday;
    private long dailyTokenLimit;
    private LocalDateTime dailyResetAt;

    private boolean exhausted;
}
