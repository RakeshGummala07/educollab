package com.educollab.kafka;

import com.educollab.config.KafkaTopicConfig;
import com.educollab.document.Notification;
import com.educollab.dto.event.NotificationEvent;
import com.educollab.dto.response.NotificationResponse;
import com.educollab.repository.mongo.NotificationRepository;
import com.educollab.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    @Value("${app.notification.email-enabled}")
    private boolean emailEnabled;

    @KafkaListener(topics = KafkaTopicConfig.NOTIFICATIONS_TOPIC,
                   groupId = "${spring.kafka.consumer.group-id}")
    public void consume(NotificationEvent event) {
        log.info("Consuming notification event: type={} recipient={}",
                event.getType(), event.getRecipientId());

        // 1. Persist to MongoDB
        Notification notification = Notification.builder()
                .recipientId(event.getRecipientId())
                .actorId(event.getActorId())
                .actorUsername(event.getActorUsername())
                .actorFullName(event.getActorFullName())
                .actorAvatarUrl(event.getActorAvatarUrl())
                .type(event.getType())
                .title(event.getTitle())
                .message(event.getMessage())
                .entityType(event.getEntityType())
                .entityId(event.getEntityId())
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // 2. Broadcast in real-time via WebSocket to the recipient
        NotificationResponse response = NotificationResponse.from(saved);
        messagingTemplate.convertAndSendToUser(
                event.getRecipientId().toString(),
                "/queue/notifications",
                response
        );

        // Also broadcast to a per-recipient topic (simpler subscription model used by our frontend)
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + event.getRecipientId(),
                response
        );

        // 3. Send email (async, best-effort, never blocks/breaks the flow)
        if (emailEnabled && event.getRecipientEmail() != null) {
            try {
                emailService.sendNotificationEmail(
                        event.getRecipientEmail(),
                        event.getRecipientName(),
                        event.getTitle(),
                        event.getMessage(),
                        event.getActorFullName()
                );
                saved.setEmailSent(true);
                notificationRepository.save(saved);
            } catch (Exception e) {
                log.error("Failed to send notification email: {}", e.getMessage());
            }
        }
    }
}
