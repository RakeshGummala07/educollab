package com.educollab.controller;

import com.educollab.dto.request.CreateConversationRequest;
import com.educollab.dto.request.SendMessageRequest;
import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.ConversationResponse;
import com.educollab.dto.response.MessageResponse;
import com.educollab.dto.response.PageResponse;
import com.educollab.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // ── Get all my conversations ──────────────────────────────────────────
    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getMyConversations(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<ConversationResponse> conversations =
                chatService.getMyConversations(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved", conversations));
    }

    // ── Get or create 1-to-1 conversation with another user ──────────────
    @PostMapping("/conversations/direct/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConversationResponse>> getOrCreateDirectConversation(
            @PathVariable Long otherUserId,
            @AuthenticationPrincipal UserDetails userDetails) {

        ConversationResponse conversation = chatService
                .getOrCreateDirectConversation(userDetails.getUsername(), otherUserId);
        return ResponseEntity.ok(ApiResponse.success("Conversation ready", conversation));
    }

    // ── Create a group conversation ───────────────────────────────────────
    @PostMapping("/conversations/group")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ConversationResponse>> createGroupConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        ConversationResponse conversation = chatService
                .createGroupConversation(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created", conversation));
    }

    // ── Get message history (paginated) ───────────────────────────────────
    @GetMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<MessageResponse>>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        PageResponse<MessageResponse> messages = chatService.getMessages(
                userDetails.getUsername(), conversationId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved", messages));
    }

    // ── Send a message via REST (fallback / file attachments) ────────────
    @PostMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        MessageResponse message = chatService.sendMessage(
                userDetails.getUsername(), conversationId, request);

        // Broadcast to all subscribers of this conversation topic
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId, message);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", message));
    }

    // ── Mark conversation as read ─────────────────────────────────────────
    @PutMapping("/conversations/{conversationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        chatService.markAsRead(userDetails.getUsername(), conversationId);

        // Notify other participants that messages were read
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId + "/read",
                userDetails.getUsername());

        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    // ── Delete message for me only ────────────────────────────────────────
    @DeleteMapping("/messages/{messageId}/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteMessageForMe(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {

        chatService.deleteMessageForMe(userDetails.getUsername(), messageId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted for you"));
    }

    // ── Delete message for everyone ───────────────────────────────────────
    @DeleteMapping("/messages/{messageId}/everyone")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteMessageForEveryone(
            @PathVariable String messageId,
            @RequestParam String conversationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        chatService.deleteMessageForEveryone(userDetails.getUsername(), messageId);

        // Broadcast on the conversation topic so the existing subscription picks it up
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId + "/deleted",
                Map.of("messageId", messageId)
        );

        return ResponseEntity.ok(ApiResponse.success("Message deleted for everyone"));
    }

    // ── Delete (hide) conversation for current user ───────────────────────
    @DeleteMapping("/conversations/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String conversationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        chatService.deleteConversationForMe(userDetails.getUsername(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Conversation removed"));
    }
}
