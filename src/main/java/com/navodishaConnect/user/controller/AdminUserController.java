package com.navodishaConnect.user.controller;

import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;
import com.navodishaConnect.user.dto.UpdateUserStatusRequest;
import com.navodishaConnect.user.dto.UserResponse;
import com.navodishaConnect.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Controller exposing administrative endpoints protected by Spring Method Security (@PreAuthorize).
 * Only authorized administrators can access these endpoints.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lists all users pending verification (Alumni, JNV Admins).
     * Restricted strictly to PLATFORM_ADMIN.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<List<UserResponse>> getPendingUsers() {
        List<User> pendingUsers = userRepository.findByStatus(UserStatus.PENDING_VERIFICATION);
        List<UserResponse> responses = pendingUsers.stream()
                .map(UserResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * Updates an account's verification or standing status (e.g. approving PENDING to ACTIVE, or SUSPENDED).
     * Restricted strictly to PLATFORM_ADMIN.
     */
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Transactional
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setStatus(request.status());
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(UserResponse.fromEntity(savedUser));
    }
}
