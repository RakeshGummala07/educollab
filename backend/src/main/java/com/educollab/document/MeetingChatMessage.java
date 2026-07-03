package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "meeting_chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingChatMessage {

    @Id
    private String id;

    @Indexed
    private Long meetingId;

    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;

    private String content;

    // null = public message (visible to all participants per current chatMode)
    // non-null = private DM, visible only to sender + this recipient
    private Long recipientId;
    private String recipientUsername;

    public boolean isPrivate() {
        return recipientId != null;
    }

    @CreatedDate
    private LocalDateTime createdAt;
}
