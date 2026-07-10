package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SummarizeRequest {

    // Either rawText OR documentId must be provided (validated in service)
    private String rawText;
    private String documentId;
}
