package com.educollab.repository.mongo;

import com.educollab.document.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {

    // All conversations a user participates in AND hasn't hidden, newest activity first
    @Query("{ 'participants.userId': ?0, 'active': true, " +
           "'hiddenForUserIds': { $ne: ?0 } }")
    List<Conversation> findByParticipantUserId(Long userId);

    // Find existing 1-to-1 conversation between two users (regardless of hidden state)
    @Query("{ 'type': 'DIRECT', 'active': true, " +
           "'participants.userId': { $all: [?0, ?1] }, " +
           "'participants': { $size: 2 } }")
    Optional<Conversation> findDirectConversation(Long userId1, Long userId2);

    // Group conversations created by a specific user
    List<Conversation> findByCreatedByUserIdAndType(Long userId, Conversation.ConversationType type);
}
