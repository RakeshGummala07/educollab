package com.educollab.dto.request;

import com.educollab.document.Report;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubmitReportRequest {

    @NotNull(message = "contentType is required")
    private Report.ContentType contentType;

    @NotBlank(message = "contentId is required")
    private String contentId;

    // Required only when contentType == COMMENT
    private String commentId;

    @NotNull(message = "reason is required")
    private Report.ReportReason reason;

    @Size(max = 500, message = "Description must be under 500 characters")
    private String description;
}
