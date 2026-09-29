package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.enums.AnalysisSource;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for creating a TestResult.
 * Nullable measurements remain nullable as different tests provide different parameters.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResultRequest {

    private Long feedSampleId;

    private Long silageSampleId;

    private LocalDate testDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "moisture cannot be negative")
    private BigDecimal moisture;

    @DecimalMin(value = "0.0", inclusive = true, message = "crudeProtein cannot be negative")
    private BigDecimal crudeProtein;

    @DecimalMin(value = "0.0", inclusive = true, message = "fiber cannot be negative")
    private BigDecimal fiber;

    @DecimalMin(value = "0.0", inclusive = true, message = "energyValue cannot be negative")
    private BigDecimal energyValue;

    private String mineralStatus;

    @DecimalMin(value = "0.0", inclusive = true, message = "aflatoxin cannot be negative")
    private BigDecimal aflatoxin;

    @DecimalMin(value = "0.0", inclusive = true, message = "mycotoxin cannot be negative")
    private BigDecimal mycotoxin;

    @DecimalMin(value = "0.0", inclusive = true, message = "ph cannot be negative")
    private BigDecimal ph;

    private String adulteration;

    private Boolean mouldDetected;

    private Boolean spoilageDetected;

    @DecimalMin(value = "0.0", inclusive = true, message = "confidenceScore cannot be negative")
    private BigDecimal confidenceScore;

    private AnalysisSource analysisSource;
}
