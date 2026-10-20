package com.navodishaConnect.auth.dto;

public record SendOtpResponse(
    String message,
    long cooldownSeconds
) {}
