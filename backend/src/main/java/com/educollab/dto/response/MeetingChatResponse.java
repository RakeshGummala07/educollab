package com.educollab.dto.response;

import com.educollab.document.MeetingChatMessage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MeetingChatResponse {

    private String id;
    private Long meetingId;

    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;

    private String content;

    private Long recipientId;
    private String recipientUsername;
    private boolean isPrivate;

    private LocalDateTime createdAt;

    public static MeetingChatResponse from(MeetingChatMessage m) {
        return MeetingChatResponse.builder()
                .id(m.getId())
                .meetingId(m.getMeetingId())
                .senderId(m.getSenderId())
                .senderUsername(m.getSenderUsername())
                .senderFullName(m.getSenderFullName())
                .senderAvatarUrl(m.getSenderAvatarUrl())
                .content(m.getContent())
                .recipientId(m.getRecipientId())
                .recipientUsername(m.getRecipientUsername())
                .isPrivate(m.isPrivate())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
