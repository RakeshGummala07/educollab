package com.educollab.controller;

import com.educollab.dto.request.SendAiChatRequest;
import com.educollab.dto.response.AiChatMessageResponse;
import com.educollab.dto.response.AiConversationResponse;
import com.educollab.dto.response.AiUsageResponse;
import com.educollab.dto.response.ApiResponse;
import com.educollab.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatMessageResponse>> sendMessage(
            @Valid @RequestBody SendAiChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AiChatMessageResponse response = aiChatService.sendMessage(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Response generated", response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationResponse>>> listConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Conversations loaded",
                aiChatService.listConversations(userDetails.getUsername())));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<AiChatMessageResponse>>> getMessages(
            @PathVariable String conversationId, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Messages loaded",
                aiChatService.getMessages(userDetails.getUsername(), conversationId)));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String conversationId, @AuthenticationPrincipal UserDetails userDetails) {
        aiChatService.deleteConversation(userDetails.getUsername(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted"));
    }

    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<AiUsageResponse>> getUsage(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Usage loaded",
                aiChatService.getUsage(userDetails.getUsername())));
    }
}
