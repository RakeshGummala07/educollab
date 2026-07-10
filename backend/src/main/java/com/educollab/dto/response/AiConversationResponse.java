package com.educollab.dto.response;

import com.educollab.document.AiConversation;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiConversationResponse {

    private String id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;

    public static AiConversationResponse from(AiConversation c) {
        return AiConversationResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .createdAt(c.getCreatedAt())
                .lastMessageAt(c.getLastMessageAt())
                .build();
    }
}
