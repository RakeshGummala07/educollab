package com.educollab.websocket;

import com.educollab.repository.UserRepository;
import com.educollab.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnect(SessionConnectedEvent event) {
        Principal principal = SimpMessageHeaderAccessor.wrap(event.getMessage()).getUser();
        String email = extractEmail(principal);
        if (email == null) return;

        userRepository.findByEmail(email).ifPresent(user -> {
            presenceService.markOnline(user.getId());
            log.info("User connected: {} (id={})", email, user.getId());

            messagingTemplate.convertAndSend(
                    "/topic/presence",
                    Map.of("userId", user.getId(), "online", true)
            );
        });
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        Principal principal = SimpMessageHeaderAccessor.wrap(event.getMessage()).getUser();
        String email = extractEmail(principal);
        if (email == null) return;

        userRepository.findByEmail(email).ifPresent(user -> {
            presenceService.markOffline(user.getId());
            log.info("User disconnected: {} (id={})", email, user.getId());

            messagingTemplate.convertAndSend(
                    "/topic/presence",
                    Map.of("userId", user.getId(), "online", false)
            );
        });
    }

    private String extractEmail(Principal principal) {
        if (principal == null) return null;
        if (principal instanceof Authentication auth) {
            return auth.getName();
        }
        return principal.getName();
    }
}
