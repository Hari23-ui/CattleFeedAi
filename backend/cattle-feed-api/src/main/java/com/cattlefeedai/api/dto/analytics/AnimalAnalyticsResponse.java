package com.cattlefeedai.api.dto.analytics;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalAnalyticsResponse {

    private Long animalId;
    private String animalTag;
    private String name;
    private String breed;
    private String gender;
    private BigDecimal weight;
    private String lactationStage;
    private BigDecimal milkProductionPerDay;
    private Long farmId;
    private String farmName;

    private long totalFeedTests;
    private long totalSilageTests;
    private long totalTestResults;
    private long totalActiveAdvisories;
    private long totalConsultations;

    private Integer daysFilter;

    // Latest test measurements (null if no test results exist)
    private HistoricalTestPointDto latestMeasurements;

    // Full chronological history of test points
    private List<HistoricalTestPointDto> testHistory;

    // Quality & Risk distributions
    private Map<String, Long> qualityStatusDistribution;
    private Map<String, Long> riskDistribution;

    // Active advisories & health risk indicators
    private List<String> activeAdvisoryTitles;
    private List<String> healthRiskSummary;

    private String descriptiveSummary;
    private String disclaimer;
}
