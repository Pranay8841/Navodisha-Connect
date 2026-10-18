package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.UserStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for administrators to update a user's verification or account status.
 */
public record UpdateUserStatusRequest(
    @NotNull(message = "Status is required (ACTIVE, PENDING_VERIFICATION, SUSPENDED)")
    UserStatus status,

    String remarks
) {}
