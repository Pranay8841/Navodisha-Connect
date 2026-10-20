package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.ClassLevel;
import com.navodishaConnect.user.domain.House;
import com.navodishaConnect.user.domain.Stream;
import com.navodishaConnect.user.domain.StudentDetails;

import java.time.Instant;
import java.util.List;

public record StudentDetailsResponse(
    Integer joinBatchYear,
    ClassLevel classLevel,
    Stream stream,
    House house,
    List<String> preparingFor,
    Instant updatedAt
) {
    public static StudentDetailsResponse fromEntity(StudentDetails entity) {
        if (entity == null) return null;
        return new StudentDetailsResponse(
            entity.getJoinBatchYear(),
            entity.getClassLevel(),
            entity.getStream(),
            entity.getHouse(),
            entity.getPreparingFor(),
            entity.getUpdatedAt()
        );
    }
}
