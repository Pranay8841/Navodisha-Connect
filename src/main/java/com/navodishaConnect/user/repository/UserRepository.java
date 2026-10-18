package com.navodishaConnect.user.repository;

import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for User entity operations.
 * Spring automatically implements query execution based on method name patterns.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByJnvName(String jnvName);

    List<User> findByRole(Role role);
}
