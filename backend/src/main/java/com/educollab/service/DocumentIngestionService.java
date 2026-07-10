package com.educollab.service;

import com.educollab.document.StudyDocument;
import com.educollab.dto.response.StudyDocumentResponse;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.StudyDocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

/**
 * NOTE FOR DEV: the actual PDF text-extraction/chunking/embedding pipeline
 * lives in DocumentIngestionWorker (a separate bean, required for @Async to
 * actually take effect — see that class's Javadoc). This service handles
 * upload validation, S3 storage, and Mongo metadata only.
 */
@Slf4j
@Service
public class DocumentIngestionService {

    private final StudyDocumentRepository studyDocumentRepository;
    private final S3Service s3Service;
    private final VectorStore vectorStore;
    private final UserRepository userRepository;
    private final DocumentIngestionWorker documentIngestionWorker;

    // Explicit constructor (not @RequiredArgsConstructor) so @Lazy on
    // vectorStore is guaranteed honored — see AiChatService for why.
    public DocumentIngestionService(StudyDocumentRepository studyDocumentRepository,
                                     S3Service s3Service,
                                     @Lazy VectorStore vectorStore,
                                     UserRepository userRepository,
                                     DocumentIngestionWorker documentIngestionWorker) {
        this.studyDocumentRepository = studyDocumentRepository;
        this.s3Service = s3Service;
        this.vectorStore = vectorStore;
        this.userRepository = userRepository;
        this.documentIngestionWorker = documentIngestionWorker;
    }

    private static final long MAX_PDF_SIZE_BYTES = 20L * 1024 * 1024; // 20MB

    public StudyDocumentResponse uploadDocument(String userEmail, MultipartFile file) {
        User user = findUser(userEmail);
        if (file.isEmpty()) throw new BadRequestException("File is empty");
        if (file.getSize() > MAX_PDF_SIZE_BYTES) throw new BadRequestException("PDF must be under 20MB");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf"))
            throw new BadRequestException("Only PDF files are supported");

        String fileUrl = s3Service.uploadDocument(file, "study-documents");

        StudyDocument doc = StudyDocument.builder()
                .userId(user.getId())
                .fileName(file.getOriginalFilename())
                .fileUrl(fileUrl)
                .status(StudyDocument.IngestionStatus.PROCESSING)
                .build();
        doc = studyDocumentRepository.save(doc);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            doc.setStatus(StudyDocument.IngestionStatus.FAILED);
            doc.setErrorMessage("Could not read uploaded file");
            studyDocumentRepository.save(doc);
            return StudyDocumentResponse.from(doc);
        }

        documentIngestionWorker.processAsync(doc.getId(), user.getId(), bytes);
        return StudyDocumentResponse.from(doc);
    }

    public List<StudyDocumentResponse> listMyDocuments(String userEmail) {
        User user = findUser(userEmail);
        return studyDocumentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(StudyDocumentResponse::from)
                .collect(Collectors.toList());
    }

    public StudyDocument requireOwnDocument(String userEmail, String documentId) {
        return requireOwnDocument(findUser(userEmail), documentId);
    }

    public StudyDocument requireOwnDocument(User user, String documentId) {
        StudyDocument doc = studyDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUserId().equals(user.getId()))
            throw new BadRequestException("You don't have access to this document");
        return doc;
    }

    public void deleteDocument(String userEmail, String documentId) {
        User user = findUser(userEmail);
        StudyDocument doc = requireOwnDocument(user, documentId);
        // Best-effort: remove vectors tagged with this document. Portable
        // filter-expression delete varies by store version — if this throws,
        // the Mongo metadata record is still removed below so the document
        // disappears from the UI; orphaned vectors are harmless (they're
        // never retrievable without a matching userId+studyDocumentId query
        // that the UI no longer issues once the document record is gone).
        try {
            vectorStore.delete("studyDocumentId == '" + documentId + "'");
        } catch (Exception e) {
            log.warn("Could not delete vectors for document {}: {}", documentId, e.getMessage());
        }
        studyDocumentRepository.delete(doc);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}