package com.educollab.dto.response;

import com.educollab.document.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private String id;
    private String conversationId;
    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;
    private String content;
    private String type;
    private String attachmentUrl;
    private String attachmentType;
    private String attachmentName;
    private boolean ownedByCurrentUser;
    private boolean readByCurrentUser;
    private int readCount;
    private String status;
    private boolean edited;
    private boolean deletedForEveryone;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message m, Long currentUserId) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderUsername(m.getSenderUsername())
                .senderFullName(m.getSenderFullName())
                .senderAvatarUrl(m.getSenderAvatarUrl())
                .content(m.getContent())
                .type(m.getType() != null ? m.getType().name() : "TEXT")
                .attachmentUrl(m.getAttachmentUrl())
                .attachmentType(m.getAttachmentType())
                .attachmentName(m.getAttachmentName())
                .ownedByCurrentUser(m.getSenderId().equals(currentUserId))
                .readByCurrentUser(m.getReadByUserIds() != null
                        && m.getReadByUserIds().contains(currentUserId))
                .readCount(m.getReadByUserIds() != null ? m.getReadByUserIds().size() : 0)
                .status(m.getStatus() != null ? m.getStatus().name() : "SENT")
                .edited(m.isEdited())
                .deletedForEveryone(m.isDeleted())
                .createdAt(m.getCreatedAt())
                .build();
    }
}