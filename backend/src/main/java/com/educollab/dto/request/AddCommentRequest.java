package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddCommentRequest {

    @NotBlank(message = "Comment cannot be empty")
    @Size(max = 500, message = "Comment must be under 500 characters")
    private String content;
}
