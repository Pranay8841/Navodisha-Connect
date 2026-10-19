package com.navodishaConnect.auth.controller;

import com.navodishaConnect.auth.dto.AuthResponse;
import com.navodishaConnect.auth.dto.RegisterRequest;
import com.navodishaConnect.auth.dto.SendOtpRequest;
import com.navodishaConnect.auth.dto.SendOtpResponse;
import com.navodishaConnect.auth.dto.VerifyOtpRequest;
import com.navodishaConnect.auth.dto.VerifyOtpResponse;
import com.navodishaConnect.auth.service.JwtService;
import com.navodishaConnect.auth.service.OtpService;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.domain.UserStatus;
import com.navodishaConnect.auth.dto.RefreshTokenRequest;
import com.navodishaConnect.user.dto.UserResponse;
import com.navodishaConnect.user.repository.UserRepository;
import com.navodishaConnect.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Controller exposing endpoints for phone OTP authentication, JWT token issuance, and registration.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(
            OtpService otpService,
            UserRepository userRepository,
            UserService userService,
            JwtService jwtService
    ) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/otp/send")
    public ResponseEntity<SendOtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        long cooldown = otpService.sendOtp(request.phoneNumber());
        return ResponseEntity.ok(new SendOtpResponse(
                "OTP sent successfully to " + request.phoneNumber(),
                cooldown
        ));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean isValid = otpService.verifyOtp(request.phoneNumber(), request.otp());
        if (!isValid) {
            return ResponseEntity.badRequest().body(VerifyOtpResponse.failed("Invalid or expired OTP code."));
        }

        Optional<User> userOptional = userRepository.findByPhoneNumber(request.phoneNumber());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);
            AuthResponse auth = AuthResponse.of(
                    accessToken,
                    refreshToken,
                    jwtService.getAccessTokenExpirationMs(),
                    UserResponse.fromEntity(user)
            );
            return ResponseEntity.ok(VerifyOtpResponse.existingUser("Verification successful. Welcome back!", auth));
        }

        return ResponseEntity.ok(VerifyOtpResponse.newUser("Verification successful. Please proceed to complete profile registration."));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        AuthResponse auth = AuthResponse.of(
                accessToken,
                refreshToken,
                jwtService.getAccessTokenExpirationMs(),
                UserResponse.fromEntity(user)
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(auth);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        if (!jwtService.validateRefreshToken(request.refreshToken())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"
            );
        }

        java.util.UUID userId = jwtService.extractUserId(request.refreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User account not found"
                ));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Account is suspended. Please contact platform support."
            );
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        AuthResponse auth = AuthResponse.of(
                newAccessToken,
                newRefreshToken,
                jwtService.getAccessTokenExpirationMs(),
                UserResponse.fromEntity(user)
        );

        return ResponseEntity.ok(auth);
    }
}
