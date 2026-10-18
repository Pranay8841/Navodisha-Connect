package com.navodishaConnect.auth.service;

/**
 * Pluggable contract for OTP transmission.
 * Allows seamless switching between console logging (dev) and SMS gateways (Firebase, Twilio, AWS SNS) in prod.
 */
public interface OtpSender {
    void send(String phoneNumber, String otp);
}
