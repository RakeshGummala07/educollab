package com.educollab.controller;

import com.educollab.document.Notification;
import com.educollab.dto.request.SendMessageRequest;
import com.educollab.dto.request.TypingIndicatorRequest;
import com.educollab.dto.response.MessageResponse;
import com.educollab.entity.User;
import com.educollab.repository.UserRepository;
import com.educollab.service.ChatService;
import com.educollab.service.NotificationService;
import com.educollab.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;
    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    // ── Send a chat message over WebSocket ─────────────────────────────────
    // Client sends to: /app/chat.send/{conversationId}
    // Server broadcasts to: /topic/conversations/{conversationId}
    @MessageMapping("/chat.send/{conversationId}")
    public void sendMessage(@org.springframework.messaging.handler.annotation.DestinationVariable String conversationId,
                             @Payload SendMessageRequest request,
                             Principal principal) {

        String email = extractEmail(principal);
        if (email == null) return;

        User sender = userRepository.findByEmail(email).orElse(null);
        if (sender == null) return;

        MessageResponse message = chatService.sendMessage(email, conversationId, request);

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId, message);

        log.debug("Message sent in conversation {} by {}", conversationId, email);


        // Notify all other participants (only those NOT currently online avoid spam;
        List<Long> participantIds = chatService.getParticipantIds(conversationId);
        String preview = request.getContent() != null && request.getContent().length() > 60
                ? request.getContent().substring(0, 60) + "..."
                : request.getContent();

        for (Long recipientId : participantIds) {
            if (recipientId.equals(sender.getId())) continue;
            notificationService.notify(
                    recipientId, sender.getId(),
                    Notification.NotificationType.NEW_MESSAGE,
                    "New message from " + sender.getFullName(),
                    preview != null ? preview : "Sent an attachment",
                    "CONVERSATION", conversationId
            );
        }
    }

    // ── Typing indicator ───────────────────────────────────────────────────
    // Client sends to: /app/chat.typing
    // Server broadcasts to: /topic/conversations/{conversationId}/typing
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingIndicatorRequest request, Principal principal) {
        String email = extractEmail(principal);
        if (email == null) return;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return;

        Map<String, Object> payload = Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "fullName", user.getFullName(),
                "typing", request.isTyping()
        );

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + request.getConversationId() + "/typing",
                payload
        );

        log.info("Typing received: {} {}", request.getConversationId(), request.isTyping());
    }

    

    // ── Heartbeat / presence ping ─────────────────────────────────────────
    // Client sends to: /app/chat.presence every ~20s while connected
    @MessageMapping("/chat.presence")
    public void handlePresence(Principal principal) {
        String email = extractEmail(principal);
        if (email == null) return;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return;

        presenceService.markOnline(user.getId());

        // Broadcast presence update to a global presence topic
        messagingTemplate.convertAndSend(
                "/topic/presence",
                Map.of("userId", user.getId(), "online", true)
        );
        
    }

    // ── Helper: extract email from STOMP Principal ────────────────────────
    private String extractEmail(Principal principal) {
        if (principal == null) return null;
        if (principal instanceof Authentication auth) {
            return auth.getName();
        }
        return principal.getName();
    }
}
