package com.educollab.controller;

import com.educollab.dto.request.MeetingChatSendRequest;
import com.educollab.exception.BadRequestException;
import com.educollab.service.MeetingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * STOMP endpoints for the meeting chat panel. Reuses the same /ws-chat
 * SockJS endpoint and JWT handshake auth already configured for the
 * one-to-one/group chat module (see WebSocketConfig).
 *
 * Client sends to: /app/meeting.chat.send/{meetingId}
 * Server broadcasts to:
 *   - /topic/meeting/{meetingId}/chat                    (public messages)
 *   - /topic/meeting/{meetingId}/chat/private/{userId}    (private DMs — sender+recipient both subscribe)
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class MeetingWebSocketController {

    private final MeetingService meetingService;

    @MessageMapping("/meeting.chat.send/{meetingId}")
    public void sendMeetingChat(@DestinationVariable Long meetingId,
                                 MeetingChatSendRequest request,
                                 SimpMessageHeaderAccessor headerAccessor) {
        Authentication auth = (Authentication) headerAccessor.getUser();
        if (auth == null) {
            log.warn("Rejected meeting chat message with no authenticated principal on session {}",
                    headerAccessor.getSessionId());
            return;
        }
        meetingService.sendChatMessage(auth.getName(), meetingId, request);
    }

    // Same fix as WebSocketChatController — without this, chat-mode rejections
    // (e.g. HOST_ONLY_BROADCAST mode blocking a participant) are only logged
    // server-side and the sender never learns their message didn't go through.
    @MessageExceptionHandler(BadRequestException.class)
    @SendToUser("/queue/errors")
    public Map<String, String> handleBadRequest(BadRequestException e) {
        log.warn("STOMP meeting chat error: {}", e.getMessage());
        return Map.of("error", e.getMessage());
    }
}