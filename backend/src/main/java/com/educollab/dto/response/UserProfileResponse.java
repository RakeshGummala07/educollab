package com.educollab.dto.response;

import com.educollab.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String username;
    private String email;
    private User.Role role;
    private String roleDisplay;

    // Profile fields
    private String bio;
    private String avatarUrl;
    private String subject;
    private String institution;
    private String phone;
    private String location;
    private String linkedinUrl;
    private String websiteUrl;
    private Boolean profileComplete;

    // Meta
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed
    private Integer profileCompletionPercent;

    public static UserProfileResponse from(User user) {
        int completionPercent = calculateCompletion(user);

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .roleDisplay(user.getRole() == User.Role.ROLE_TEACHER ? "Teacher" : "Student")
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .subject(user.getSubject())
                .institution(user.getInstitution())
                .phone(user.getPhone())
                .location(user.getLocation())
                .linkedinUrl(user.getLinkedinUrl())
                .websiteUrl(user.getWebsiteUrl())
                .profileComplete(user.getProfileComplete())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .profileCompletionPercent(completionPercent)
                .build();
    }

    private static int calculateCompletion(User user) {
        int total = 7;
        int filled = 0;
        if (user.getBio() != null && !user.getBio().isBlank()) filled++;
        if (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank()) filled++;
        if (user.getInstitution() != null && !user.getInstitution().isBlank()) filled++;
        if (user.getPhone() != null && !user.getPhone().isBlank()) filled++;
        if (user.getLocation() != null && !user.getLocation().isBlank()) filled++;
        if (user.getLinkedinUrl() != null && !user.getLinkedinUrl().isBlank()) filled++;
        if (user.getSubject() != null && !user.getSubject().isBlank()) filled++;
        return (int) Math.round((filled * 100.0) / total);
    }
}
