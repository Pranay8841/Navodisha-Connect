package com.navodishaConnect.user.repository;

import com.navodishaConnect.user.domain.JnvAdminDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for JnvAdminDetails entity.
 */
@Repository
public interface JnvAdminDetailsRepository extends JpaRepository<JnvAdminDetails, UUID> {
    List<JnvAdminDetails> findByIsAlumniCoordinatorTrue();
}
