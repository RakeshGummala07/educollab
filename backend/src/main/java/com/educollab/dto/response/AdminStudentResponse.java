package com.educollab.dto.response;

import com.educollab.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStudentResponse {

    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String avatarUrl;
    private Boolean accountNonLocked;
    private Boolean chatRestricted;
    private String chatRestrictedReason;

    public static AdminStudentResponse from(User u) {
        return AdminStudentResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .username(u.getUsername())
                .email(u.getEmail())
                .avatarUrl(u.getAvatarUrl())
                .accountNonLocked(u.getAccountNonLocked())
                .chatRestricted(u.getChatRestricted())
                .chatRestrictedReason(u.getChatRestrictedReason())
                .build();
    }
}
