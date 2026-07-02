package com.educollab.controller;

import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.UserProfileResponse;
import com.educollab.entity.Enrollment;
import com.educollab.entity.User;
import com.educollab.exception.ResourceNotFoundException;
import com.educollab.repository.UserRepository;
import com.educollab.service.EnrollmentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final UserRepository userRepository;

    // ── Student: send join request ────────────────────────────────────────
    @PostMapping("/request/{teacherId}")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<ApiResponse<Void>> requestToJoin(
            @PathVariable Long teacherId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User student = getUser(userDetails);
        String message = body != null ? body.get("message") : null;
        enrollmentService.requestToJoin(student.getId(), teacherId, message);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Join request sent successfully"));
    }

    // ── Student: cancel pending request ───────────────────────────────────
    @DeleteMapping("/cancel/{enrollmentId}")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @PathVariable Long enrollmentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User student = getUser(userDetails);
        enrollmentService.cancelRequest(student.getId(), enrollmentId);
        return ResponseEntity.ok(ApiResponse.success("Request cancelled"));
    }

    // ── Student: get all my requests ──────────────────────────────────────
    @GetMapping("/my-requests")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        User student = getUser(userDetails);
        List<EnrollmentResponse> requests = enrollmentService
                .getMyRequests(student.getId())
                .stream().map(EnrollmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Requests retrieved", requests));
    }

    // ── Student: get my active teachers ───────────────────────────────────
    @GetMapping("/my-teachers")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getMyTeachers(
            @AuthenticationPrincipal UserDetails userDetails) {

        User student = getUser(userDetails);
        List<UserProfileResponse> teachers = enrollmentService
                .getTeachersOfStudent(student.getId())
                .stream().map(UserProfileResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Teachers retrieved", teachers));
    }

    // ── Teacher: get pending requests ─────────────────────────────────────
    @GetMapping("/pending-requests")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getPendingRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = getUser(userDetails);
        List<EnrollmentResponse> requests = enrollmentService
                .getPendingRequests(teacher.getId())
                .stream().map(EnrollmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Pending requests", requests));
    }

    // ── Teacher: approve ──────────────────────────────────────────────────
    @PutMapping("/approve/{enrollmentId}")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<Void>> approveRequest(
            @PathVariable Long enrollmentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = getUser(userDetails);
        enrollmentService.approveRequest(teacher.getId(), enrollmentId);
        return ResponseEntity.ok(ApiResponse.success("Request approved"));
    }

    // ── Teacher: reject ───────────────────────────────────────────────────
    @PutMapping("/reject/{enrollmentId}")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable Long enrollmentId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = getUser(userDetails);
        String reason = body != null ? body.get("reason") : null;
        enrollmentService.rejectRequest(teacher.getId(), enrollmentId, reason);
        return ResponseEntity.ok(ApiResponse.success("Request rejected"));
    }

    // ── Teacher: directly add student ─────────────────────────────────────
    @PostMapping("/add/{studentId}")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<Void>> addStudent(
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = getUser(userDetails);
        enrollmentService.addStudentDirectly(teacher.getId(), studentId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student added to community"));
    }

    // ── Teacher: remove student ───────────────────────────────────────────
    @DeleteMapping("/remove/{studentId}")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<Void>> removeStudent(
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = getUser(userDetails);
        enrollmentService.removeStudent(teacher.getId(), studentId);
        return ResponseEntity.ok(ApiResponse.success("Student removed"));
    }

    // ── Teacher: get enrolled students ────────────────────────────────────
    @GetMapping("/my-students")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getMyStudents(
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = getUser(userDetails);
        List<UserProfileResponse> students = enrollmentService
                .getStudentsUnderTeacher(teacher.getId())
                .stream().map(UserProfileResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Students retrieved", students));
    }

    // ── Helper ────────────────────────────────────────────────────────────
    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // ── Response DTO ──────────────────────────────────────────────────────
    @Data
    public static class EnrollmentResponse {
        private Long id;
        private Long teacherId;
        private String teacherName;
        private String teacherUsername;
        private String teacherAvatarUrl;
        private String teacherSubject;
        private Long studentId;
        private String studentName;
        private String studentUsername;
        private String studentAvatarUrl;
        private String status;
        private String requestedBy;
        private String requestMessage;
        private String rejectReason;
        private String createdAt;

        public static EnrollmentResponse from(Enrollment e) {
            EnrollmentResponse r = new EnrollmentResponse();
            r.setId(e.getId());
            r.setTeacherId(e.getTeacher().getId());
            r.setTeacherName(e.getTeacher().getFullName());
            r.setTeacherUsername(e.getTeacher().getUsername());
            r.setTeacherAvatarUrl(e.getTeacher().getAvatarUrl());
            r.setTeacherSubject(e.getTeacher().getSubject());
            r.setStudentId(e.getStudent().getId());
            r.setStudentName(e.getStudent().getFullName());
            r.setStudentUsername(e.getStudent().getUsername());
            r.setStudentAvatarUrl(e.getStudent().getAvatarUrl());
            r.setStatus(e.getStatus().name());
            r.setRequestedBy(e.getRequestedBy());
            r.setRequestMessage(e.getRequestMessage());
            r.setRejectReason(e.getRejectReason());
            r.setCreatedAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
            return r;
        }
    }
}
