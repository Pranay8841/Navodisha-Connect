package com.navodishaConnect.auth.dto;

/**
 * Response payload for OTP verification.
 * If userExists is true, auth contains access & refresh tokens for instant login.
 * If userExists is false, auth is null and client routes to registration.
 */
public record VerifyOtpResponse(
    boolean verified,
    boolean userExists,
    String message,
    AuthResponse auth
) {
    public static VerifyOtpResponse failed(String message) {
        return new VerifyOtpResponse(false, false, message, null);
    }

    public static VerifyOtpResponse newUser(String message) {
        return new VerifyOtpResponse(true, false, message, null);
    }

    public static VerifyOtpResponse existingUser(String message, AuthResponse auth) {
        return new VerifyOtpResponse(true, true, message, auth);
    }
}
