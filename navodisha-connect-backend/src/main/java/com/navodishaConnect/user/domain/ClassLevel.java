package com.navodishaConnect.user.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;

/**
 * Supported academic classes for students in the mentorship program.
 */
public enum ClassLevel {
    CLASS_10("Class 10"),
    CLASS_11("Class 11"),
    CLASS_12("Class 12");

    private final String value;

    ClassLevel(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ClassLevel fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Arrays.stream(values())
                .filter(c -> c.value.equalsIgnoreCase(value.trim()) || c.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown class level: " + value + ". Expected: Class 10, Class 11, Class 12"));
    }

    @Converter(autoApply = true)
    public static class ClassLevelConverter implements AttributeConverter<ClassLevel, String> {
        @Override
        public String convertToDatabaseColumn(ClassLevel attribute) {
            return attribute == null ? null : attribute.getValue();
        }

        @Override
        public ClassLevel convertToEntityAttribute(String dbData) {
            return dbData == null ? null : ClassLevel.fromValue(dbData);
        }
    }
}
