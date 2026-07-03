package com.educollab.dto.response;

import com.educollab.entity.MeetingAttendance;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JoinMeetingResponse {

    private Long meetingId;
    private String roomName;
    private String livekitUrl;      // ws://... — client connects here
    private String token;           // signed JWT for LiveKit room join
    private MeetingAttendance.MeetingRole role;
    private boolean waiting;        // true if placed in waiting room instead of joining directly
}
