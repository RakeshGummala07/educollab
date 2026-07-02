package com.educollab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "meetings",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "room_name")
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    // The host — always a teacher
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    // Unique LiveKit room identifier, e.g. "meeting-3f6a1c9e"
    @Column(name = "room_name", nullable = false, unique = true, length = 100)
    private String roomName;

    @Column(nullable = false)
    private LocalDateTime scheduledStart;

    @Column(nullable = false)
    private LocalDateTime scheduledEnd;

    private LocalDateTime actualStart;

    private LocalDateTime actualEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MeetingStatus status = MeetingStatus.SCHEDULED;

    @Column(nullable = false)
    @Builder.Default
    private Integer maxParticipants = 50;

    // Comma-separated feature flag; kept simple for MVP (no extra join table)
    @Column(nullable = false)
    @Builder.Default
    private Boolean recordingEnabled = false;

    // ── Moderation & room-behavior settings ─────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    @Builder.Default
    private ChatMode chatMode = ChatMode.EVERYONE;

    // Host has manually locked the room — no new joins accepted (waiting-room
    // approvals already inside are unaffected)
    @Column(nullable = false)
    @Builder.Default
    private Boolean locked = false;

    // When true, non-host participants land in a waiting room and must be
    // approved by the host/co-host before their LiveKit token is issued
    @Column(nullable = false)
    @Builder.Default
    private Boolean waitingRoomEnabled = false;

    // userId of whoever currently holds the screen-share "floor"; null = free.
    // Enforced as a soft lock at the WebSocket layer, not by LiveKit itself.
    private Long activeScreenShareUserId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public boolean isLive() {
        return status == MeetingStatus.LIVE;
    }

    public enum MeetingStatus {
        SCHEDULED, LIVE, ENDED, CANCELLED
    }

    public enum ChatMode {
        EVERYONE,               // public chat + private DMs, open to all
        HOST_ONLY_BROADCAST,    // only host/co-host can post publicly; DMs to host still allowed
        PRIVATE_TO_HOST_ONLY    // no participant-to-participant chat; all messages route to host as DM
    }
}
