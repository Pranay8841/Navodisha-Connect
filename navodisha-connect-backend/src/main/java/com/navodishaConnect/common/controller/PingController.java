package com.navodishaConnect.common.controller;

import com.navodishaConnect.common.dto.PingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/ping")
public class PingController {

    private final String welcomeMessage;
    private final String activeProfile;
    private final JdbcTemplate jdbcTemplate;

    // Constructor injection: Spring wires welcomeMessage, activeProfile, and the JdbcTemplate bean automatically
    public PingController(
            @Value("${app.welcome-message}") String welcomeMessage,
            @Value("${spring.profiles.active:local}") String activeProfile,
            JdbcTemplate jdbcTemplate
    ) {
        this.welcomeMessage = welcomeMessage;
        this.activeProfile = activeProfile;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<PingResponse> ping() {
        // Query live database metadata via JdbcTemplate
        String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);

        PingResponse response = new PingResponse(
                "UP",
                welcomeMessage,
                activeProfile,
                "Connected to PostgreSQL (" + dbName + ")",
                Instant.now()
        );
        return ResponseEntity.ok(response);
    }
}
