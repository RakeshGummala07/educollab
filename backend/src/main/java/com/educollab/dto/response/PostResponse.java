package com.educollab.dto.response;

import com.educollab.document.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {

    private String id;

    // Author
    private Long authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;
    private String authorRole;

    // Content
    private String content;
    private String type;

    // Media
    private List<Post.MediaAttachment> mediaAttachments;

    // Engagement
    private int likeCount;
    private int commentCount;
    private int shareCount;
    private boolean likedByCurrentUser;
    private boolean ownedByCurrentUser;

    // Top 3 comments preview
    private List<Post.Comment> recentComments;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Static factory ────────────────────────────────────────────────────
    public static PostResponse from(Post post, Long currentUserId) {
        boolean liked = post.getLikedByUserIds() != null
                && post.getLikedByUserIds().contains(currentUserId);
        boolean owned = post.getAuthorId() != null
                && post.getAuthorId().equals(currentUserId);

        // Return last 3 comments for preview
        List<Post.Comment> recentComments = post.getComments() == null
                ? List.of()
                : post.getComments().stream()
                        .filter(c -> !c.isDeleted())
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .limit(3)
                        .toList();

        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .authorUsername(post.getAuthorUsername())
                .authorFullName(post.getAuthorFullName())
                .authorAvatarUrl(post.getAuthorAvatarUrl())
                .authorRole(post.getAuthorRole())
                .content(post.getContent())
                .type(post.getType() != null ? post.getType().name() : "TEXT")
                .mediaAttachments(post.getMediaAttachments())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .likedByCurrentUser(liked)
                .ownedByCurrentUser(owned)
                .recentComments(recentComments)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
