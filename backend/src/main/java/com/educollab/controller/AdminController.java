package com.educollab.controller;

import com.educollab.dto.request.ResolveReportRequest;
import com.educollab.dto.request.RestrictChatRequest;
import com.educollab.dto.response.*;
import com.educollab.service.AdminService;
import com.educollab.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_TEACHER')")
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;

    // ── Student management ──────────────────────────────────────────────
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<AdminStudentResponse>>> listStudents(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Students loaded",
                adminService.listMyStudents(userDetails.getUsername())));
    }

    @DeleteMapping("/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudent(
            @PathVariable Long studentId, @AuthenticationPrincipal UserDetails userDetails) {
        adminService.removeStudent(userDetails.getUsername(), studentId);
        return ResponseEntity.ok(ApiResponse.success("Student removed"));
    }

    @PostMapping("/students/{studentId}/restrict-chat")
    public ResponseEntity<ApiResponse<AdminStudentResponse>> restrictChat(
            @PathVariable Long studentId, @Valid @RequestBody RestrictChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Chat restricted",
                adminService.restrictChat(userDetails.getUsername(), studentId, request)));
    }

    @PostMapping("/students/{studentId}/unrestrict-chat")
    public ResponseEntity<ApiResponse<AdminStudentResponse>> unrestrictChat(
            @PathVariable Long studentId, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Chat restriction lifted",
                adminService.unrestrictChat(userDetails.getUsername(), studentId)));
    }

    @PostMapping("/students/{studentId}/lock")
    public ResponseEntity<ApiResponse<AdminStudentResponse>> lockAccount(
            @PathVariable Long studentId, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Account suspended",
                adminService.lockAccount(userDetails.getUsername(), studentId)));
    }

    @PostMapping("/students/{studentId}/unlock")
    public ResponseEntity<ApiResponse<AdminStudentResponse>> unlockAccount(
            @PathVariable Long studentId, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Account unsuspended",
                adminService.unlockAccount(userDetails.getUsername(), studentId)));
    }

    // ── Analytics ────────────────────────────────────────────────────────
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Analytics loaded",
                adminService.getAnalytics(userDetails.getUsername())));
    }

    // ── Audit log ────────────────────────────────────────────────────────
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success("Audit log loaded",
                PageResponse.from(adminService.getAuditLog(userDetails.getUsername(), pageable))));
    }

    // ── Reports (moderation queue) ───────────────────────────────────────
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> listReports(
            @RequestParam(required = false, defaultValue = "all") String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Reports loaded",
                reportService.listReportsForTeacher(userDetails.getUsername(), status)));
    }

    @PostMapping("/reports/{reportId}/resolve")
    public ResponseEntity<ApiResponse<ReportResponse>> resolveReport(
            @PathVariable String reportId, @Valid @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Report resolved",
                reportService.resolveReport(userDetails.getUsername(), reportId, request)));
    }

    @PostMapping("/reports/{reportId}/dismiss")
    public ResponseEntity<ApiResponse<ReportResponse>> dismissReport(
            @PathVariable String reportId, @Valid @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Report dismissed",
                reportService.dismissReport(userDetails.getUsername(), reportId, request)));
    }
}
