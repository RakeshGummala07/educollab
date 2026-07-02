package com.educollab.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(min = 2, max = 50, message = "First name must be 2-50 characters")
    private String firstName;

    @Size(min = 2, max = 50, message = "Last name must be 2-50 characters")
    private String lastName;

    @Size(max = 500, message = "Bio must be under 500 characters")
    private String bio;

    @Size(max = 100, message = "Subject must be under 100 characters")
    private String subject;

    @Size(max = 100, message = "Institution must be under 100 characters")
    private String institution;

    @Pattern(regexp = "^[+]?[0-9\\s\\-().]{7,20}$", message = "Invalid phone number")
    private String phone;

    @Size(max = 100, message = "Location must be under 100 characters")
    private String location;

    @Pattern(regexp = "^(https?://)?([\\w]+\\.)?linkedin\\.com/.*$",
             message = "Invalid LinkedIn URL")
    private String linkedinUrl;

    @Pattern(regexp = "^(https?://).*$", message = "Website must start with http:// or https://")
    private String websiteUrl;
}
