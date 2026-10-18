package com.navodishaConnect.auth.controller;

import com.navodishaConnect.auth.dto.RegisterRequest;
import com.navodishaConnect.auth.dto.SendOtpRequest;
import com.navodishaConnect.auth.dto.SendOtpResponse;
import com.navodishaConnect.auth.dto.VerifyOtpRequest;
import com.navodishaConnect.auth.dto.VerifyOtpResponse;
import com.navodishaConnect.auth.service.OtpService;
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

/**
 * Controller exposing endpoints for phone OTP auth and user registration.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final UserService userService;

    public AuthController(OtpService otpService, UserRepository userRepository, UserService userService) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.userService = userService;
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
            return ResponseEntity.badRequest().body(new VerifyOtpResponse(
                    false,
                    false,
                    "Invalid or expired OTP code."
            ));
        }

        boolean exists = userRepository.existsByPhoneNumber(request.phoneNumber());
        String message = exists
                ? "Verification successful. Welcome back!"
                : "Verification successful. Please proceed to complete profile registration.";

        return ResponseEntity.ok(new VerifyOtpResponse(true, exists, message));
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
