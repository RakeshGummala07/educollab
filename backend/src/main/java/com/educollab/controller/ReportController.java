package com.educollab.controller;

import com.educollab.dto.request.SubmitReportRequest;
import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.ReportResponse;
import com.educollab.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportResponse>> submitReport(
            @Valid @RequestBody SubmitReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ReportResponse report = reportService.submitReport(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report submitted — a teacher will review it", report));
    }
}
