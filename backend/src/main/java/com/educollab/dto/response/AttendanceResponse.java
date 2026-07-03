package com.educollab.dto.response;

import com.educollab.entity.MeetingAttendance;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceResponse {

    private Long userId;
    private String fullName;
    private String username;
    private String avatarUrl;

    private MeetingAttendance.MeetingRole role;
    private MeetingAttendance.AttendanceStatus status;

    private LocalDateTime firstJoinedAt;
    private LocalDateTime lastJoinedAt;
    private LocalDateTime lastLeftAt;
    private Long durationSeconds;
    private Boolean currentlyPresent;
    private Boolean micMuted;
    private Boolean cameraOff;
    private Boolean handRaised;

    public static AttendanceResponse from(MeetingAttendance a) {
        return AttendanceResponse.builder()
                .userId(a.getUser().getId())
                .fullName(a.getUser().getFullName())
                .username(a.getUser().getUsername())
                .avatarUrl(a.getUser().getAvatarUrl())
                .role(a.getRole())
                .status(a.getStatus())
                .firstJoinedAt(a.getFirstJoinedAt())
                .lastJoinedAt(a.getLastJoinedAt())
                .lastLeftAt(a.getLastLeftAt())
                .durationSeconds(a.getDurationSeconds())
                .currentlyPresent(a.getCurrentlyPresent())
                .micMuted(a.getMicMuted())
                .cameraOff(a.getCameraOff())
                .handRaised(a.getHandRaised())
                .build();
    }
}
