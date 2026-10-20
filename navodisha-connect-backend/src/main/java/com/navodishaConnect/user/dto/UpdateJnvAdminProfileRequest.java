package com.navodishaConnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateJnvAdminProfileRequest(
    @NotBlank(message = "Designation is required")
    @Size(max = 100, message = "Designation must not exceed 100 characters")
    String designation,

    Boolean isAlumniCoordinator
) {}
