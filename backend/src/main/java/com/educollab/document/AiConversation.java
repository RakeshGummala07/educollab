package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "ai_conversations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConversation {

    @Id
    private String id;

    @Indexed
    private Long userId;

    // Auto-derived from the first user message, like ChatGPT's thread titles
    private String title;

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime lastMessageAt;
}
