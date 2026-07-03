package com.educollab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MeetingChatSendRequest {

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 1000, message = "Message must be under 1000 characters")
    private String content;

    // Optional — if set, this is a private DM to that participant
    private Long recipientId;
}
