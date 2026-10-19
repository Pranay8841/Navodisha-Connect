package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.AlumniDetails;

import java.time.Instant;
import java.util.List;

public record AlumniDetailsResponse(
    Integer joinBatchYear,
    String currentOrg,
    String designation,
    String currentCity,
    String bio,
    List<String> provideMentorshipsOn,
    List<String> willingModes,
    Boolean openToHelp,
    Instant updatedAt
) {
    public static AlumniDetailsResponse fromEntity(AlumniDetails entity) {
        if (entity == null) return null;
        return new AlumniDetailsResponse(
            entity.getJoinBatchYear(),
            entity.getCurrentOrg(),
            entity.getDesignation(),
            entity.getCurrentCity(),
            entity.getBio(),
            entity.getProvideMentorshipsOn(),
            entity.getWillingModes(),
            entity.getOpenToHelp(),
            entity.getUpdatedAt()
        );
    }
}
