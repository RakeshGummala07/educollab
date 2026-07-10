package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "ai_chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatMessage {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    private Long userId;

    private Role role;

    private String content;

    // IDs of StudyDocuments consulted for this answer (RAG citations),
    // empty/null for plain chat turns that didn't use retrieval
    private List<String> sourceDocumentIds;

    // Only populated on ASSISTANT messages — actual usage from the LLM
    // provider's response metadata, used to feed TokenQuotaService
    private Integer tokensUsed;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum Role {
        USER, ASSISTANT
    }
}
