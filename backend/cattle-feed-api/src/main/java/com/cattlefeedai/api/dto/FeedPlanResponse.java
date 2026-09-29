package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for FeedPlan, incorporating related animal, feed/silage,
 * latest quality assessment, risk indicators, and recent advisories.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedPlanResponse {

    private Long id;
    private String planName;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Double plannedQuantity;
    private String frequency;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Related Animal Context
    private AnimalSummaryDto animal;

    // Related Feed Sample Context
    private FeedSampleSummaryDto feedSample;

    // Related Silage Sample Context
    private SilageSampleSummaryDto silageSample;

    // Existing Test Result & Assessment Context
    private TestResultSummaryDto latestTestResult;
    private String qualityStatus; // "SAFE", "CAUTION", "UNSAFE", or "Not Available"
    private String riskLevel;     // "LOW", "MEDIUM", "HIGH", or "Not Available"
    private List<RiskIndicatorDto> riskIndicators;

    // Advisory Context
    private List<AdvisorySummaryDto> recentAdvisories;

    // Scientific Disclaimer
    private String disclaimer;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnimalSummaryDto {
        private Long id;
        private String animalTag;
        private String name;
        private String breed;
        private String category;
        private Long farmId;
        private String farmName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeedSampleSummaryDto {
        private Long id;
        private String sampleCode;
        private String feedType;
        private LocalDate sampleDate;
        private String source;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SilageSampleSummaryDto {
        private Long id;
        private String sampleCode;
        private String silageType;
        private LocalDate sampleDate;
        private String source;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestResultSummaryDto {
        private Long id;
        private LocalDate testDate;
        private String laboratory;
        private Double moisture;
        private Double crudeProtein;
        private Double acidDetergentFiber;
        private Double neutralDetergentFiber;
        private Double ph;
        private String notes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdvisorySummaryDto {
        private Long id;
        private String category;
        private String priority;
        private String title;
        private String message;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }
}
