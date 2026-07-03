package com.educollab.dto.response;

import com.educollab.entity.MeetingJoinRequest;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class JoinRequestResponse {

    private Long requestId;
    private Long userId;
    private String fullName;
    private String username;
    private String avatarUrl;
    private MeetingJoinRequest.JoinRequestStatus status;
    private LocalDateTime requestedAt;

    public static JoinRequestResponse from(MeetingJoinRequest r) {
        return JoinRequestResponse.builder()
                .requestId(r.getId())
                .userId(r.getUser().getId())
                .fullName(r.getUser().getFullName())
                .username(r.getUser().getUsername())
                .avatarUrl(r.getUser().getAvatarUrl())
                .status(r.getStatus())
                .requestedAt(r.getCreatedAt())
                .build();
    }
}
