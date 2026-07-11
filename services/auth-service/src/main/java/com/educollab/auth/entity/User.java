package com.educollab.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Auth Service owns the canonical User record — identity, credentials,
 * role, and account status. Other services (Feed, Chat, Meetings, Admin,
 * AI) do NOT get their own copy of this table; they reference a user only
 * by userId and call this service's REST API when they need a display
 * name, avatar, or role.
 *
 * NOTE: this intentionally keeps the monolith's full field set (profile
 * fields like bio/institution, admin-moderation fields like
 * chatRestricted) for this first migration pass, rather than immediately
 * splitting Profile data into its own service. Splitting further is a
 * follow-up refinement once the core service boundary is proven out —
 * see services/README.md for the phased plan.
 */
@Entity
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "email"),
           @UniqueConstraint(columnNames = "username")
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String firstName;

    @Column(nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean accountNonLocked = true;

    // ── Admin moderation ──────────────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private Boolean chatRestricted = false;

    @Column(length = 300)
    private String chatRestrictedReason;

    private LocalDateTime chatRestrictedAt;

    // ── Profile fields ────────────────────────────────────────────────────
    @Column(length = 500)
    private String bio;

    @Column(length = 255)
    private String avatarUrl;

    @Column(length = 100)
    private String subject;

    @Column(length = 100)
    private String institution;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String location;

    @Column(length = 255)
    private String linkedinUrl;

    @Column(length = 255)
    private String websiteUrl;

    @Column(nullable = false)
    @Builder.Default
    private Boolean profileComplete = false;

    // ── Audit ─────────────────────────────────────────────────────────────
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Helpers ───────────────────────────────────────────────────────────
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isTeacher() {
        return Role.ROLE_TEACHER.equals(this.role);
    }

    public boolean isStudent() {
        return Role.ROLE_STUDENT.equals(this.role);
    }

    public enum Role {
        ROLE_STUDENT,
        ROLE_TEACHER
    }
}
