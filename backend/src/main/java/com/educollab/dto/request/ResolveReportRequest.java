package com.educollab.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @Size(max = 500, message = "Notes must be under 500 characters")
    private String notes;
}
