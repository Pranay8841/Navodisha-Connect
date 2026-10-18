package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String phoneNumber,
    String fullName,
    String email,
    Role role,
    UserStatus status,
    String jnvName,
    Instant createdAt
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getPhoneNumber(),
            user.getFullName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getJnvName(),
            user.getCreatedAt()
        );
    }
}
