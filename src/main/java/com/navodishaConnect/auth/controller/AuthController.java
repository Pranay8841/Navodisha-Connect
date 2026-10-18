package com.navodishaConnect.auth.controller;

import com.navodishaConnect.auth.dto.SendOtpRequest;
import com.navodishaConnect.auth.dto.SendOtpResponse;
import com.navodishaConnect.auth.dto.VerifyOtpRequest;
import com.navodishaConnect.auth.dto.VerifyOtpResponse;
import com.navodishaConnect.auth.service.OtpService;
import com.navodishaConnect.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing endpoints for phone OTP generation and verification.
 */
@RestController
@RequestMapping("/api/v1/auth/otp")
public class AuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;

    public AuthController(OtpService otpService, UserRepository userRepository) {
        this.otpService = otpService;
        this.userRepository = userRepository;
    }

    @PostMapping("/send")
    public ResponseEntity<SendOtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        long cooldown = otpService.sendOtp(request.phoneNumber());
        return ResponseEntity.ok(new SendOtpResponse(
                "OTP sent successfully to " + request.phoneNumber(),
                cooldown
        ));
    }

    @PostMapping("/verify")
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
}
