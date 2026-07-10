package com.educollab.service;

import com.educollab.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.aws.bucket-name}")
    private String bucketName;

    @Value("${app.aws.region}")
    private String region;

    @Value("${app.aws.endpoint:}")
    private String endpoint;          // Empty = real AWS, set = MinIO

    @Value("${app.media.max-image-size}")
    private long maxImageSize;

    @Value("${app.media.max-video-size}")
    private long maxVideoSize;

    private static final List<String> ALLOWED_IMAGE_TYPES =
            Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");

    private static final List<String> ALLOWED_VIDEO_TYPES =
            Arrays.asList("video/mp4", "video/quicktime", "video/x-msvideo");

    private static final List<String> ALLOWED_DOCUMENT_TYPES =
            Arrays.asList("application/pdf");

    // ── Upload image ──────────────────────────────────────────────────────
    public String uploadImage(MultipartFile file, String folder) {
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new BadRequestException(
                "Invalid image type. Allowed: JPEG, PNG, GIF, WebP"
            );
        }
        if (file.getSize() > maxImageSize) {
            throw new BadRequestException("Image size exceeds 10MB limit");
        }
        return uploadFile(file, folder);
    }

    // ── Upload video ──────────────────────────────────────────────────────
    public String uploadVideo(MultipartFile file, String folder) {
        if (!ALLOWED_VIDEO_TYPES.contains(file.getContentType())) {
            throw new BadRequestException(
                "Invalid video type. Allowed: MP4, MOV, AVI"
            );
        }
        if (file.getSize() > maxVideoSize) {
            throw new BadRequestException("Video size exceeds 50MB limit");
        }
        return uploadFile(file, folder);
    }

    // ── Upload document (PDF) ────────────────────────────────────────────
    // Separate from uploadFile()/validateFile() on purpose: those are
    // image/video-only (used by the post service). Study-document uploads
    // (DocumentIngestionService) need PDFs to succeed, so this bypasses
    // validateFile() entirely and does its own PDF-specific check.
    public String uploadDocument(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File cannot be empty");
        }
        if (!ALLOWED_DOCUMENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Invalid document type. Allowed: PDF");
        }
        return uploadFileInternal(file, folder);
    }

    // ── Core upload (generic entrypoint, image/video only) ─────────────────
    public String uploadFile(MultipartFile file, String folder) {
        validateFile(file);
        return uploadFileInternal(file, folder);
    }

    // ── Shared S3 put logic, no content-type validation ─────────────────────
    // Callers (uploadImage/uploadVideo/uploadDocument/uploadFile) are
    // responsible for validating content type before calling this.
    private String uploadFileInternal(MultipartFile file, String folder) {
        String fileName    = generateFileName(file.getOriginalFilename());
        String s3Key       = folder + "/" + fileName;
        String contentType = file.getContentType();

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(
                request,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );

            String fileUrl = buildPublicUrl(s3Key);
            log.info("File uploaded: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("Upload failed: {}", e.getMessage());
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    // ── Delete file ───────────────────────────────────────────────────────
    public void deleteFile(String fileUrl) {
        try {
            String s3Key = extractKeyFromUrl(fileUrl);
            s3Client.deleteObject(
                DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build()
            );
            log.info("File deleted: {}", s3Key);
        } catch (Exception e) {
            // Log but don't throw — deletion failure shouldn't break the app
            log.error("Failed to delete file from storage: {}", e.getMessage());
        }
    }

    // ── Presigned URL (for private buckets / temporary access) ───────────
    public String generatePresignedUrl(String s3Key, int expiryMinutes) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiryMinutes))
                .getObjectRequest(r -> r.bucket(bucketName).key(s3Key))
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    // ── Build public URL ──────────────────────────────────────────────────
    // MinIO:  http://localhost:9000/educollab-media/posts/images/uuid.jpg
    // AWS S3: https://educollab-media.s3.ap-south-1.amazonaws.com/posts/images/uuid.jpg
    private String buildPublicUrl(String s3Key) {
        if (endpoint != null && !endpoint.isBlank()) {
            // MinIO path-style URL
            return String.format("%s/%s/%s", endpoint, bucketName, s3Key);
        }
        // AWS virtual-hosted style URL
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName, region, s3Key);
    }

    // ── Extract S3 key from full URL ──────────────────────────────────────
    private String extractKeyFromUrl(String fileUrl) {
        if (endpoint != null && !endpoint.isBlank()) {
            // MinIO: http://localhost:9000/educollab-media/posts/images/uuid.jpg
            // → posts/images/uuid.jpg
            String prefix = endpoint + "/" + bucketName + "/";
            return fileUrl.replace(prefix, "");
        }
        // AWS: https://bucket.s3.region.amazonaws.com/posts/images/uuid.jpg
        // → posts/images/uuid.jpg
        String prefix = String.format("https://%s.s3.%s.amazonaws.com/",
                bucketName, region);
        return fileUrl.replace(prefix, "");
    }

    // ── Validation (image/video only — used by uploadFile()) ────────────────
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File cannot be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new BadRequestException("Cannot determine file type");
        }
        boolean isImage = ALLOWED_IMAGE_TYPES.contains(contentType);
        boolean isVideo = ALLOWED_VIDEO_TYPES.contains(contentType);
        if (!isImage && !isVideo) {
            throw new BadRequestException(
                "File type not allowed: " + contentType +
                ". Allowed: JPEG, PNG, GIF, WebP, MP4, MOV, AVI"
            );
        }
    }

    // ── Generate unique filename ──────────────────────────────────────────
    private String generateFileName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename
                .substring(originalFilename.lastIndexOf("."))
                .toLowerCase();
        }
        return UUID.randomUUID().toString() + extension;
    }
}