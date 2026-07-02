package com.educollab.controller;

import com.educollab.dto.response.ApiResponse;
import com.educollab.service.S3Service;
import com.educollab.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final S3Service s3Service;
    private final UserService userService;

    // ── Upload post image ─────────────────────────────────────────────────
    @PostMapping(value = "/upload/image",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String url = s3Service.uploadImage(file, "posts/images");

        Map<String, String> result = new HashMap<>();
        result.put("url", url);
        result.put("type", "image");
        result.put("originalName", file.getOriginalFilename());
        result.put("size", String.valueOf(file.getSize()));

        return ResponseEntity.ok(ApiResponse.success("Image uploaded", result));
    }

    // ── Upload post video ─────────────────────────────────────────────────
    @PostMapping(value = "/upload/video",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String url = s3Service.uploadVideo(file, "posts/videos");

        Map<String, String> result = new HashMap<>();
        result.put("url", url);
        result.put("type", "video");
        result.put("originalName", file.getOriginalFilename());
        result.put("size", String.valueOf(file.getSize()));

        return ResponseEntity.ok(ApiResponse.success("Video uploaded", result));
    }

    // ── Upload avatar ─────────────────────────────────────────────────────
    @PostMapping(value = "/upload/avatar",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String url = s3Service.uploadImage(file, "avatars");

        // Update user's avatarUrl in MySQL
        userService.updateAvatar(userDetails.getUsername(), url);

        Map<String, String> result = new HashMap<>();
        result.put("url", url);

        return ResponseEntity.ok(ApiResponse.success("Avatar updated", result));
    }

    // ── Delete file ───────────────────────────────────────────────────────
    @DeleteMapping("/delete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @RequestParam("url") String fileUrl) {

        s3Service.deleteFile(fileUrl);
        return ResponseEntity.ok(ApiResponse.success("File deleted"));
    }
}
