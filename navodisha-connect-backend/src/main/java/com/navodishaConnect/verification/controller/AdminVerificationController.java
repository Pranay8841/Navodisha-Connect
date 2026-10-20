package com.navodishaConnect.verification.controller;

import com.navodishaConnect.verification.dto.ReviewVerificationRequest;
import com.navodishaConnect.verification.dto.VerificationResponse;
import com.navodishaConnect.verification.service.VerificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
 * Controller exposing administrative verification review endpoints.
 * Strictly restricted to PLATFORM_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/admin/verifications")
public class AdminVerificationController {

    private final VerificationService verificationService;

    public AdminVerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    /**
     * Lists all verification requests awaiting review.
     * Restricted strictly to PLATFORM_ADMIN.
     */
    @GetMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<List<VerificationResponse>> getPendingVerifications() {
        List<VerificationResponse> pending = verificationService.getPendingVerifications();
        return ResponseEntity.ok(pending);
    }

    /**
     * Reviews and approves or rejects a verification request.
     * Approving automatically sets user.status = ACTIVE.
     * Restricted strictly to PLATFORM_ADMIN.
     */
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<VerificationResponse> reviewVerification(
            @AuthenticationPrincipal UUID adminId,
            @PathVariable UUID id,
            @Valid @RequestBody ReviewVerificationRequest request
    ) {
        if (adminId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin not authenticated");
        }

        VerificationResponse response = verificationService.reviewVerification(adminId, id, request);
        return ResponseEntity.ok(response);
    }
}
