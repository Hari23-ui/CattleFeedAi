package com.cattlefeedai.api.dto.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response payload for visual screening ingestion.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisualScreeningResponse {

    private Long testResultId;
    private String sampleType;
    private Long sampleId;
    private String imageReference;
    private String visualStatus; // NORMAL, SUSPICIOUS, ABNORMAL
    private Boolean mouldDetected;
    private Boolean spoilageDetected;
    private Boolean foreignMaterialDetected;
    private BigDecimal confidenceScore;
    private List<String> identifiedVisualRisks;
    private String screeningNotes;
    private LocalDateTime screeningTimestamp;
    private String disclaimer;
}
