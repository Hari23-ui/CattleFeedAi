package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.enums.AnalysisSource;
import com.cattlefeedai.api.entity.enums.OverallQuality;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Safe response payload for a TestResult.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResultResponse {

    private Long id;
    private Long feedSampleId;
    private Long silageSampleId;
    private LocalDate testDate;
    private BigDecimal moisture;
    private BigDecimal crudeProtein;
    private BigDecimal fiber;
    private BigDecimal energyValue;
    private String mineralStatus;
    private BigDecimal aflatoxin;
    private BigDecimal mycotoxin;
    private BigDecimal ph;
    private String adulteration;
    private Boolean mouldDetected;
    private Boolean spoilageDetected;
    private OverallQuality overallQuality;
    private BigDecimal confidenceScore;
    private AnalysisSource analysisSource;
    private LocalDateTime createdAt;

    public static TestResultResponse fromEntity(TestResult entity) {
        if (entity == null) {
            return null;
        }
        return TestResultResponse.builder()
                .id(entity.getId())
                .feedSampleId(entity.getFeedSample() != null ? entity.getFeedSample().getId() : null)
                .silageSampleId(entity.getSilageSample() != null ? entity.getSilageSample().getId() : null)
                .testDate(entity.getTestDate())
                .moisture(entity.getMoisture())
                .crudeProtein(entity.getCrudeProtein())
                .fiber(entity.getFiber())
                .energyValue(entity.getEnergyValue())
                .mineralStatus(entity.getMineralStatus())
                .aflatoxin(entity.getAflatoxin())
                .mycotoxin(entity.getMycotoxin())
                .ph(entity.getPh())
                .adulteration(entity.getAdulteration())
                .mouldDetected(entity.getMouldDetected())
                .spoilageDetected(entity.getSpoilageDetected())
                .overallQuality(entity.getOverallQuality())
                .confidenceScore(entity.getConfidenceScore())
                .analysisSource(entity.getAnalysisSource())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
