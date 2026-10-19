package com.navodishaConnect.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateAlumniProfileRequest(
    @NotNull(message = "Joining batch year is required")
    @Min(value = 1980, message = "Joining batch year must be 1980 or later")
    @Max(value = 2035, message = "Joining batch year cannot be in the distant future")
    Integer joinBatchYear,

    @Size(max = 150, message = "Current organization must not exceed 150 characters")
    String currentOrg,

    @Size(max = 100, message = "Designation must not exceed 100 characters")
    String designation,

    @Size(max = 100, message = "Current city must not exceed 100 characters")
    String currentCity,

    @Size(max = 250, message = "Bio must not exceed 250 characters")
    String bio,

    List<String> provideMentorshipsOn,

    List<String> willingModes,

    Boolean openToHelp
) {}
