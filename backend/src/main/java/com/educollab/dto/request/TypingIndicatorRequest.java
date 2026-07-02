package com.educollab.dto.request;

import lombok.Data;

@Data
public class TypingIndicatorRequest {
    private String conversationId;
    private boolean typing;
}
