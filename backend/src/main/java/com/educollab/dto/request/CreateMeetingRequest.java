package com.educollab.dto.request;

import com.educollab.entity.Meeting;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateMeetingRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be under 150 characters")
    private String title;

    @Size(max = 1000, message = "Description must be under 1000 characters")
    private String description;

    @NotNull(message = "Scheduled start time is required")
    @Future(message = "Scheduled start must be in the future")
    private LocalDateTime scheduledStart;

    @NotNull(message = "Scheduled end time is required")
    private LocalDateTime scheduledEnd;

    private Integer maxParticipants = 50;

    private Boolean waitingRoomEnabled = false;

    private Meeting.ChatMode chatMode = Meeting.ChatMode.EVERYONE;
}
