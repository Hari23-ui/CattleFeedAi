package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.enums.FeedIntakeStatus;
import com.cattlefeedai.api.entity.enums.Gender;
import com.cattlefeedai.api.entity.enums.LactationStage;
import com.cattlefeedai.api.entity.enums.PregnancyStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for creating or updating an Animal.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalRequest {

    @NotNull(message = "farmId is required")
    private Long farmId;

    @NotBlank(message = "animalTag is required")
    @Size(max = 50, message = "animalTag must not exceed 50 characters")
    private String animalTag;

    @Size(max = 100, message = "name must not exceed 100 characters")
    private String name;

    @Size(max = 100, message = "breed must not exceed 100 characters")
    private String breed;

    @NotNull(message = "gender is required")
    private Gender gender;

    private LocalDate dateOfBirth;

    @DecimalMin(value = "0.0", inclusive = true, message = "weight cannot be negative")
    private BigDecimal weight;

    private LactationStage lactationStage;

    @Min(value = 0, message = "daysInMilk cannot be negative")
    private Integer daysInMilk;

    @DecimalMin(value = "0.0", inclusive = true, message = "milkProductionPerDay cannot be negative")
    private BigDecimal milkProductionPerDay;

    private PregnancyStatus pregnancyStatus;

    private FeedIntakeStatus feedIntakeStatus;
}
