package com.navodishaConnect.verification.dto;

/**
 * Request payload for submitting an account verification request.
 * Completely frictionless: user simply requests verification with an optional note for the Platform Admin.
 */
public record SubmitVerificationRequest(
    String remarks
) {}
