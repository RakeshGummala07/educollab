package com.educollab.controller;

import com.educollab.document.Post;
import com.educollab.dto.request.AddCommentRequest;
import com.educollab.dto.request.CreatePostRequest;
import com.educollab.dto.request.UpdatePostRequest;
import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.PageResponse;
import com.educollab.dto.response.PostResponse;
import com.educollab.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // ── Create ────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.createPost(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Post created", post));
    }

    // ── Feed endpoints ────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "all") String filter,
            @AuthenticationPrincipal UserDetails userDetails) {

        PageResponse<PostResponse> feed;
        switch (filter) {
            case "teachers" -> feed = postService.getTeacherFeed(
                    userDetails.getUsername(), page, size);
            case "mine"     -> feed = postService.getMyPosts(
                    userDetails.getUsername(), page, size);
            default         -> feed = postService.getFeed(
                    userDetails.getUsername(), page, size);
        }
        return ResponseEntity.ok(ApiResponse.success("Feed loaded", feed));
    }

    // ── Search ────────────────────────────────────────────────────────────
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> searchPosts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        PageResponse<PostResponse> results =
                postService.searchPosts(q, userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }

    // ── Single post ───────────────────────────────────────────────────────
    @GetMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> getPost(
            @PathVariable String postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.getPost(postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Post retrieved", post));
    }

    // ── Posts by author ───────────────────────────────────────────────────
    @GetMapping("/user/{username}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getPostsByAuthor(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        PageResponse<PostResponse> posts =
                postService.getPostsByAuthor(username, userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Posts retrieved", posts));
    }

    // ── Update ────────────────────────────────────────────────────────────
    @PutMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable String postId,
            @Valid @RequestBody UpdatePostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.updatePost(
                postId, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Post updated", post));
    }

    // ── Delete ────────────────────────────────────────────────────────────
    @DeleteMapping("/{postId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        postService.deletePost(postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Post deleted"));
    }

    // ── Like ──────────────────────────────────────────────────────────────
    @PostMapping("/{postId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> toggleLike(
            @PathVariable String postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.toggleLike(postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Like toggled", post));
    }

    // ── Add comment ───────────────────────────────────────────────────────
    @PostMapping("/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> addComment(
            @PathVariable String postId,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.addComment(
                postId, userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", post));
    }

    // ── Delete comment ────────────────────────────────────────────────────
    @DeleteMapping("/{postId}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> deleteComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.deleteComment(
                postId, commentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", post));
    }

    // ── Get all comments ──────────────────────────────────────────────────
    @GetMapping("/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Post.Comment>>> getComments(
            @PathVariable String postId) {
        List<Post.Comment> comments = postService.getComments(postId);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved", comments));
    }

    // ── Share ─────────────────────────────────────────────────────────────
    @PostMapping("/{postId}/share")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PostResponse>> sharePost(
            @PathVariable String postId,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse post = postService.sharePost(postId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Post shared", post));
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    @GetMapping("/stats/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> stats = postService.getPostStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved", stats));
    }
}
