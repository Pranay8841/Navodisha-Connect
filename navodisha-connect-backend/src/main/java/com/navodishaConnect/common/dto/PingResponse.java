package com.navodishaConnect.common.dto;

import java.time.Instant;

/**
 * Enhanced PingResponse including database connectivity verification.
 */
public record PingResponse(
        String status,
        String message,
        String environment,
        String database,
        Instant timestamp
) {}
