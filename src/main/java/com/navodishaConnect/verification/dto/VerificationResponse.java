package com.navodishaConnect.verification.dto;

import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.verification.domain.VerificationRequest;
import com.navodishaConnect.verification.domain.VerificationStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard response representation of an account verification request.
 */
public record VerificationResponse(
    UUID id,
    UUID userId,
    String applicantName,
    String applicantPhone,
    String applicantJnvName,
    Role applicantRole,
    VerificationStatus status,
    String remarks,
    UUID reviewedBy,
    Instant createdAt,
    Instant updatedAt
) {
    public static VerificationResponse fromEntity(VerificationRequest entity) {
        return new VerificationResponse(
            entity.getId(),
            entity.getUser().getId(),
            entity.getUser().getFullName(),
            entity.getUser().getPhoneNumber(),
            entity.getUser().getJnvName(),
            entity.getUser().getRole(),
            entity.getStatus(),
            entity.getRemarks(),
            entity.getReviewedBy() != null ? entity.getReviewedBy().getId() : null,
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
