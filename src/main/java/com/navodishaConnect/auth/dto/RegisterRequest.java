package com.navodishaConnect.auth.dto;

import com.navodishaConnect.user.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Phone number must follow E.164 format (e.g. +919876543210)")
    String phoneNumber,

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    String fullName,

    @Email(message = "Email must be a valid email address")
    String email,

    @NotNull(message = "Role is required (STUDENT, ALUMNUS, JNV_ADMIN, PLATFORM_ADMIN)")
    Role role,

    @NotBlank(message = "JNV school name is required")
    @Size(max = 150, message = "JNV name must not exceed 150 characters")
    String jnvName
) {}
