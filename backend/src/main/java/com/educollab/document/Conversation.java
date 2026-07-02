package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "conversations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    private String id;

    @Indexed
    private ConversationType type;          // DIRECT or GROUP

    private String groupName;                // Only for GROUP
    private String groupAvatarUrl;            // Only for GROUP
    private Long createdByUserId;             // Only for GROUP (admin)

    @Builder.Default
    private List<Participant> participants = new ArrayList<>();

    // Last message preview (denormalized for fast conversation list rendering)
    private String lastMessageContent;
    private String lastMessageSenderId;
    private LocalDateTime lastMessageAt;

    @Builder.Default
    private boolean active = true;

    // Users who deleted/hid this conversation from their own list
    // (conversation + messages persist for the other participant)
    @Builder.Default
    private List<Long> hiddenForUserIds = new ArrayList<>();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Participant {
        private Long userId;
        private String username;
        private String fullName;
        private String avatarUrl;
        private String role;            // ROLE_TEACHER / ROLE_STUDENT

        @Builder.Default
        private LocalDateTime joinedAt = LocalDateTime.now();

        // Per-participant read tracking
        private LocalDateTime lastReadAt;

        @Builder.Default
        private boolean isAdmin = false;  // Group admin (only for GROUP type)
    }

    public enum ConversationType {
        DIRECT, GROUP
    }
}
