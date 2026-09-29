package com.cattlefeedai.api.dto.evidence;

import com.cattlefeedai.api.dto.AnimalResponse;
import com.cattlefeedai.api.dto.FeedPlanResponse;
import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.AnimalHealthScreeningResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.analytics.HistoricalTestPointDto;
import com.cattlefeedai.api.entity.enums.AnalysisSource;
import com.cattlefeedai.api.entity.enums.ConsultationStatus;
import com.cattlefeedai.api.entity.enums.OverallQuality;
import com.cattlefeedai.api.entity.enums.Specialization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Unified Decision-Support Evidence Summary DTO.
 * Aggregates animal profile, feed/silage records, lab tests, quality & risk assessments,
 * AI visual screening, animal health screening, feed plans, advisories, historical analytics,
 * and expert consultation response into an evidence-based view.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceSummaryResponse {

    private AnimalResponse animal;
    private ConsultationEvidenceDto consultation;
    private List<FeedEvidenceDto> feedEvidence;
    private List<SilageEvidenceDto> silageEvidence;
    private List<TestResultEvidenceDto> testEvidence;
    private QualityAssessmentResponse qualityEvidence;
    private RiskAssessmentResponse riskEvidence;
    private VisualScreeningEvidenceDto visualScreeningEvidence;
    private AnimalHealthScreeningResponse healthScreeningEvidence;
    private List<FeedPlanResponse> feedPlans;
    private List<AdvisoryResponse> advisories;
    private HistoricalSummaryDto historicalSummary;
    private String disclaimer;

    // ── Nested Evidence DTOs ────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConsultationEvidenceDto {
        private Long id;
        private String subject;
        private String question;
        private String additionalContext;
        private ConsultationStatus status;
        private LocalDate requestDate;
        private LocalDate responseDate;
        private LocalDateTime completedAt;
        private Long farmerId;
        private String farmerName;
        private Long expertId;
        private String expertName;
        private Specialization expertSpecialization;
        private String expertRecommendation;
        private String expertNotes;
        private String evidenceSource;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeedEvidenceDto {
        private Long feedSampleId;
        private String sampleCode;
        private String feedType;
        private String source;
        private LocalDate sampleDate;
        private String notes;
        private Integer imageCount;
        private String latestQuality;
        private String evidenceSource;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SilageEvidenceDto {
        private Long silageSampleId;
        private String sampleCode;
        private String silageType;
        private String source;
        private LocalDate sampleDate;
        private String notes;
        private Integer imageCount;
        private String latestQuality;
        private String evidenceSource;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestResultEvidenceDto {
        private Long testResultId;
        private String sampleType;
        private String sampleCode;
        private LocalDate testDate;
        private AnalysisSource analysisSource;
        private BigDecimal moisture;
        private BigDecimal crudeProtein;
        private BigDecimal fiber;
        private BigDecimal energyValue;
        private BigDecimal ph;
        private String mineralStatus;
        private BigDecimal aflatoxin;
        private BigDecimal mycotoxin;
        private String adulteration;
        private Boolean mouldDetected;
        private Boolean spoilageDetected;
        private OverallQuality overallQuality;
        private BigDecimal confidenceScore;
        private String qualityStatus;
        private String riskLevel;
        private String evidenceSource;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VisualScreeningEvidenceDto {
        private Boolean evidenceAvailable;
        private String analysisSource;
        private String modelVersion;
        private Boolean modelAvailable;
        private String visualStatus;
        private Boolean mouldDetected;
        private Boolean spoilageDetected;
        private Boolean foreignMaterialDetected;
        private BigDecimal confidenceScore;
        private String imageReference;
        private String sampleType;
        private Long sampleId;
        private List<String> identifiedVisualRisks;
        private String screeningNotes;
        private LocalDateTime screeningTimestamp;
        private String disclaimer;
        private String evidenceSource;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoricalSummaryDto {
        private Long totalTestResults;
        private Long totalFeedTests;
        private Long totalSilageTests;
        private Long totalConsultations;
        private Long totalActiveAdvisories;
        private Map<String, Long> qualityDistribution;
        private Map<String, Long> riskDistribution;
        private HistoricalTestPointDto latestMeasurements;
        private String descriptiveSummary;
        private String disclaimer;
        private String evidenceSource;
    }
}
