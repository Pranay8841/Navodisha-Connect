package com.navodishaConnect.auth.dto;

/**
 * Response payload for OTP verification.
 * If userExists is true, auth contains access & refresh tokens for instant login.
 * If userExists is false, signupToken provides cryptographic proof of phone verification to proceed with registration.
 */
public record VerifyOtpResponse(
    boolean verified,
    boolean userExists,
    String message,
    String signupToken,
    AuthResponse auth
) {
    public static VerifyOtpResponse failed(String message) {
        return new VerifyOtpResponse(false, false, message, null, null);
    }

    public static VerifyOtpResponse newUser(String message, String signupToken) {
        return new VerifyOtpResponse(true, false, message, signupToken, null);
    }

    public static VerifyOtpResponse existingUser(String message, AuthResponse auth) {
        return new VerifyOtpResponse(true, true, message, null, auth);
    }
}
