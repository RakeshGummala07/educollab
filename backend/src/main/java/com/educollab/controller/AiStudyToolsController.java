package com.educollab.controller;

import com.educollab.dto.request.GenerateAssignmentRequest;
import com.educollab.dto.request.GenerateQuizRequest;
import com.educollab.dto.request.SummarizeRequest;
import com.educollab.dto.response.ApiResponse;
import com.educollab.dto.response.AssignmentResponse;
import com.educollab.dto.response.QuizResponse;
import com.educollab.dto.response.SummaryResponse;
import com.educollab.service.StudyToolsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AiStudyToolsController {

    private final StudyToolsService studyToolsService;

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> generateQuiz(
            @Valid @RequestBody GenerateQuizRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Quiz generated",
                studyToolsService.generateQuiz(userDetails.getUsername(), request)));
    }

    @PostMapping("/assignment")
    public ResponseEntity<ApiResponse<AssignmentResponse>> generateAssignment(
            @Valid @RequestBody GenerateAssignmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Assignment generated",
                studyToolsService.generateAssignment(userDetails.getUsername(), request)));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<SummaryResponse>> summarize(
            @Valid @RequestBody SummarizeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Summary generated",
                studyToolsService.summarize(userDetails.getUsername(), request)));
    }
}
