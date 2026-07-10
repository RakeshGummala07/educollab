package com.educollab.repository.mongo;

import com.educollab.document.StudyDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyDocumentRepository extends MongoRepository<StudyDocument, String> {
    List<StudyDocument> findByUserIdOrderByCreatedAtDesc(Long userId);
}
