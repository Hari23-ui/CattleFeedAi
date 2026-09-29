package com.cattlefeedai.api.dto.assessment;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Payload for receiving visual screening results from external webcam / Computer Vision service.
 *
 * NOTE: Computer Vision is VISUAL SCREENING ONLY.
 * Normal webcams cannot measure chemical parameters (protein, moisture, aflatoxin, etc.).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisualScreeningRequest {

    private Long feedSampleId;

    private Long silageSampleId;

    @NotBlank(message = "imageReference is required")
    private String imageReference;

    private List<String> visualQualityIndicators;

    private Boolean mouldIndication;

    private Boolean spoilageIndication;

    private Boolean visibleForeignMaterialIndication;

    @DecimalMin(value = "0.0", inclusive = true, message = "confidenceScore must be >= 0.0")
    @DecimalMax(value = "1.0", inclusive = true, message = "confidenceScore must be <= 1.0")
    private BigDecimal confidenceScore;

    private LocalDateTime analysisTimestamp;

    private String notes;
}
