package com.educollab.service;

import com.educollab.document.StudyDocument;
import com.educollab.dto.response.StudyDocumentResponse;
import com.educollab.repository.mongo.StudyDocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Deliberately a separate bean from DocumentIngestionService — Spring's
 * @Async only works through the proxy, so calling an @Async method from
 * within the same class it's defined in (self-invocation) silently runs
 * synchronously instead. Keeping this in its own bean guarantees the PDF
 * processing actually happens in the background.
 */
@Slf4j
@Service
public class DocumentIngestionWorker {

    private final StudyDocumentRepository studyDocumentRepository;
    private final VectorStore vectorStore;
    private final SimpMessagingTemplate messagingTemplate;

    // Explicit constructor (not @RequiredArgsConstructor) so @Lazy on
    // vectorStore is guaranteed honored — see AiChatService for why.
    public DocumentIngestionWorker(StudyDocumentRepository studyDocumentRepository,
                                    @Lazy VectorStore vectorStore,
                                    SimpMessagingTemplate messagingTemplate) {
        this.studyDocumentRepository = studyDocumentRepository;
        this.vectorStore = vectorStore;
        this.messagingTemplate = messagingTemplate;
    }

    @Async
    public void processAsync(String documentId, Long userId, byte[] pdfBytes) {
        StudyDocument doc = studyDocumentRepository.findById(documentId).orElse(null);
        if (doc == null) return;

        try {
            PagePdfDocumentReader reader = new PagePdfDocumentReader(new ByteArrayResource(pdfBytes));
            List<Document> pages = reader.get();

            TokenTextSplitter splitter = new TokenTextSplitter();
            List<Document> chunks = splitter.apply(pages);

            List<Document> taggedChunks = chunks.stream()
                    .map(chunk -> {
                        Map<String, Object> metadata = new HashMap<>(chunk.getMetadata());
                        metadata.put("userId", String.valueOf(userId));
                        metadata.put("studyDocumentId", documentId);
                        return new Document(chunk.getText(), metadata);
                    })
                    .collect(Collectors.toList());

            vectorStore.add(taggedChunks);

            doc.setStatus(StudyDocument.IngestionStatus.READY);
            doc.setChunkCount(taggedChunks.size());
            studyDocumentRepository.save(doc);
            log.info("Ingested document {} into Qdrant — {} chunks", documentId, taggedChunks.size());
        } catch (Exception e) {
            log.error("Failed to ingest document {}: {}", documentId, e.getMessage(), e);
            doc.setStatus(StudyDocument.IngestionStatus.FAILED);
            doc.setErrorMessage("Failed to process PDF: " + e.getMessage());
            studyDocumentRepository.save(doc);
        }

        // Push the final status over WebSocket so the frontend updates
        // immediately instead of only after a manual refresh/refetch.
        // Follows the same broadcast convention as NotificationConsumer's
        // "/topic/notifications/{recipientId}" — a simple per-user topic,
        // no Kafka round-trip needed since this only matters to one user
        // while they're actively on the page.
        try {
            StudyDocumentResponse response = StudyDocumentResponse.from(doc);
            messagingTemplate.convertAndSend(
                    "/topic/documents/" + userId,
                    response
            );
        } catch (Exception e) {
            log.warn("Failed to push document status update for {}: {}", documentId, e.getMessage());
        }
    }
}