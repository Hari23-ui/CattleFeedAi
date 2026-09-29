package com.cattlefeedai.api.dto.consultation;

import com.cattlefeedai.api.entity.enums.ConsultationStatus;
import com.cattlefeedai.api.entity.enums.Specialization;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationResponse {

    private Long id;
    private String subject;
    private String question;
    private String additionalContext;
    private ConsultationStatus status;
    private LocalDate requestDate;
    private LocalDate responseDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Farmer Information
    private Long farmerId;
    private String farmerName;
    private String farmerEmail;
    private String farmerPhone;

    // Expert Information
    private Long expertId;
    private String expertName;
    private String expertEmail;
    private String expertPhone;
    private String expertQualification;
    private Specialization expertSpecialization;
    private Integer expertExperienceYears;
    private String expertLicenseNumber;

    // Expert Response
    private String expertRecommendation;
    private String expertNotes;

    // Related Identifiers
    private Long animalId;
    private String animalTag;

    private Long feedSampleId;
    private String feedSampleCode;

    private Long silageSampleId;
    private String silageSampleCode;

    // Detailed Review Context (Populated on getConsultationById)
    private AnimalSummaryDto animal;
    private FeedSampleSummaryDto feedSample;
    private SilageSampleSummaryDto silageSample;
    private List<HealthRiskSummaryDto> healthRisks;
    private List<AdvisorySummaryDto> advisories;

    // ── Nested Summary DTOs ────────────────────────────────────────

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
        private String species;
        private String gender;
        private LocalDate dateOfBirth;
        private String age;
        private BigDecimal weight;
        private String lactationStage;
        private Integer daysInMilk;
        private BigDecimal milkProductionPerDay;
        private String pregnancyStatus;
        private String feedIntakeStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestResultSummaryDto {
        private Long id;
        private LocalDate testDate;
        private String analysisSource;
        private String overallQuality;
        private BigDecimal moisture;
        private BigDecimal crudeProtein;
        private BigDecimal fiber;
        private BigDecimal ph;
        private Boolean mouldDetected;
        private Boolean spoilageDetected;
        private BigDecimal confidenceScore;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SampleImageSummaryDto {
        private Long id;
        private String originalFilename;
        private String storedFilename;
        private String fileReference;
        private String contentType;
        private Long fileSize;
        private String caption;
        private LocalDateTime createdAt;
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
        private String source;
        private LocalDate sampleDate;
        private String notes;
        private List<TestResultSummaryDto> testResults;
        private String latestQuality;
        private List<SampleImageSummaryDto> images;
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
        private String source;
        private LocalDate sampleDate;
        private String notes;
        private List<TestResultSummaryDto> testResults;
        private String latestQuality;
        private List<SampleImageSummaryDto> images;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HealthRiskSummaryDto {
        private Long id;
        private String riskType;
        private String riskLevel;
        private String description;
        private LocalDate detectedDate;
        private String source;
        private String recommendation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdvisorySummaryDto {
        private Long id;
        private String title;
        private String message;
        private String advisoryType;
        private String priority;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }
}
