package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "study_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyDocument {

    @Id
    private String id;

    @Indexed
    private Long userId;

    private String fileName;
    private String fileUrl;   // S3 URL, for re-download/reference

    @Builder.Default
    private IngestionStatus status = IngestionStatus.PROCESSING;

    private Integer chunkCount;
    private String errorMessage;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum IngestionStatus {
        PROCESSING, READY, FAILED
    }
}
