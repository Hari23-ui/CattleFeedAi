package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.enums.SilageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Request payload for creating or updating a SilageSample.
 * Does NOT accept owner/user ID - owner is always verified through JWT.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SilageSampleRequest {

    @NotNull(message = "farmId is required")
    private Long farmId;

    private Long animalId;

    @NotBlank(message = "sampleCode is required")
    @Size(max = 50, message = "sampleCode must not exceed 50 characters")
    private String sampleCode;

    @NotNull(message = "silageType is required")
    private SilageType silageType;

    @NotNull(message = "sampleDate is required")
    private LocalDate sampleDate;

    @Size(max = 255, message = "source must not exceed 255 characters")
    private String source;

    private String notes;
}
