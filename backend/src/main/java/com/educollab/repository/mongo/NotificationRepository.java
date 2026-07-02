package com.educollab.repository.mongo;

import com.educollab.document.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    long countByRecipientIdAndReadFalse(Long recipientId);

    long countByRecipientIdAndReadFalseAndTypeNot(
            Long recipientId, Notification.NotificationType excludeType);

    void deleteByRecipientIdAndId(Long recipientId, String id);

    void deleteByRecipientIdAndReadTrue(Long recipientId);

    void deleteByRecipientId(Long recipientId);
}
