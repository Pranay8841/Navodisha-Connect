package com.navodishaConnect.user.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;

/**
 * Academic streams for senior secondary JNV students (Classes 11 & 12).
 */
public enum Stream {
    SCIENCE_PCM("Science (PCM)"),
    SCIENCE_PCB("Science (PCB)"),
    SCIENCE_PCMB("Science (PCMB)"),
    COMMERCE("Commerce"),
    ARTS("Arts");

    private final String value;

    Stream(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Stream fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Arrays.stream(values())
                .filter(s -> s.value.equalsIgnoreCase(value.trim()) || s.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown academic stream: " + value + ". Expected: Science (PCM), Science (PCB), Science (PCMB), Commerce, Arts"));
    }

    @Converter(autoApply = true)
    public static class StreamConverter implements AttributeConverter<Stream, String> {
        @Override
        public String convertToDatabaseColumn(Stream attribute) {
            return attribute == null ? null : attribute.getValue();
        }

        @Override
        public Stream convertToEntityAttribute(String dbData) {
            return dbData == null ? null : Stream.fromValue(dbData);
        }
    }
}
