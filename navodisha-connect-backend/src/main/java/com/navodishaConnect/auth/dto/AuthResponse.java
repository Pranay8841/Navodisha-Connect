package com.navodishaConnect.auth.dto;

import com.navodishaConnect.user.dto.UserResponse;

/**
 * Standard authentication response containing JWT tokens and sanitized user profile.
 */
public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresInMs,
    UserResponse user
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresInMs, UserResponse user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresInMs, user);
    }
}
