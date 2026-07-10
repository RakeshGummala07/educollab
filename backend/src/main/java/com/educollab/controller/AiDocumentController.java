package com.educollab.controller;

import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.StudyDocumentResponse;
import com.educollab.service.DocumentIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/ai/documents")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AiDocumentController {

    private final DocumentIngestionService documentIngestionService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<StudyDocumentResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudyDocumentResponse response = documentIngestionService.uploadDocument(userDetails.getUsername(), file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded — processing in the background", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyDocumentResponse>>> list(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Documents loaded",
                documentIngestionService.listMyDocuments(userDetails.getUsername())));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String documentId, @AuthenticationPrincipal UserDetails userDetails) {
        documentIngestionService.deleteDocument(userDetails.getUsername(), documentId);
        return ResponseEntity.ok(ApiResponse.success("Document deleted"));
    }
}
