package com.educollab.auth.dto.response;

import com.educollab.auth.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String username;
    private String email;
    private User.Role role;
    private String avatarUrl;
    private Boolean chatRestricted;
    private Boolean accountNonLocked;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .chatRestricted(user.getChatRestricted())
                .accountNonLocked(user.getAccountNonLocked())
                .build();
    }
}
