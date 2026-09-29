package com.cattlefeedai.api.dto;

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
 * Request payload for creating or updating a FeedPlan.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedPlanRequest {

    @NotBlank(message = "Plan name is required")
    @Size(max = 200, message = "Plan name must not exceed 200 characters")
    private String planName;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    @NotNull(message = "Animal ID is required")
    private Long animalId;

    private Long feedSampleId;

    private Long silageSampleId;

    private Double plannedQuantity;

    private String frequency;

    private String notes;
}
