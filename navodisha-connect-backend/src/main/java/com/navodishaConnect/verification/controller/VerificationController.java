package com.navodishaConnect.verification.controller;

import com.navodishaConnect.verification.dto.SubmitVerificationRequest;
import com.navodishaConnect.verification.dto.VerificationResponse;
import com.navodishaConnect.verification.service.VerificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Controller allowing Alumni and JNV Staff to submit and monitor verification requests.
 */
@RestController
@RequestMapping("/api/v1/verifications")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    /**
     * Submits a verification request for the currently authenticated user.
     */
    @PostMapping
    public ResponseEntity<VerificationResponse> submitVerification(
            @AuthenticationPrincipal UUID userId,
            @RequestBody SubmitVerificationRequest request
    ) {
        validateAuthenticated(userId);
        VerificationResponse response = verificationService.submitVerification(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Fetches the latest verification status for the currently authenticated user.
     */
    @GetMapping("/my")
    public ResponseEntity<VerificationResponse> getMyVerification(
            @AuthenticationPrincipal UUID userId
    ) {
        validateAuthenticated(userId);
        VerificationResponse response = verificationService.getMyLatestVerification(userId);
        return ResponseEntity.ok(response);
    }

    private void validateAuthenticated(UUID userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
    }
}
