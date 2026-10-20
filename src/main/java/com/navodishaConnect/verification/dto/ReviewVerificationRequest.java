package com.navodishaConnect.verification.dto;

import com.navodishaConnect.verification.domain.VerificationStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for reviewing an account verification request by Platform Admin.
 */
public record ReviewVerificationRequest(
    @NotNull(message = "Review status is required (APPROVED or REJECTED)")
    VerificationStatus status,

    String remarks
) {}
