package com.educollab.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateConversationRequest {

    @NotEmpty(message = "At least one participant is required")
    private List<Long> participantIds;     // Other user IDs (not including self)

    // Only required for GROUP type
    private boolean isGroup = false;

    @Size(max = 100, message = "Group name must be under 100 characters")
    private String groupName;
}
