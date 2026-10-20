package com.navodishaConnect.verification.dto;

import java.util.UUID;

/**
 * Request payload for submitting an account verification request.
 * Documents and vouches are completely optional for maximum simplicity.
 */
public record SubmitVerificationRequest(
    String proofFileKey,
    UUID vouchedByUserId,
    String remarks
) {}
