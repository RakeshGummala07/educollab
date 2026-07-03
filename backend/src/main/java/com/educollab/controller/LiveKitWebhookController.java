package com.educollab.controller;

import io.livekit.server.WebhookReceiver;
import livekit.LivekitWebhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.educollab.service.MeetingService;

/**
 * Public webhook endpoint LiveKit's server POSTs room/participant lifecycle
 * events to. This is a DEFENSE-IN-DEPTH fallback for attendance accuracy —
 * the primary join/leave/end flow goes through the authenticated REST
 * endpoints in MeetingController. This just catches cases the client never
 * got to report cleanly (tab crash, network drop, etc).
 *
 * Configure this URL in your LiveKit server config (webhook.urls) or
 * LiveKit Cloud project settings as: https://your-api-host/livekit/webhook
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class LiveKitWebhookController {

    private final WebhookReceiver webhookReceiver;
    private final MeetingService meetingService;

    @PostMapping(value = "/livekit/webhook", consumes = "application/webhook+json")
    public ResponseEntity<Void> handleWebhook(@RequestBody String body,
                                               @RequestHeader("Authorization") String authHeader) {
        try {
            LivekitWebhook.WebhookEvent event = webhookReceiver.receive(body, authHeader);
            String type = event.getEvent();
            String roomName = event.getRoom() != null ? event.getRoom().getName() : null;

            switch (type) {
                case "participant_left" -> {
                    if (roomName != null && event.getParticipant() != null) {
                        Long userId = parseUserId(event.getParticipant().getIdentity());
                        if (userId != null) meetingService.handleParticipantDisconnected(roomName, userId);
                    }
                }
                case "room_finished" -> {
                    if (roomName != null) meetingService.handleRoomFinished(roomName);
                }
                default -> log.debug("Ignoring LiveKit webhook event type: {}", type);
            }
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to process LiveKit webhook: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    private Long parseUserId(String identity) {
        try {
            return Long.valueOf(identity);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
