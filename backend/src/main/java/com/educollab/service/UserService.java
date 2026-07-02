package com.educollab.service;

import com.educollab.dto.request.ChangePasswordRequest;
import com.educollab.dto.request.UpdateProfileRequest;
import com.educollab.dto.response.UserProfileResponse;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Get current user profile ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(String email) {
        User user = findByEmail(email);
        return UserProfileResponse.from(user);
    }

    // ── Get any user profile by username ─────────────────────────────────
    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return UserProfileResponse.from(user);
    }

    // ── Get profile by ID ─────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserProfileResponse getProfileById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserProfileResponse.from(user);
    }

    // ── Update profile ────────────────────────────────────────────────────
    @Transactional
    public UserProfileResponse updateMyProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getSubject() != null) {
            user.setSubject(request.getSubject());
        }
        if (request.getInstitution() != null) {
            user.setInstitution(request.getInstitution());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getLocation() != null) {
            user.setLocation(request.getLocation());
        }
        if (request.getLinkedinUrl() != null) {
            user.setLinkedinUrl(request.getLinkedinUrl());
        }
        if (request.getWebsiteUrl() != null) {
            user.setWebsiteUrl(request.getWebsiteUrl());
        }

        // Recalculate profile completion
        UserProfileResponse preview = UserProfileResponse.from(user);
        user.setProfileComplete(preview.getProfileCompletionPercent() >= 70);

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", email);
        return UserProfileResponse.from(saved);
    }

    // ── Change password ───────────────────────────────────────────────────
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findByEmail(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New passwords do not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", email);
    }

    // ── Update avatar URL (called after S3 upload on Day 3) ──────────────
    @Transactional
    public UserProfileResponse updateAvatar(String email, String avatarUrl) {
        User user = findByEmail(email);
        user.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(user);
        return UserProfileResponse.from(saved);
    }

    // ── Admin: get all users ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserProfileResponse::from)
                .collect(Collectors.toList());
    }

    // ── Admin: get all teachers ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllTeachers() {
        return userRepository.findByRole(User.Role.ROLE_TEACHER)
                .stream()
                .map(UserProfileResponse::from)
                .collect(Collectors.toList());
    }

    // ── Admin: get all students ───────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllStudents() {
        return userRepository.findByRole(User.Role.ROLE_STUDENT)
                .stream()
                .map(UserProfileResponse::from)
                .collect(Collectors.toList());
    }

    // ── Admin: toggle user lock ───────────────────────────────────────────
    @Transactional
    public UserProfileResponse toggleUserLock(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setAccountNonLocked(!user.getAccountNonLocked());
        User saved = userRepository.save(user);
        log.info("User {} lock status toggled to: {}", userId, !saved.getAccountNonLocked());
        return UserProfileResponse.from(saved);
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
