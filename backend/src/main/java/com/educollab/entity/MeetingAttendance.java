package com.educollab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_attendance",
       uniqueConstraints = {
           // A user can have exactly one attendance row per meeting; rejoins
           // simply update joinedAt/leftAt/durationSeconds on the same row.
           @UniqueConstraint(columnNames = {"meeting_id", "user_id"})
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime firstJoinedAt;

    private LocalDateTime lastJoinedAt;

    private LocalDateTime lastLeftAt;

    // Cumulative time in the room across all join/leave cycles
    @Column(nullable = false)
    @Builder.Default
    private Long durationSeconds = 0L;

    // True while the participant currently has an active LiveKit session
    @Column(nullable = false)
    @Builder.Default
    private Boolean currentlyPresent = false;

    // Attendance is only counted "PRESENT" once durationSeconds crosses a
    // minimum threshold (see MeetingService.ATTENDANCE_THRESHOLD_SECONDS)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.ABSENT;

    // ── Role & live moderation state ────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MeetingRole role = MeetingRole.PARTICIPANT;

    // Server-enforced state, mirrored from LiveKit moderation actions so the
    // REST/attendance layer always has a source of truth even if a client
    // reconnects mid-meeting.
    @Column(nullable = false)
    @Builder.Default
    private Boolean micMuted = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean cameraOff = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean handRaised = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AttendanceStatus {
        PRESENT, PARTIAL, ABSENT
    }

    public enum MeetingRole {
        HOST, CO_HOST, PARTICIPANT;

        public boolean isModerator() {
            return this == HOST || this == CO_HOST;
        }
    }
}
