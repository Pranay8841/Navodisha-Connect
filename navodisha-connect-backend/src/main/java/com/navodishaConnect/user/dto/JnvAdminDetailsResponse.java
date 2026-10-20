package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.JnvAdminDetails;

import java.time.Instant;

public record JnvAdminDetailsResponse(
    String designation,
    Boolean isAlumniCoordinator,
    Instant updatedAt
) {
    public static JnvAdminDetailsResponse fromEntity(JnvAdminDetails entity) {
        if (entity == null) return null;
        return new JnvAdminDetailsResponse(
            entity.getDesignation(),
            entity.getIsAlumniCoordinator(),
            entity.getUpdatedAt()
        );
    }
}
