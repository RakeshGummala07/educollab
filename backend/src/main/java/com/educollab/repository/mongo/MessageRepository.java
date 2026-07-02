package com.educollab.repository.mongo;

import com.educollab.document.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    // Paginated messages for a conversation, newest first
    Page<Message> findByConversationIdAndDeletedFalseOrderByCreatedAtDesc(
            String conversationId, Pageable pageable);

    // Same, but also excludes messages this specific user deleted-for-themselves
    @Query("{ 'conversationId': ?0, 'deleted': false, 'deletedForUserIds': { $ne: ?1 } }")
    Page<Message> findVisibleMessages(String conversationId, Long userId, Pageable pageable);

    // Count unread messages for a user in a conversation
    long countByConversationIdAndDeletedFalseAndReadByUserIdsNotContaining(
            String conversationId, Long userId);

    // Most recent message in a conversation
    Message findFirstByConversationIdAndDeletedFalseOrderByCreatedAtDesc(String conversationId);

    // Delete all messages in a conversation (used when a conversation is permanently removed)
    void deleteByConversationId(String conversationId);
}
