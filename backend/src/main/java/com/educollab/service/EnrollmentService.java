package com.educollab.service;

import com.educollab.entity.Enrollment;
import com.educollab.entity.User;
import com.educollab.exception.BadRequestException;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.EnrollmentRepository;
import com.educollab.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ── Student sends join request ────────────────────────────────────────
    @Transactional
    public Enrollment requestToJoin(Long studentId, Long teacherId, String message) {
        User student = findUser(studentId);
        User teacher = findUser(teacherId);

        if (!student.isStudent())
            throw new BadRequestException("Only students can send join requests");
        if (!teacher.isTeacher())
            throw new BadRequestException("Target user is not a teacher");

        Optional<Enrollment> existing =
                enrollmentRepository.findByTeacherAndStudent(teacher, student);

        if (existing.isPresent()) {
            Enrollment e = existing.get();
            switch (e.getStatus()) {
                case ACTIVE  -> throw new BadRequestException(
                        "You are already enrolled in this community");
                case PENDING -> throw new BadRequestException(
                        "You already have a pending request for this teacher");
                case REJECTED, REMOVED -> {
                    e.setStatus(Enrollment.EnrollmentStatus.PENDING);
                    e.setRequestMessage(message);
                    e.setRejectReason(null);
                    Enrollment saved = enrollmentRepository.save(e);
                    notifyEnrollmentRequest(teacher, student, saved);
                    return enrollmentRepository.save(e);
                }
            }
        }

        Enrollment enrollment = Enrollment.builder()
                .teacher(teacher)
                .student(student)
                .status(Enrollment.EnrollmentStatus.PENDING)
                .requestedBy("STUDENT")
                .requestMessage(message)
                .build();

        log.info("Student {} requested to join teacher {}'s community", studentId, teacherId);
        Enrollment saved = enrollmentRepository.save(enrollment);
        notifyEnrollmentRequest(teacher, student, saved);
        return saved;
    }


    private void notifyEnrollmentRequest(User teacher, User student, Enrollment enrollment) {
        notificationService.notify(
                teacher.getId(), student.getId(),
                com.educollab.document.Notification.NotificationType.ENROLLMENT_REQUEST,
                "New join request",
                student.getFullName() + " wants to join your community",
                "ENROLLMENT", String.valueOf(enrollment.getId())
        );
    }

    // ── Teacher approves ──────────────────────────────────────────────────
    @Transactional
    public Enrollment approveRequest(Long teacherId, Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment request not found"));

        if (!enrollment.getTeacher().getId().equals(teacherId))
            throw new BadRequestException("This request is not for your community");

        if (enrollment.getStatus() != Enrollment.EnrollmentStatus.PENDING)
            throw new BadRequestException("This request is no longer pending");

        enrollment.setStatus(Enrollment.EnrollmentStatus.ACTIVE);
        log.info("Teacher {} approved enrollment {}", teacherId, enrollmentId);
        Enrollment saved = enrollmentRepository.save(enrollment);

        notificationService.notify(
                enrollment.getStudent().getId(), teacherId,
                com.educollab.document.Notification.NotificationType.ENROLLMENT_APPROVED,
                "Request approved!",
                enrollment.getTeacher().getFullName() + " approved your join request",
                "ENROLLMENT", String.valueOf(enrollment.getId())
        );

        return saved;
    }

    // ── Teacher rejects ───────────────────────────────────────────────────
    @Transactional
    public Enrollment rejectRequest(Long teacherId, Long enrollmentId, String reason) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment request not found"));

        if (!enrollment.getTeacher().getId().equals(teacherId))
            throw new BadRequestException("This request is not for your community");

        if (enrollment.getStatus() != Enrollment.EnrollmentStatus.PENDING)
            throw new BadRequestException("This request is no longer pending");

        enrollment.setStatus(Enrollment.EnrollmentStatus.REJECTED);
        enrollment.setRejectReason(reason);
        log.info("Teacher {} rejected enrollment {}", teacherId, enrollmentId);
        Enrollment saved = enrollmentRepository.save(enrollment);

        notificationService.notify(
                enrollment.getStudent().getId(), teacherId,
                com.educollab.document.Notification.NotificationType.ENROLLMENT_REJECTED,
                "Request declined",
                enrollment.getTeacher().getFullName() + " declined your join request" +
                        (reason != null && !reason.isBlank() ? ": " + reason : ""),
                "ENROLLMENT", String.valueOf(enrollment.getId())
        );

        return saved;
    }

    // ── Teacher adds student directly ─────────────────────────────────────
    @Transactional
    public Enrollment addStudentDirectly(Long teacherId, Long studentId) {
        User teacher = findUser(teacherId);
        User student = findUser(studentId);

        if (!teacher.isTeacher())
            throw new BadRequestException("Only teachers can add students directly");
        if (!student.isStudent())
            throw new BadRequestException("Target user is not a student");

        Optional<Enrollment> existing =
                enrollmentRepository.findByTeacherAndStudent(teacher, student);

        if (existing.isPresent()) {
            Enrollment e = existing.get();
            if (e.getStatus() == Enrollment.EnrollmentStatus.ACTIVE)
                throw new BadRequestException("Student is already enrolled");
            e.setStatus(Enrollment.EnrollmentStatus.ACTIVE);
            e.setRequestedBy("TEACHER");
            return enrollmentRepository.save(e);
        }

        Enrollment enrollment = Enrollment.builder()
                .teacher(teacher).student(student)
                .status(Enrollment.EnrollmentStatus.ACTIVE)
                .requestedBy("TEACHER")
                .build();

        log.info("Teacher {} directly added student {}", teacherId, studentId);
        return enrollmentRepository.save(enrollment);
    }

    // ── Teacher removes student ───────────────────────────────────────────
    @Transactional
    public void removeStudent(Long teacherId, Long studentId) {
        User teacher = findUser(teacherId);
        User student = findUser(studentId);

        Enrollment enrollment = enrollmentRepository
                .findByTeacherAndStudent(teacher, student)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));

        enrollment.setStatus(Enrollment.EnrollmentStatus.REMOVED);
        enrollmentRepository.save(enrollment);
        log.info("Teacher {} removed student {}", teacherId, studentId);
    }

    // ── Student cancels request ───────────────────────────────────────────
    @Transactional
    public void cancelRequest(Long studentId, Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!enrollment.getStudent().getId().equals(studentId))
            throw new BadRequestException("This is not your request");

        if (enrollment.getStatus() != Enrollment.EnrollmentStatus.PENDING)
            throw new BadRequestException("Only pending requests can be cancelled");

        enrollment.setStatus(Enrollment.EnrollmentStatus.REMOVED);
        enrollmentRepository.save(enrollment);
    }

    // ── Getters ───────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Enrollment> getPendingRequests(Long teacherId) {
        return enrollmentRepository.findPendingRequestsByTeacher(findUser(teacherId));
    }

    @Transactional(readOnly = true)
    public List<Enrollment> getMyRequests(Long studentId) {
        return enrollmentRepository.findAllByStudent(findUser(studentId));
    }

    @Transactional(readOnly = true)
    public List<User> getStudentsUnderTeacher(Long teacherId) {
        return enrollmentRepository.findStudentsByTeacher(findUser(teacherId));
    }

    @Transactional(readOnly = true)
    public List<User> getTeachersOfStudent(Long studentId) {
        return enrollmentRepository.findTeachersByStudent(findUser(studentId));
    }

    @Transactional(readOnly = true)
    public boolean isStudentUnderTeacher(Long teacherId, Long studentId) {
        User teacher = findUser(teacherId);
        User student = findUser(studentId);
        return enrollmentRepository.isStudentEnrolledUnderTeacher(teacher, student);
    }

    @Transactional(readOnly = true)
    public boolean isStudentUnderTeacher(User teacher, User student) {
        return enrollmentRepository.isStudentEnrolledUnderTeacher(teacher, student);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}
