package com.navodishaConnect.user.service;

import com.navodishaConnect.auth.dto.RegisterRequest;
import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;
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
    public User register(RegisterRequest request) {
        if (request.role() == Role.PLATFORM_ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Self-registration as PLATFORM_ADMIN is not permitted."
            );
        }

        if (userRepository.existsByPhoneNumber(request.phoneNumber())) {
            throw new IllegalArgumentException("User with phone number " + request.phoneNumber() + " already exists.");
        }

        User user = new User(
            request.phoneNumber(),
            request.fullName(),
            request.role(),
            request.jnvName()
        );

        return userRepository.save(user);
    }
}
