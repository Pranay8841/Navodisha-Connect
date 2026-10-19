package com.navodishaConnect.user.dto;

import com.navodishaConnect.user.domain.ClassLevel;
import com.navodishaConnect.user.domain.House;
import com.navodishaConnect.user.domain.Stream;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateStudentProfileRequest(
    @NotNull(message = "Joining batch year is required")
    @Min(value = 1986, message = "Joining batch year must be 1986 or later")
    @Max(value = 2035, message = "Joining batch year cannot be in the distant future")
    Integer joinBatchYear,

    @NotNull(message = "Class level is required (Class 10, Class 11, Class 12)")
    ClassLevel classLevel,

    Stream stream,

    House house,

    List<String> preparingFor
) {}
