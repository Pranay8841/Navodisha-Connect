package com.navodishaConnect.verification.repository;

import com.navodishaConnect.verification.domain.VerificationRequest;
import com.navodishaConnect.verification.domain.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for VerificationRequest entity.
 */
@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, UUID> {

    List<VerificationRequest> findByStatusOrderByCreatedAtDesc(VerificationStatus status);

    List<VerificationRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<VerificationRequest> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByUserIdAndStatus(UUID userId, VerificationStatus status);
}
