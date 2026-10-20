package com.navodishaConnect.auth.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing OTP generation, rate-limiting, and verification.
 * Uses a thread-safe in-memory cache for frictionless local development.
 */
@Service
public class OtpService {

    private static final Duration OTP_EXPIRY = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    private final OtpSender otpSender;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public record OtpEntry(String code, Instant expiresAt, Instant resendAllowedAt) {}

    public OtpService(OtpSender otpSender) {
        this.otpSender = otpSender;
    }

    /**
     * Generates and transmits a 6-digit OTP code to the requested phone number.
     * Enforces a 60-second cooldown between requests.
     *
     * @param phoneNumber Destination in E.164 format
     * @return remaining cooldown duration in seconds
     */
    public long sendOtp(String phoneNumber) {
        Instant now = Instant.now();
        OtpEntry existing = otpStore.get(phoneNumber);

        if (existing != null && now.isBefore(existing.resendAllowedAt())) {
            long remainingSeconds = Duration.between(now, existing.resendAllowedAt()).toSeconds() + 1;
            throw new IllegalStateException("Please wait " + remainingSeconds + " seconds before requesting another OTP.");
        }

        // Generate 6-digit random code
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        Instant expiresAt = now.plus(OTP_EXPIRY);
        Instant resendAllowedAt = now.plus(RESEND_COOLDOWN);

        otpStore.put(phoneNumber, new OtpEntry(otp, expiresAt, resendAllowedAt));
        otpSender.send(phoneNumber, otp);

        return RESEND_COOLDOWN.toSeconds();
    }

    /**
     * Verifies the submitted OTP against the store.
     * Consumes (removes) the OTP immediately upon successful verification.
     *
     * @param phoneNumber Phone number being verified
     * @param code The submitted 6-digit OTP
     * @return true if valid and not expired, false otherwise
     */
    public boolean verifyOtp(String phoneNumber, String code) {
        OtpEntry entry = otpStore.get(phoneNumber);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(phoneNumber);
            return false;
        }

        if (entry.code().equals(code)) {
            otpStore.remove(phoneNumber);
            return true;
        }

        return false;
    }
}
