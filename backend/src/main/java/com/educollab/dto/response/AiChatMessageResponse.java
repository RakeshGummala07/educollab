package com.educollab.dto.response;

import com.educollab.document.AiChatMessage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AiChatMessageResponse {

    private String id;
    private String conversationId;
    private AiChatMessage.Role role;
    private String content;
    private List<String> sourceDocumentIds;
    private LocalDateTime createdAt;

    public static AiChatMessageResponse from(AiChatMessage m) {
        return AiChatMessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .role(m.getRole())
                .content(m.getContent())
                .sourceDocumentIds(m.getSourceDocumentIds())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
