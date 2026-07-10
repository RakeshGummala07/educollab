package com.educollab.repository.mongo;

import com.educollab.document.AiConversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConversationRepository extends MongoRepository<AiConversation, String> {
    List<AiConversation> findByUserIdOrderByLastMessageAtDesc(Long userId);
}
