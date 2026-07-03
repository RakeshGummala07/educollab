package com.educollab.dto.response;

import com.educollab.entity.Meeting;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MeetingResponse {

    private Long id;
    private String title;
    private String description;

    private Long teacherId;
    private String teacherName;
    private String teacherAvatarUrl;

    private String roomName;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private LocalDateTime actualStart;
    private LocalDateTime actualEnd;

    private Meeting.MeetingStatus status;
    private Integer maxParticipants;
    private Boolean recordingEnabled;

    private Meeting.ChatMode chatMode;
    private Boolean locked;
    private Boolean waitingRoomEnabled;
    private Long activeScreenShareUserId;

    private Integer liveParticipantCount;

    public static MeetingResponse from(Meeting m) {
        return MeetingResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .teacherId(m.getTeacher().getId())
                .teacherName(m.getTeacher().getFullName())
                .teacherAvatarUrl(m.getTeacher().getAvatarUrl())
                .roomName(m.getRoomName())
                .scheduledStart(m.getScheduledStart())
                .scheduledEnd(m.getScheduledEnd())
                .actualStart(m.getActualStart())
                .actualEnd(m.getActualEnd())
                .status(m.getStatus())
                .maxParticipants(m.getMaxParticipants())
                .recordingEnabled(m.getRecordingEnabled())
                .chatMode(m.getChatMode())
                .locked(m.getLocked())
                .waitingRoomEnabled(m.getWaitingRoomEnabled())
                .activeScreenShareUserId(m.getActiveScreenShareUserId())
                .build();
    }
}
