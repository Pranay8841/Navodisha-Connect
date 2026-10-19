package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Unified response model containing core user identity plus their role-specific profile details.
 */
public record UserProfileResponse(
    UUID id,
    String phoneNumber,
    String fullName,
    String email,
    Role role,
    UserStatus status,
    String jnvName,
    StudentDetailsResponse studentDetails,
    AlumniDetailsResponse alumniDetails,
    JnvAdminDetailsResponse jnvAdminDetails,
    Instant createdAt
) {
    public static UserProfileResponse of(
        User user,
        StudentDetailsResponse studentDetails,
        AlumniDetailsResponse alumniDetails,
        JnvAdminDetailsResponse jnvAdminDetails
    ) {
        return new UserProfileResponse(
            user.getId(),
            user.getPhoneNumber(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getJnvName(),
            studentDetails,
            alumniDetails,
            jnvAdminDetails,
            user.getCreatedAt()
        );
    }
}
