package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message must be under 2000 characters")
    private String content;

    private String attachmentUrl;
    private String attachmentType;
    private String attachmentName;
}
