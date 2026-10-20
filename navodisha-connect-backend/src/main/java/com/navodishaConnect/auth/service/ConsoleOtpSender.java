package com.navodishaConnect.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Local development OTP sender.
 * Logs OTP codes to the console so developers test completely free without SMS charges or third-party dependencies.
 */
@Component
public class ConsoleOtpSender implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(ConsoleOtpSender.class);

    @Override
    public void send(String phoneNumber, String otp) {
        log.info("""
                \n================================================================
                [DEV OTP SENDER] Destination: {} | OTP: {} (Expires in 5 min)
                ================================================================
                """, phoneNumber, otp);
    }
}
