package com.educollab.kafka;

import com.educollab.config.KafkaTopicConfig;
import com.educollab.dto.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationProducer {

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;

    public void publish(NotificationEvent event) {
        // Key by recipientId so all notifications for the same user
        // land in the same partition (preserves order per user)
        String key = String.valueOf(event.getRecipientId());

        kafkaTemplate.send(KafkaTopicConfig.NOTIFICATIONS_TOPIC, key, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish notification event: {}", ex.getMessage());
                    } else {
                        log.debug("Published notification event for recipient {}: {}",
                                event.getRecipientId(), event.getType());
                    }
                });
    }
}
