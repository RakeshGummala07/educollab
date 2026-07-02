package com.educollab.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"teacher_id", "student_id"})
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.PENDING;

    // Who initiated: "STUDENT" or "TEACHER"
    @Column(nullable = false, length = 10)
    @Builder.Default
    private String requestedBy = "STUDENT";

    @Column(length = 500)
    private String requestMessage;

    @Column(length = 500)
    private String rejectReason;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum EnrollmentStatus {
        PENDING,
        ACTIVE,
        REJECTED,
        REMOVED
    }
}
