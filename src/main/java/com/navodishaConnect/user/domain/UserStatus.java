package com.navodishaConnect.user.domain;

/**
 * Lifecycle states for user accounts.
 * - ACTIVE: Standard operational account (students start here immediately).
 * - PENDING_VERIFICATION: Alumni accounts awaiting admin document review.
 * - SUSPENDED: Temporarily or permanently disabled by moderation.
 */
public enum UserStatus {
    ACTIVE,
    PENDING_VERIFICATION,
    SUSPENDED
}
