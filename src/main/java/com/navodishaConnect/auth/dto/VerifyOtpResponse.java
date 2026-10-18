package com.navodishaConnect.auth.dto;

public record VerifyOtpResponse(
    boolean verified,
    boolean userExists,
    String message
) {}
