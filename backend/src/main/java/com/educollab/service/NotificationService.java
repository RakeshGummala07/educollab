package com.educollab.service;

import com.educollab.document.Notification;
import com.educollab.dto.event.NotificationEvent;
import com.educollab.dto.response.NotificationResponse;
import com.educollab.dto.response.PageResponse;
import com.educollab.entity.User;
import com.educollab.kafka.NotificationProducer;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationProducer notificationProducer;

    // ── Trigger a notification (called from PostService, ChatService, EnrollmentService) ──
    public void notify(Long recipientId, Long actorId,
                        Notification.NotificationType type,
                        String title, String message,
                        String entityType, String entityId) {

        // Don't notify yourself (e.g. liking your own post)
        if (recipientId.equals(actorId)) return;

        User recipient = userRepository.findById(recipientId).orElse(null);
        User actor = actorId != null ? userRepository.findById(actorId).orElse(null) : null;

        if (recipient == null) {
            log.warn("Cannot notify — recipient {} not found", recipientId);
            return;
        }

        NotificationEvent event = NotificationEvent.builder()
                .recipientId(recipientId)
                .recipientEmail(recipient.getEmail())
                .recipientName(recipient.getFullName())
                .actorId(actorId)
                .actorUsername(actor != null ? actor.getUsername() : null)
                .actorFullName(actor != null ? actor.getFullName() : "EduCollab")
                .actorAvatarUrl(actor != null ? actor.getAvatarUrl() : null)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .build();

        notificationProducer.publish(event);
    }

    // ── Get my notifications (paginated) ──────────────────────────────────
    public PageResponse<NotificationResponse> getMyNotifications(
            String currentUserEmail, int page, int size) {
        User user = findUser(currentUserEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications =
                notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable);
        return PageResponse.from(notifications.map(NotificationResponse::from));
    }

    // ── Get unread count ──────────────────────────────────────────────────
    public long getUnreadCount(String currentUserEmail) {
        User user = findUser(currentUserEmail);
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    // ── Mark single notification as read ──────────────────────────────────
    public void markAsRead(String currentUserEmail, String notificationId) {
        User user = findUser(currentUserEmail);
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && notification.getRecipientId().equals(user.getId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    // ── Mark all as read ───────────────────────────────────────────────────
    public void markAllAsRead(String currentUserEmail) {
        User user = findUser(currentUserEmail);
        Pageable pageable = PageRequest.of(0, 200);
        Page<Notification> unread =
                notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable);
        unread.forEach(n -> {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // ── Delete a single notification ──────────────────────────────────────
    public void deleteNotification(String currentUserEmail, String notificationId) {
        User user = findUser(currentUserEmail);
        notificationRepository.deleteByRecipientIdAndId(user.getId(), notificationId);
    }

    // ── Delete all read notifications ─────────────────────────────────────
    public void deleteAllRead(String currentUserEmail) {
        User user = findUser(currentUserEmail);
        notificationRepository.deleteByRecipientIdAndReadTrue(user.getId());
    }

    // ── Delete all notifications ───────────────────────────────────────────
    public void deleteAll(String currentUserEmail) {
        User user = findUser(currentUserEmail);
        notificationRepository.deleteByRecipientId(user.getId());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
