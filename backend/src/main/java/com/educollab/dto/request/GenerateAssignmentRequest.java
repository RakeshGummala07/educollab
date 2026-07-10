package com.educollab.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateAssignmentRequest {

    @NotBlank(message = "Topic is required")
    private String topic;

    private String documentId;

    @Min(1) @Max(15)
    private int numTasks = 5;
}
