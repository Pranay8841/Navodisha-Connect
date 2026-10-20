package com.navodishaConnect.verification.service;

import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;
import com.navodishaConnect.user.repository.UserRepository;
import com.navodishaConnect.verification.domain.VerificationRequest;
import com.navodishaConnect.verification.domain.VerificationStatus;
import com.navodishaConnect.verification.dto.ReviewVerificationRequest;
import com.navodishaConnect.verification.dto.SubmitVerificationRequest;
import com.navodishaConnect.verification.dto.VerificationResponse;
import com.navodishaConnect.verification.repository.VerificationRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Service managing verification lifecycle for Alumni and JNV Admins.
 */
@Service
public class VerificationService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;

    public VerificationService(
            VerificationRequestRepository verificationRequestRepository,
            UserRepository userRepository
    ) {
        this.verificationRequestRepository = verificationRequestRepository;
        this.userRepository = userRepository;
    }

    /**
     * Submits a new verification request for an authenticated Alumnus or JNV Admin.
     */
    @Transactional
    public VerificationResponse submitVerification(UUID userId, SubmitVerificationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Students do not require platform verification.");
        }

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account is already verified and active.");
        }

        if (verificationRequestRepository.existsByUserIdAndStatus(userId, VerificationStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A verification request is already pending review.");
        }

        VerificationRequest verificationRequest = new VerificationRequest(
                user,
                request.remarks()
        );

        VerificationRequest saved = verificationRequestRepository.save(verificationRequest);
        return VerificationResponse.fromEntity(saved);
    }

    /**
     * Fetches the latest verification status for the current user.
     */
    @Transactional(readOnly = true)
    public VerificationResponse getMyLatestVerification(UUID userId) {
        return verificationRequestRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(VerificationResponse::fromEntity)
                .orElse(null);
    }

    /**
     * Lists all pending verification requests for Platform Admin review.
     */
    @Transactional(readOnly = true)
    public List<VerificationResponse> getPendingVerifications() {
        return verificationRequestRepository.findByStatusOrderByCreatedAtDesc(VerificationStatus.PENDING)
                .stream()
                .map(VerificationResponse::fromEntity)
                .toList();
    }

    /**
     * Platform Admin reviews an applicant.
     * Approving immediately sets user.status = ACTIVE in the same transaction.
     */
    @Transactional
    public VerificationResponse reviewVerification(UUID adminId, UUID requestId, ReviewVerificationRequest request) {
        VerificationRequest verificationRequest = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification request not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found"));

        verificationRequest.setStatus(request.status());
        verificationRequest.setReviewedBy(admin);
        if (request.remarks() != null && !request.remarks().isBlank()) {
            verificationRequest.setRemarks(request.remarks());
        }

        if (request.status() == VerificationStatus.APPROVED) {
            User applicant = verificationRequest.getUser();
            applicant.setStatus(UserStatus.ACTIVE);
            userRepository.save(applicant);
        }

        VerificationRequest saved = verificationRequestRepository.save(verificationRequest);
        return VerificationResponse.fromEntity(saved);
    }
}
