package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    private Long senderId;
    private String senderUsername;
    private String senderFullName;
    private String senderAvatarUrl;

    private String content;
    private MessageType type;

    // Optional media attachment (image/file)
    private String attachmentUrl;
    private String attachmentType;
    private String attachmentName;

    // Read receipts: list of userIds who have read this message
    @Builder.Default
    private List<Long> readByUserIds = new ArrayList<>();

    // Delivery status
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    @Builder.Default
    private boolean deleted = false;

    // Users who chose "delete for me" — message stays for everyone else
    @Builder.Default
    private List<Long> deletedForUserIds = new ArrayList<>();

    @Builder.Default
    private boolean edited = false;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum MessageType {
        TEXT, IMAGE, FILE, SYSTEM   // SYSTEM = "X joined the group" etc.
    }

    public enum MessageStatus {
        SENT, DELIVERED, READ
    }
}
