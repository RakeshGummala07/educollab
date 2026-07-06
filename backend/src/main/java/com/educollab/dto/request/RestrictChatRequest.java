package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RestrictChatRequest {

    @NotBlank(message = "Reason is required")
    @Size(max = 300, message = "Reason must be under 300 characters")
    private String reason;
}
