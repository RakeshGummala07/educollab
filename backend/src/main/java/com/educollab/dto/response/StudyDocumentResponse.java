package com.educollab.dto.response;

import com.educollab.document.StudyDocument;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StudyDocumentResponse {

    private String id;
    private String fileName;
    private String fileUrl;
    private StudyDocument.IngestionStatus status;
    private Integer chunkCount;
    private String errorMessage;
    private LocalDateTime createdAt;

    public static StudyDocumentResponse from(StudyDocument d) {
        return StudyDocumentResponse.builder()
                .id(d.getId())
                .fileName(d.getFileName())
                .fileUrl(d.getFileUrl())
                .status(d.getStatus())
                .chunkCount(d.getChunkCount())
                .errorMessage(d.getErrorMessage())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
