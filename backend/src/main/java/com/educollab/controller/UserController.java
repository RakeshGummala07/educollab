package com.educollab.controller;

import com.educollab.dto.request.ChangePasswordRequest;
import com.educollab.dto.request.UpdateProfileRequest;
import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.UserProfileResponse;
import com.educollab.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Own profile ───────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileResponse profile = userService.getMyProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", profile));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse profile = userService.updateMyProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    // ── Public profile lookup ─────────────────────────────────────────────

    @GetMapping("/{username}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @PathVariable String username) {
        UserProfileResponse profile = userService.getProfileByUsername(username);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved", profile));
    }

    // ── Teacher-only endpoints ────────────────────────────────────────────

    @GetMapping("/students")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllStudents() {
        List<UserProfileResponse> students = userService.getAllStudents();
        return ResponseEntity.ok(ApiResponse.success("Students retrieved", students));
    }

    // ── Admin (Teacher) endpoints ─────────────────────────────────────────

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/teachers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllTeachers() {
        List<UserProfileResponse> teachers = userService.getAllTeachers();
        return ResponseEntity.ok(ApiResponse.success("Teachers retrieved", teachers));
    }

    @PutMapping("/{userId}/toggle-lock")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> toggleUserLock(
            @PathVariable Long userId) {
        UserProfileResponse profile = userService.toggleUserLock(userId);
        return ResponseEntity.ok(ApiResponse.success("User lock status updated", profile));
    }
}
