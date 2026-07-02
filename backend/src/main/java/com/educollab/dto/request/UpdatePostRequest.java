package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdatePostRequest {

    @NotBlank(message = "Post content cannot be empty")
    @Size(max = 2000, message = "Post content must be under 2000 characters")
    private String content;
}
