package com.cattlefeedai.api.dto.analytics;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricalTestPointDto {

    private Long testResultId;
    private LocalDate testDate;
    private String sampleType; // "FEED" or "SILAGE"
    private String sampleCode;
    private String analysisSource;

    // Measured parameters (preserve nulls, do NOT default to 0)
    private BigDecimal moisture;
    private BigDecimal crudeProtein;
    private BigDecimal fiber;
    private BigDecimal energyValue;
    private BigDecimal aflatoxin;
    private BigDecimal mycotoxin;
    private BigDecimal ph;
    private String mineralStatus;
    private String adulteration;
    private Boolean mouldDetected;
    private Boolean spoilageDetected;

    // Quality and Risk assessments from existing rule engine
    private String qualityStatus; // GOOD, ACCEPTABLE, NEEDS_ATTENTION, UNSAFE, INSUFFICIENT_DATA
    private String riskLevel;     // LOW, MEDIUM, HIGH
    private BigDecimal confidenceScore;
    private Integer triggeredRulesCount;
}
