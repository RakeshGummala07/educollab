package com.educollab.service;

import com.educollab.document.Post;
import com.educollab.dto.request.AddCommentRequest;
import com.educollab.dto.request.CreatePostRequest;
import com.educollab.dto.request.UpdatePostRequest;
import com.educollab.dto.response.PageResponse;
import com.educollab.dto.response.PostResponse;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import com.educollab.repository.mongo.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository      postRepository;
    private final UserRepository      userRepository;
    private final S3Service           s3Service;
    private final EnrollmentService   enrollmentService;
    private final NotificationService notificationService;

    // ── Create Post ───────────────────────────────────────────────────────
    public PostResponse createPost(String authorEmail, CreatePostRequest request) {
        User author = findUser(authorEmail);

        Post.PostType type = Post.PostType.TEXT;
        if (request.getMediaAttachments() != null && !request.getMediaAttachments().isEmpty()) {
            boolean hasVideo = request.getMediaAttachments().stream()
                    .anyMatch(m -> "video".equals(m.getType()));
            type = hasVideo ? Post.PostType.VIDEO : Post.PostType.IMAGE;
        }

        List<Post.MediaAttachment> attachments = new ArrayList<>();
        if (request.getMediaAttachments() != null) {
            attachments = request.getMediaAttachments().stream()
                    .map(m -> Post.MediaAttachment.builder()
                            .url(m.getUrl()).type(m.getType())
                            .originalName(m.getOriginalName()).size(m.getSize())
                            .build())
                    .collect(Collectors.toList());
        }

        Post post = Post.builder()
                .authorId(author.getId())
                .authorUsername(author.getUsername())
                .authorFullName(author.getFullName())
                .authorAvatarUrl(author.getAvatarUrl())
                .authorRole(author.getRole().name())
                .content(request.getContent())
                .type(type)
                .mediaAttachments(attachments)
                .published(true).deleted(false)
                .build();

        Post saved = postRepository.save(post);
        log.info("Post created by {} (id={})", authorEmail, saved.getId());
        return PostResponse.from(saved, author.getId());
    }

    // ── Get Feed ──────────────────────────────────────────────────────────
    public PageResponse<PostResponse> getFeed(String currentUserEmail, int page, int size) {
        User currentUser = findUser(currentUserEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository
                .findByPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(pageable);
        return PageResponse.from(posts.map(p -> PostResponse.from(p, currentUser.getId())));
    }

    // ── Get Teacher Posts Feed ────────────────────────────────────────────
    public PageResponse<PostResponse> getTeacherFeed(String currentUserEmail, int page, int size) {
        User currentUser = findUser(currentUserEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository
                .findByAuthorRoleAndPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(
                        User.Role.ROLE_TEACHER.name(), pageable);
        return PageResponse.from(posts.map(p -> PostResponse.from(p, currentUser.getId())));
    }

    // ── Get My Posts ──────────────────────────────────────────────────────
    public PageResponse<PostResponse> getMyPosts(String currentUserEmail, int page, int size) {
        User currentUser = findUser(currentUserEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository
                .findByAuthorIdAndPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(
                        currentUser.getId(), pageable);
        return PageResponse.from(posts.map(p -> PostResponse.from(p, currentUser.getId())));
    }

    // ── Get Posts by Author ───────────────────────────────────────────────
    public PageResponse<PostResponse> getPostsByAuthor(
            String authorUsername, String currentUserEmail, int page, int size) {
        User author = userRepository.findByUsername(authorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authorUsername));
        User currentUser = findUser(currentUserEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository
                .findByAuthorIdAndPublishedTrueAndDeletedFalseOrderByCreatedAtDesc(
                        author.getId(), pageable);
        return PageResponse.from(posts.map(p -> PostResponse.from(p, currentUser.getId())));
    }

    // ── Search Posts ──────────────────────────────────────────────────────
    public PageResponse<PostResponse> searchPosts(
            String keyword, String currentUserEmail, int page, int size) {
        User currentUser = findUser(currentUserEmail);
        List<Post> allResults = postRepository.searchByContent(keyword);
        int start = Math.min(page * size, allResults.size());
        int end   = Math.min(start + size, allResults.size());
        List<PostResponse> responses = allResults.subList(start, end).stream()
                .map(p -> PostResponse.from(p, currentUser.getId()))
                .collect(Collectors.toList());
        Page<PostResponse> resultPage = new PageImpl<>(
                responses, PageRequest.of(page, size), allResults.size());
        return PageResponse.from(resultPage);
    }

    // ── Get Single Post ───────────────────────────────────────────────────
    public PostResponse getPost(String postId, String currentUserEmail) {
        User currentUser = findUser(currentUserEmail);
        Post post = findPost(postId);
        return PostResponse.from(post, currentUser.getId());
    }

    // ── Update Post ───────────────────────────────────────────────────────
    public PostResponse updatePost(String postId, String currentUserEmail,
                                    UpdatePostRequest request) {
        User currentUser = findUser(currentUserEmail);
        Post post = findPost(postId);
        if (!post.getAuthorId().equals(currentUser.getId()))
            throw new BadRequestException("You can only edit your own posts");
        post.setContent(request.getContent());
        return PostResponse.from(postRepository.save(post), currentUser.getId());
    }

    // ── Delete Post ───────────────────────────────────────────────────────
    public void deletePost(String postId, String currentUserEmail) {

        User currentUser = findUser(currentUserEmail);
        Post post = findPost(postId);

        // Owner can always delete
        if (post.getAuthorId().equals(currentUser.getId())) {
            softDelete(post, currentUserEmail, currentUser);
            return;
        }

        // Students cannot delete others' posts
        if (currentUser.getRole() == User.Role.ROLE_STUDENT) {
            throw new BadRequestException("You can only delete your own posts");
        }

    // Teachers cannot delete other teachers' posts
    if (post.getAuthorRole().equals(User.Role.ROLE_TEACHER.name())) {
        throw new BadRequestException(
                "You cannot delete another teacher's posts");
    }

    // Teacher can delete only if the student belongs to their community
    boolean enrolled = enrollmentService.isStudentUnderTeacher(
            currentUser.getId(),
            post.getAuthorId()
    );

    if (!enrolled) {
        throw new BadRequestException(
                "You can only delete posts of students enrolled in your community");
    }

    softDelete(post, currentUserEmail, currentUser);
}

private void softDelete(Post post, String email, User currentUser) {

    post.setDeleted(true);
    postRepository.save(post);

    if (post.getMediaAttachments() != null) {
        post.getMediaAttachments().forEach(media -> {
            try {
                s3Service.deleteFile(media.getUrl());
            } catch (Exception ex) {
                log.warn("Failed to delete media {}", media.getUrl(), ex);
            }
        });
    }

    log.info("Post {} deleted by {} ({})",
            post.getId(),
            email,
            currentUser.getRole());
}

    // ── Toggle Like ───────────────────────────────────────────────────────
    public PostResponse toggleLike(String postId, String currentUserEmail) {
        User currentUser = findUser(currentUserEmail);
        Post post = findPost(postId);
        List<Long> likes = post.getLikedByUserIds() == null
                ? new ArrayList<>() : post.getLikedByUserIds();
                
         boolean isNowLiked;       
        if (likes.contains(currentUser.getId())) {
            likes.remove(currentUser.getId());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            isNowLiked = false;
        } else {
            likes.add(currentUser.getId());
            post.setLikeCount(post.getLikeCount() + 1);
            isNowLiked = true;
        }
        post.setLikedByUserIds(likes);
        Post saved = postRepository.save(post);

        // Notify post author (only when liking, not unliking)
        if (isNowLiked) {
            notificationService.notify(
                    post.getAuthorId(), currentUser.getId(),
                    com.educollab.document.Notification.NotificationType.POST_LIKE,
                    "New like on your post",
                    currentUser.getFullName() + " liked your post",
                    "POST", postId
            );
        }

        return PostResponse.from(saved, currentUser.getId());
    }

    // ── Add Comment ───────────────────────────────────────────────────────
    public PostResponse addComment(String postId, String currentUserEmail,
                                    AddCommentRequest request) {
        User currentUser = findUser(currentUserEmail);
        Post post = findPost(postId);
        Post.Comment comment = Post.Comment.builder()
                .id(UUID.randomUUID().toString())
                .authorId(currentUser.getId())
                .authorUsername(currentUser.getUsername())
                .authorFullName(currentUser.getFullName())
                .authorAvatarUrl(currentUser.getAvatarUrl())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .deleted(false)
                .build();
        List<Post.Comment> comments = post.getComments() == null
                ? new ArrayList<>() : post.getComments();
        comments.add(comment);
        post.setComments(comments);
        post.setCommentCount(post.getCommentCount() + 1);
        Post saved = postRepository.save(post);

        // Notify post author about the new comment
        notificationService.notify(
                post.getAuthorId(), currentUser.getId(),
                com.educollab.document.Notification.NotificationType.POST_COMMENT,
                "New comment on your post",
                currentUser.getFullName() + " commented: " +
                        (request.getContent().length() > 60
                                ? request.getContent().substring(0, 60) + "..."
                                : request.getContent()),
                "POST", postId
        );


        return PostResponse.from(saved, currentUser.getId());
    }

    // ── Delete Comment ────────────────────────────────────────────────────
    public PostResponse deleteComment(String postId, String commentId,
                                       String currentUserEmail) {
        User currentUser = findUser(currentUserEmail);
        Post post        = findPost(postId);

        List<Post.Comment> comments = post.getComments();
        if (comments == null)
            throw new ResourceNotFoundException("Comment not found");

        Post.Comment comment = comments.stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        boolean isCommentAuthor = comment.getAuthorId().equals(currentUser.getId());
        boolean isPostAuthor    = post.getAuthorId().equals(currentUser.getId());
        boolean isTeacher       = User.Role.ROLE_TEACHER.name()
                                      .equals(currentUser.getRole().name());

        if (!isCommentAuthor) {
            if (isPostAuthor) {
                // Post owner can delete any comment on their own post — allowed
            } else if (isTeacher) {
                // Teacher can only delete comments by their enrolled students
                User commentAuthor = userRepository.findById(comment.getAuthorId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                            "Comment author not found"));

                boolean commentByStudent =
                        User.Role.ROLE_STUDENT.equals(commentAuthor.getRole());

                if (!commentByStudent) {
                    throw new BadRequestException(
                        "Teachers cannot delete another teacher's comments");
                }

                boolean isEnrolled = enrollmentService
                        .isStudentUnderTeacher(currentUser.getId(), comment.getAuthorId());

                if (!isEnrolled) {
                    throw new BadRequestException(
                        "You can only moderate comments of students in your community");
                }
            } else {
                throw new BadRequestException("You can only delete your own comments");
            }
        }

        comment.setDeleted(true);
        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        return PostResponse.from(postRepository.save(post), currentUser.getId());
    }

    // ── Share Post ────────────────────────────────────────────────────────
    public PostResponse sharePost(String postId, String currentUserEmail) {
        User currentUser = findUser(currentUserEmail);
        Post post = findPost(postId);
        List<Long> shares = post.getSharedByUserIds() == null
                ? new ArrayList<>() : post.getSharedByUserIds();
        if (!shares.contains(currentUser.getId())) {
            shares.add(currentUser.getId());
            post.setShareCount(post.getShareCount() + 1);
            post.setSharedByUserIds(shares);
            postRepository.save(post);
        }
        return PostResponse.from(post, currentUser.getId());
    }
    

    // ── Get All Comments ──────────────────────────────────────────────────
    public List<Post.Comment> getComments(String postId) {
        Post post = findPost(postId);
        return post.getComments() == null ? List.of()
                : post.getComments().stream()
                        .filter(c -> !c.isDeleted())
                        .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                        .collect(Collectors.toList());
    }

    // ── Get Post Stats ────────────────────────────────────────────────────
    public Map<String, Object> getPostStats(String currentUserEmail) {
        User currentUser = findUser(currentUserEmail);
        long totalPosts = postRepository.count();
        long myPosts    = postRepository.countByAuthorIdAndDeletedFalse(currentUser.getId());
        return Map.of("totalPosts", totalPosts, "myPosts", myPosts);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Post findPost(String postId) {
        return postRepository.findByIdAndDeletedFalse(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));
    }


    
}
