package com.educollab.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateQuizRequest {

    // Free-text topic, OR reference a previously uploaded document (or both —
    // topic narrows what part of the document to focus on)
    @NotBlank(message = "Topic is required")
    private String topic;

    private String documentId;

    @Min(1) @Max(20)
    private int numQuestions = 5;

    private String difficulty = "MEDIUM"; // EASY | MEDIUM | HARD
}
