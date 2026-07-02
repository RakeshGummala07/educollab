package com.educollab.service;

import com.educollab.document.Conversation;
import com.educollab.document.Message;
import com.educollab.dto.request.CreateConversationRequest;
import com.educollab.dto.request.SendMessageRequest;
import com.educollab.dto.response.ConversationResponse;
import com.educollab.dto.response.MessageResponse;
import com.educollab.dto.response.PageResponse;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.ConversationRepository;
import com.educollab.repository.mongo.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;

    // ── Get or create 1-to-1 conversation ─────────────────────────────────
    public ConversationResponse getOrCreateDirectConversation(
            String currentUserEmail, Long otherUserId) {

        User currentUser = findUser(currentUserEmail);
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + otherUserId));

        if (currentUser.getId().equals(otherUserId)) {
            throw new BadRequestException("Cannot create a conversation with yourself");
        }

        Conversation conversation = conversationRepository
                .findDirectConversation(currentUser.getId(), otherUserId)
                .orElseGet(() -> createDirectConversation(currentUser, otherUser));

        return buildConversationResponse(conversation, currentUser.getId());
    }

    private Conversation createDirectConversation(User user1, User user2) {
        Conversation.Participant p1 = Conversation.Participant.builder()
                .userId(user1.getId())
                .username(user1.getUsername())
                .fullName(user1.getFullName())
                .avatarUrl(user1.getAvatarUrl())
                .role(user1.getRole().name())
                .build();

        Conversation.Participant p2 = Conversation.Participant.builder()
                .userId(user2.getId())
                .username(user2.getUsername())
                .fullName(user2.getFullName())
                .avatarUrl(user2.getAvatarUrl())
                .role(user2.getRole().name())
                .build();

        Conversation conversation = Conversation.builder()
                .type(Conversation.ConversationType.DIRECT)
                .participants(new ArrayList<>(List.of(p1, p2)))
                .active(true)
                .build();

        Conversation saved = conversationRepository.save(conversation);
        log.info("Direct conversation created between {} and {}", user1.getId(), user2.getId());
        return saved;
    }

    // ── Create group conversation ─────────────────────────────────────────
    public ConversationResponse createGroupConversation(
            String currentUserEmail, CreateConversationRequest request) {

        User creator = findUser(currentUserEmail);

        if (request.getGroupName() == null || request.getGroupName().isBlank()) {
            throw new BadRequestException("Group name is required");
        }
        if (request.getParticipantIds().size() < 2) {
            throw new BadRequestException("Group must have at least 2 other participants");
        }

        List<Conversation.Participant> participants = new ArrayList<>();

        // Add creator as admin
        participants.add(Conversation.Participant.builder()
                .userId(creator.getId())
                .username(creator.getUsername())
                .fullName(creator.getFullName())
                .avatarUrl(creator.getAvatarUrl())
                .role(creator.getRole().name())
                .isAdmin(true)
                .build());

        // Add other participants
        for (Long userId : request.getParticipantIds()) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            participants.add(Conversation.Participant.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .role(user.getRole().name())
                    .isAdmin(false)
                    .build());
        }

        Conversation conversation = Conversation.builder()
                .type(Conversation.ConversationType.GROUP)
                .groupName(request.getGroupName())
                .createdByUserId(creator.getId())
                .participants(participants)
                .active(true)
                .build();

        Conversation saved = conversationRepository.save(conversation);
        log.info("Group conversation '{}' created by {}", request.getGroupName(), creator.getId());
        return buildConversationResponse(saved, creator.getId());
    }

    // ── Get all conversations for current user ────────────────────────────
    public List<ConversationResponse> getMyConversations(String currentUserEmail) {
        User currentUser = findUser(currentUserEmail);
        List<Conversation> conversations =
                conversationRepository.findByParticipantUserId(currentUser.getId());

        return conversations.stream()
                .map(c -> buildConversationResponse(c, currentUser.getId()))
                .sorted((a, b) -> {
                    if (a.getLastMessageAt() == null) return 1;
                    if (b.getLastMessageAt() == null) return -1;
                    return b.getLastMessageAt().compareTo(a.getLastMessageAt());
                })
                .collect(Collectors.toList());
    }

    // ── Send message ──────────────────────────────────────────────────────
    public MessageResponse sendMessage(String senderEmail, String conversationId,
                                        SendMessageRequest request) {

        

        String content = request.getContent() == null ? "" : request.getContent().trim();
        User sender = findUser(senderEmail);
        Conversation conversation = findConversation(conversationId);

        validateParticipant(conversation, sender.getId());

        boolean hasContent = !content.isBlank();
        boolean hasAttachment = request.getAttachmentUrl() != null;

        if (!hasContent && !hasAttachment) {
                throw new IllegalArgumentException(
                        "Message must contain text or an attachment."
                );
        }

        Message.MessageType type = request.getAttachmentUrl() != null
                ? (isImage(request.getAttachmentType()) ? Message.MessageType.IMAGE : Message.MessageType.FILE)
                : Message.MessageType.TEXT;

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(sender.getId())
                .senderUsername(sender.getUsername())
                .senderFullName(sender.getFullName())
                .senderAvatarUrl(sender.getAvatarUrl())
                .content(content)
                .type(type)
                .attachmentUrl(request.getAttachmentUrl())
                .attachmentType(request.getAttachmentType())
                .attachmentName(request.getAttachmentName())
                .readByUserIds(new ArrayList<>(List.of(sender.getId())))  // Sender has "read" their own message
                .status(Message.MessageStatus.SENT)
                .build();

        Message saved = messageRepository.save(message);

        // Update conversation's last message preview
        conversation.setLastMessageContent(
                content.length() > 100
                    ? content.substring(0, 100) + "..."
                    : content);
        conversation.setLastMessageSenderId(sender.getId().toString());
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return MessageResponse.from(saved, sender.getId());
    }

    // ── Get messages (paginated) ──────────────────────────────────────────
    public PageResponse<MessageResponse> getMessages(
            String currentUserEmail, String conversationId, int page, int size) {

        User currentUser = findUser(currentUserEmail);
        Conversation conversation = findConversation(conversationId);
        validateParticipant(conversation, currentUser.getId());

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository
                .findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(conversationId, pageable);

        return PageResponse.from(messages.map(m -> MessageResponse.from(m, currentUser.getId())));
    }

      // ── Delete message for me only ────────────────────────────────────────
    public void deleteMessageForMe(String currentUserEmail, String messageId) {
        User currentUser = findUser(currentUserEmail);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        Conversation conversation = findConversation(message.getConversationId());
        validateParticipant(conversation, currentUser.getId());

        List<Long> hiddenFor = message.getDeletedForUserIds() == null
                ? new ArrayList<>() : message.getDeletedForUserIds();
        if (!hiddenFor.contains(currentUser.getId())) {
            hiddenFor.add(currentUser.getId());
        }
        message.setDeletedForUserIds(hiddenFor);
        messageRepository.save(message);
    }

    // ── Delete message for everyone (sender only, within their own message) ──
    public void deleteMessageForEveryone(String currentUserEmail, String messageId) {
        User currentUser = findUser(currentUserEmail);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSenderId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only delete your own messages for everyone");
        }

        message.setDeleted(true);
        message.setContent("This message was deleted");
        message.setAttachmentUrl(null);
        messageRepository.save(message);
    }

    // ── Delete (hide) a conversation for the current user only ───────────
    public void deleteConversationForMe(String currentUserEmail, String conversationId) {
        User currentUser = findUser(currentUserEmail);
        Conversation conversation = findConversation(conversationId);
        validateParticipant(conversation, currentUser.getId());

        List<Long> hiddenFor = conversation.getHiddenForUserIds() == null
                ? new ArrayList<>() : conversation.getHiddenForUserIds();
        if (!hiddenFor.contains(currentUser.getId())) {
            hiddenFor.add(currentUser.getId());
        }
        conversation.setHiddenForUserIds(hiddenFor);
        conversationRepository.save(conversation);

        log.info("User {} hid conversation {}", currentUser.getId(), conversationId);
    }


    // ── Mark messages as read ──────────────────────────────────────────────
    public void markAsRead(String currentUserEmail, String conversationId) {
        User currentUser = findUser(currentUserEmail);
        Conversation conversation = findConversation(conversationId);
        validateParticipant(conversation, currentUser.getId());

        // Update participant's lastReadAt
        conversation.getParticipants().stream()
                .filter(p -> p.getUserId().equals(currentUser.getId()))
                .findFirst()
                .ifPresent(p -> p.setLastReadAt(LocalDateTime.now()));
        conversationRepository.save(conversation);

        // Mark recent unread messages as read by this user
        Pageable recentPage = PageRequest.of(0, 50);
        Page<Message> recentMessages = messageRepository
                .findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(conversationId, recentPage);

        recentMessages.forEach(m -> {
            if (m.getReadByUserIds() == null) m.setReadByUserIds(new ArrayList<>());
            if (!m.getReadByUserIds().contains(currentUser.getId())) {
                m.getReadByUserIds().add(currentUser.getId());
                m.setStatus(Message.MessageStatus.READ);
                messageRepository.save(m);
            }
        });
    }

    // ── Get unread count for a conversation ────────────────────────────────
    public long getUnreadCount(String conversationId, Long userId) {
        return messageRepository
                .countByConversationIdAndDeletedFalseAndReadByUserIdsNotContaining(
                        conversationId, userId);
    }

    // ── Get participant user IDs of a conversation (for notification fan-out) ──
    public java.util.List<Long> getParticipantIds(String conversationId) {
        Conversation conversation = findConversation(conversationId);
        return conversation.getParticipants().stream()
                .map(Conversation.Participant::getUserId)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private ConversationResponse buildConversationResponse(Conversation conv, Long currentUserId) {
        long unread = getUnreadCount(conv.getId(), currentUserId);

        boolean otherOnline = false;
        if (conv.getType() == Conversation.ConversationType.DIRECT) {
            otherOnline = conv.getParticipants().stream()
                    .filter(p -> !p.getUserId().equals(currentUserId))
                    .findFirst()
                    .map(p -> presenceService.isOnline(p.getUserId()))
                    .orElse(false);
        }

        return ConversationResponse.from(conv, currentUserId, unread, otherOnline);
    }

    private void validateParticipant(Conversation conversation, Long userId) {
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));
        if (!isParticipant) {
            throw new BadRequestException("You are not a participant in this conversation");
        }
    }

    private boolean isImage(String contentType) {
        return contentType != null && contentType.startsWith("image/");
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Conversation findConversation(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Conversation not found: " + conversationId));
    }
}
