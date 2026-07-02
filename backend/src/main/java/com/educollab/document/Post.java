package com.educollab.document;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    private String id;

    // ── Author info (denormalized from MySQL for performance) ─────────────
    @Indexed
    private Long authorId;           // MySQL user ID
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;
    private String authorRole;       // ROLE_TEACHER / ROLE_STUDENT

    // ── Content ───────────────────────────────────────────────────────────
    private String content;          // Text body (max 2000 chars)
    private PostType type;           // TEXT / IMAGE / VIDEO

    // ── Media attachments ─────────────────────────────────────────────────
    @Builder.Default
    private List<MediaAttachment> mediaAttachments = new ArrayList<>();

    // ── Engagement ────────────────────────────────────────────────────────
    @Builder.Default
    private List<Long> likedByUserIds = new ArrayList<>();  // MySQL user IDs

    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @Builder.Default
    private List<Long> sharedByUserIds = new ArrayList<>();

    @Builder.Default
    private int likeCount = 0;

    @Builder.Default
    private int commentCount = 0;

    @Builder.Default
    private int shareCount = 0;

    // ── Status ────────────────────────────────────────────────────────────
    @Builder.Default
    private boolean published = true;

    @Builder.Default
    private boolean deleted = false;

    // ── Audit ─────────────────────────────────────────────────────────────
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Nested: Media attachment ──────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaAttachment {
        private String url;
        private String type;          // "image" or "video"
        private String originalName;
        private Long size;
    }

    // ── Nested: Comment ───────────────────────────────────────────────────
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Comment {
        private String id;            // UUID
        private Long authorId;
        private String authorUsername;
        private String authorFullName;
        private String authorAvatarUrl;
        private String content;
        private LocalDateTime createdAt;

        @Builder.Default
        private boolean deleted = false;
    }

    // ── Enum ──────────────────────────────────────────────────────────────
    public enum PostType {
        TEXT, IMAGE, VIDEO
    }
}
