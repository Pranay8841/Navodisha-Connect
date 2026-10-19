package com.navodishaConnect.user.repository;

import com.navodishaConnect.user.domain.ClassLevel;
import com.navodishaConnect.user.domain.House;
import com.navodishaConnect.user.domain.StudentDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for StudentDetails entity.
 */
@Repository
public interface StudentDetailsRepository extends JpaRepository<StudentDetails, UUID> {
    List<StudentDetails> findByClassLevel(ClassLevel classLevel);
    List<StudentDetails> findByHouse(House house);
    List<StudentDetails> findByJoinBatchYear(Integer joinBatchYear);
}
