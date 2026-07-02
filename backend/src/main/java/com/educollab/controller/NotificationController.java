package com.educollab.controller;

import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.NotificationResponse;
import com.educollab.dto.response.PageResponse;
import com.educollab.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        PageResponse<NotificationResponse> notifications =
                notificationService.getMyNotifications(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        long count = notificationService.getUnreadCount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Unread count", Map.of("count", count)));
    }

    @PutMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable String notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.markAsRead(userDetails.getUsername(), notificationId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("All marked as read"));
    }

    @DeleteMapping("/{notificationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.deleteNotification(userDetails.getUsername(), notificationId);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted"));
    }

    @DeleteMapping("/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteAllRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.deleteAllRead(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Read notifications deleted"));
    }

    @DeleteMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteAll(
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.deleteAll(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("All notifications deleted"));
    }
}
