package com.navodishaConnect.auth.dto;

import com.navodishaConnect.user.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for secure user registration.
 * Requires a cryptographically signed signupToken issued upon successful OTP verification.
 * Phone number is extracted from the token, preventing unauthorized registration with arbitrary numbers.
 */
public record RegisterRequest(
    @NotBlank(message = "Signup token is required. Please verify OTP first.")
    String signupToken,

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    String fullName,

    @NotNull(message = "Role is required (STUDENT, ALUMNUS, JNV_ADMIN)")
    Role role,

    @NotBlank(message = "JNV school name is required")
    @Size(max = 150, message = "JNV name must not exceed 150 characters")
    String jnvName
) {}
