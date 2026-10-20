package com.navodishaConnect.user.service;

import com.navodishaConnect.auth.dto.RegisterRequest;
import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
     * Registers a new platform user in PostgreSQL using verified phone number from signup token.
     * Enforces unique phone constraints and sets initial status:
     * - STUDENT -> ACTIVE
     * - ALUMNUS, JNV_ADMIN -> PENDING_VERIFICATION (requires Platform Admin review)
     */
    @Transactional
    public User register(String phoneNumber, RegisterRequest request) {
        if (request.role() == Role.PLATFORM_ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Self-registration as PLATFORM_ADMIN is not permitted."
            );
        }

        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new IllegalArgumentException("User with phone number " + phoneNumber + " already exists.");
        }

        User user = new User(
            phoneNumber,
            request.fullName(),
            request.role(),
            request.jnvName()
        );

        return userRepository.save(user);
    }
}
