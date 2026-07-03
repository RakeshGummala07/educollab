package com.educollab.dto.request;

import com.educollab.entity.Meeting;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatModeUpdateRequest {

    @NotNull(message = "chatMode is required")
    private Meeting.ChatMode chatMode;
}
