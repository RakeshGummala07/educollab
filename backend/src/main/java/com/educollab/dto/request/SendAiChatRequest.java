package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendAiChatRequest {

    // Null = start a new conversation
    private String conversationId;

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 4000, message = "Message must be under 4000 characters")
    private String message;

    // If true and the user has any READY study documents, relevant chunks
    // are retrieved from Qdrant and injected as context (RAG)
    private boolean useDocumentContext = true;
}
