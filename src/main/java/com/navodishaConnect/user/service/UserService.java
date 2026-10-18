package com.navodishaConnect.user.service;

import com.navodishaConnect.auth.dto.RegisterRequest;
import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;
import com.navodishaConnect.user.dto.UserResponse;
import com.navodishaConnect.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user lifecycle, registration, and profile queries.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Registers a new platform user in PostgreSQL using phone-first onboarding.
     * Enforces unique phone constraints and sets initial status:
     * - STUDENT -> ACTIVE
     * - ALUMNUS, JNV_ADMIN -> PENDING_VERIFICATION (requires Platform Admin review)
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByPhoneNumber(request.phoneNumber())) {
            throw new IllegalArgumentException("User with phone number " + request.phoneNumber() + " already exists.");
        }

        User user = new User(
            request.phoneNumber(),
            request.fullName(),
            request.role(),
            request.jnvName()
        );

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }
}
