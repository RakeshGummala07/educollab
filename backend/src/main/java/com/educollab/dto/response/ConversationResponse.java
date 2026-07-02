package com.educollab.dto.response;

import com.educollab.document.Conversation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private String id;
    private String type;            // DIRECT / GROUP
    private String groupName;
    private String groupAvatarUrl;

    // For DIRECT chats: the "other" participant's info, shown as the chat name
    private String displayName;
    private String displayAvatarUrl;
    private boolean otherUserOnline;

    private List<Conversation.Participant> participants;

    private String lastMessageContent;
    private String lastMessageSenderId;
    private LocalDateTime lastMessageAt;

    private long unreadCount;

    private LocalDateTime createdAt;

    public static ConversationResponse from(Conversation conv, Long currentUserId,
                                             long unreadCount, boolean otherOnline) {
        ConversationResponse.ConversationResponseBuilder builder = ConversationResponse.builder()
                .id(conv.getId())
                .type(conv.getType().name())
                .groupName(conv.getGroupName())
                .groupAvatarUrl(conv.getGroupAvatarUrl())
                .participants(conv.getParticipants())
                .lastMessageContent(conv.getLastMessageContent())
                .lastMessageSenderId(conv.getLastMessageSenderId())
                .lastMessageAt(conv.getLastMessageAt())
                .unreadCount(unreadCount)
                .createdAt(conv.getCreatedAt());

        if (conv.getType() == Conversation.ConversationType.DIRECT) {
            // Find the other participant for display name
            conv.getParticipants().stream()
                    .filter(p -> !p.getUserId().equals(currentUserId))
                    .findFirst()
                    .ifPresent(other -> {
                        builder.displayName(other.getFullName());
                        builder.displayAvatarUrl(other.getAvatarUrl());
                    });
            builder.otherUserOnline(otherOnline);
        } else {
            builder.displayName(conv.getGroupName());
            builder.displayAvatarUrl(conv.getGroupAvatarUrl());
        }

        return builder.build();
    }
}
