package com.navodishaConnect.user.controller;

import com.navodishaConnect.user.dto.UpdateAlumniProfileRequest;
import com.navodishaConnect.user.dto.UpdateJnvAdminProfileRequest;
import com.navodishaConnect.user.dto.UpdateStudentProfileRequest;
import com.navodishaConnect.user.dto.UserProfileResponse;
import com.navodishaConnect.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Controller exposing user management and profile endpoints.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final ProfileService profileService;

    public UserController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /**
     * Protected endpoint returning the unified profile of the currently authenticated user,
     * including role-specific profile details.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal UUID userId) {
        validateAuthenticated(userId);
        return ResponseEntity.ok(profileService.getFullProfile(userId));
    }

    /**
     * Updates profile details for an authenticated Student.
     */
    @PutMapping("/profile/student")
    public ResponseEntity<UserProfileResponse> updateStudentProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody UpdateStudentProfileRequest request
    ) {
        validateAuthenticated(userId);
        return ResponseEntity.ok(profileService.updateStudentProfile(userId, request));
    }

    /**
     * Updates profile details for an authenticated Alumnus.
     */
    @PutMapping("/profile/alumnus")
    public ResponseEntity<UserProfileResponse> updateAlumniProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody UpdateAlumniProfileRequest request
    ) {
        validateAuthenticated(userId);
        return ResponseEntity.ok(profileService.updateAlumniProfile(userId, request));
    }

    /**
     * Updates profile details for an authenticated JNV Admin.
     */
    @PutMapping("/profile/jnv-admin")
    public ResponseEntity<UserProfileResponse> updateJnvAdminProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody UpdateJnvAdminProfileRequest request
    ) {
        validateAuthenticated(userId);
        return ResponseEntity.ok(profileService.updateJnvAdminProfile(userId, request));
    }

    private void validateAuthenticated(UUID userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
    }
}

