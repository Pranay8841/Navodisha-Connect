package com.navodishaConnect.user.repository;

import com.navodishaConnect.user.domain.AlumniDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for AlumniDetails entity.
 */
@Repository
public interface AlumniDetailsRepository extends JpaRepository<AlumniDetails, UUID> {
    List<AlumniDetails> findByOpenToHelpTrue();
    List<AlumniDetails> findByJoinBatchYear(Integer joinBatchYear);
    List<AlumniDetails> findByCurrentCityIgnoreCase(String currentCity);
}
