package com.navodishaConnect.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for refreshing an expired access token using a valid refresh token.
 */
public record RefreshTokenRequest(
    @NotBlank(message = "Refresh token is required")
    String refreshToken
) {}
