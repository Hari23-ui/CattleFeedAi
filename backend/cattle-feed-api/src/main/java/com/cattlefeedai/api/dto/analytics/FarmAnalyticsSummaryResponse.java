package com.cattlefeedai.api.dto.analytics;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmAnalyticsSummaryResponse {

    private long totalAnimals;
    private long totalFeedSamples;
    private long totalSilageSamples;
    private long totalTestResults;
    private long totalActiveAdvisories;
    private long totalConsultations;

    // Quality Status breakdown (GOOD, ACCEPTABLE, NEEDS_ATTENTION, UNSAFE, INSUFFICIENT_DATA)
    private Map<String, Long> qualityStatusDistribution;

    // Risk Level breakdown (LOW, MEDIUM, HIGH)
    private Map<String, Long> riskDistribution;

    // Risk category indicator counts
    private long contaminationRiskCount;
    private long nutritionalRiskCount;
    private long storageRiskCount;

    // Applied date filter (e.g. 7, 30, 90, or null for all time)
    private Integer daysFilter;

    // Scientific safety disclaimer
    private String disclaimer;
}
