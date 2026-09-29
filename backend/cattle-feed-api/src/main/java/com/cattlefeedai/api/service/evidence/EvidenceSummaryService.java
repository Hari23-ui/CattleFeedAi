package com.cattlefeedai.api.service.evidence;

import com.cattlefeedai.api.dto.AnimalResponse;
import com.cattlefeedai.api.dto.FeedPlanResponse;
import com.cattlefeedai.api.dto.analytics.AnimalAnalyticsResponse;
import com.cattlefeedai.api.dto.analytics.HistoricalTestPointDto;
import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.AnimalHealthScreeningResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.evidence.EvidenceSummaryResponse;
import com.cattlefeedai.api.dto.evidence.EvidenceSummaryResponse.*;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.AnalysisSource;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.AnalyticsService;
import com.cattlefeedai.api.service.FeedPlanService;
import com.cattlefeedai.api.service.ai.AiServiceClient;
import com.cattlefeedai.api.service.assessment.AnimalHealthScreeningService;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import com.cattlefeedai.api.service.assessment.VisualScreeningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Aggregation and orchestration service for Unified Decision-Support Evidence.
 * Connects animal records, feed/silage data, laboratory test results, rule-based quality
 * assessments, risk assessments, AI visual screening, animal health screening, feed plans,
 * advisories, expert consultations, and historical analytics.
 *
 * Adheres strictly to scientific boundaries:
 * - Does NOT perform clinical diagnosis or automatic treatment/ration prescription.
 * - Does NOT fabricate missing values (preserves null, empty collections, or "Not Available").
 * - Reuses existing authoritative assessment, screening, planning, and analytics services.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class EvidenceSummaryService {

    public static final String EVIDENCE_DISCLAIMER =
            "This evidence summary combines available recorded, laboratory, screening, and historical information for decision support. " +
            "AI visual screening evaluates image characteristics only and does not measure chemical composition or provide veterinary diagnosis. " +
            "Professional interpretation should be obtained from a qualified Veterinarian or Veterinary Nutritionist.";

    private final AnimalRepository animalRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final TestResultRepository testResultRepository;
    private final SampleImageRepository sampleImageRepository;
    private final ConsultationRepository consultationRepository;
    private final ExpertRepository expertRepository;
    private final FeedPlanRepository feedPlanRepository;
    private final AdvisoryRepository advisoryRepository;
    private final QualityAssessmentService qualityAssessmentService;
    private final RiskAssessmentService riskAssessmentService;
    private final AnimalHealthScreeningService animalHealthScreeningService;
    private final AiServiceClient aiServiceClient;
    private final AnalyticsService analyticsService;
    private final FeedPlanService feedPlanService;
    private final SecurityUtils securityUtils;

    /**
     * Retrieve aggregated evidence for a specific animal.
     * Enforces strict farmer and assigned-expert access control.
     */
    public EvidenceSummaryResponse getEvidenceForAnimal(Long animalId) {
        User currentUser = securityUtils.getCurrentUser();
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));

        validateAnimalAccess(animal, currentUser);
        return buildEvidenceForAnimal(animal, null);
    }

    /**
     * Retrieve aggregated evidence in the context of an expert consultation.
     * Enforces strict consultation participant authorization (owning farmer or assigned expert).
     */
    public EvidenceSummaryResponse getEvidenceForConsultation(Long consultationId) {
        User currentUser = securityUtils.getCurrentUser();
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + consultationId));

        validateConsultationAccess(consultation, currentUser);
        return buildEvidenceForConsultation(consultation);
    }

    // ── Build Methods ───────────────────────────────────────────

    private EvidenceSummaryResponse buildEvidenceForAnimal(Animal animal, Consultation consultation) {
        AnimalResponse animalDto = AnimalResponse.fromEntity(animal);

        // 1. Feed Samples
        List<FeedSample> feedSamples = feedSampleRepository.findByAnimalId(animal.getId());
        List<FeedEvidenceDto> feedEvidence = feedSamples.stream()
                .map(this::mapFeedEvidence)
                .collect(Collectors.toList());

        // 2. Silage Samples
        List<SilageSample> silageSamples = silageSampleRepository.findByAnimalId(animal.getId());
        List<SilageEvidenceDto> silageEvidence = silageSamples.stream()
                .map(this::mapSilageEvidence)
                .collect(Collectors.toList());

        // 3. Test Results
        List<TestResult> testResults = testResultRepository.findByAnimalIdOrderByTestDateAsc(animal.getId());
        List<TestResultEvidenceDto> testEvidence = testResults.stream()
                .map(this::mapTestResultEvidence)
                .collect(Collectors.toList());

        // 4. Quality & Risk Assessments (from most recent test result)
        QualityAssessmentResponse qualityEvidence = null;
        RiskAssessmentResponse riskEvidence = null;
        if (!testResults.isEmpty()) {
            TestResult latestTest = testResults.get(testResults.size() - 1);
            try {
                qualityEvidence = qualityAssessmentService.assessQuality(latestTest);
            } catch (Exception e) {
                log.debug("Could not assess quality for latest test: {}", e.getMessage());
            }
            try {
                riskEvidence = riskAssessmentService.assessRisk(latestTest);
            } catch (Exception e) {
                log.debug("Could not assess risk for latest test: {}", e.getMessage());
            }
        }

        // 5. Visual Screening Evidence
        VisualScreeningEvidenceDto visualScreeningEvidence = buildVisualScreeningEvidence(testResults, feedEvidence, silageEvidence);

        // 6. Animal Health Screening
        AnimalHealthScreeningResponse healthScreeningEvidence = null;
        try {
            healthScreeningEvidence = animalHealthScreeningService.screenAnimalHealth(animal.getId());
        } catch (Exception e) {
            log.debug("Animal health screening not available: {}", e.getMessage());
        }

        // 7. Feed Plans
        List<FeedPlanResponse> feedPlans = feedPlanRepository.findByAnimalIdOrderByCreatedAtDesc(animal.getId()).stream()
                .map(feedPlanService::toResponse)
                .collect(Collectors.toList());

        // 8. Advisories
        List<AdvisoryResponse> advisories = advisoryRepository.findByAnimalId(animal.getId()).stream()
                .map(a -> AdvisoryResponse.fromEntity(a, null, null))
                .collect(Collectors.toList());

        // 9. Historical Analytics Summary
        HistoricalSummaryDto historicalSummary = buildHistoricalSummary(animal.getId(), testEvidence);

        // 10. Consultation Context (if present)
        ConsultationEvidenceDto consultationDto = consultation != null ? buildConsultationEvidenceDto(consultation) : null;

        return EvidenceSummaryResponse.builder()
                .animal(animalDto)
                .consultation(consultationDto)
                .feedEvidence(feedEvidence)
                .silageEvidence(silageEvidence)
                .testEvidence(testEvidence)
                .qualityEvidence(qualityEvidence)
                .riskEvidence(riskEvidence)
                .visualScreeningEvidence(visualScreeningEvidence)
                .healthScreeningEvidence(healthScreeningEvidence)
                .feedPlans(feedPlans)
                .advisories(advisories)
                .historicalSummary(historicalSummary)
                .disclaimer(EVIDENCE_DISCLAIMER)
                .build();
    }

    private EvidenceSummaryResponse buildEvidenceForConsultation(Consultation consultation) {
        if (consultation.getAnimal() != null) {
            EvidenceSummaryResponse response = buildEvidenceForAnimal(consultation.getAnimal(), consultation);

            // Ensure consultation-specific feed or silage sample is included if not already present
            if (consultation.getFeedSample() != null) {
                boolean alreadyPresent = response.getFeedEvidence().stream()
                        .anyMatch(f -> f.getFeedSampleId().equals(consultation.getFeedSample().getId()));
                if (!alreadyPresent) {
                    response.getFeedEvidence().add(0, mapFeedEvidence(consultation.getFeedSample()));
                }
            }
            if (consultation.getSilageSample() != null) {
                boolean alreadyPresent = response.getSilageEvidence().stream()
                        .anyMatch(s -> s.getSilageSampleId().equals(consultation.getSilageSample().getId()));
                if (!alreadyPresent) {
                    response.getSilageEvidence().add(0, mapSilageEvidence(consultation.getSilageSample()));
                }
            }
            return response;
        }

        // Animal is null: Sample-specific consultation
        ConsultationEvidenceDto consultationDto = buildConsultationEvidenceDto(consultation);

        List<FeedEvidenceDto> feedEvidence = new ArrayList<>();
        List<SilageEvidenceDto> silageEvidence = new ArrayList<>();
        List<TestResult> testResults = new ArrayList<>();

        if (consultation.getFeedSample() != null) {
            feedEvidence.add(mapFeedEvidence(consultation.getFeedSample()));
            testResults.addAll(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(consultation.getFeedSample().getId()));
        }
        if (consultation.getSilageSample() != null) {
            silageEvidence.add(mapSilageEvidence(consultation.getSilageSample()));
            testResults.addAll(testResultRepository.findBySilageSampleIdOrderByTestDateAsc(consultation.getSilageSample().getId()));
        }

        List<TestResultEvidenceDto> testEvidence = testResults.stream()
                .map(this::mapTestResultEvidence)
                .collect(Collectors.toList());

        QualityAssessmentResponse qualityEvidence = null;
        RiskAssessmentResponse riskEvidence = null;
        if (!testResults.isEmpty()) {
            TestResult latestTest = testResults.get(testResults.size() - 1);
            try {
                qualityEvidence = qualityAssessmentService.assessQuality(latestTest);
            } catch (Exception e) {
                log.debug("Could not assess quality for latest test: {}", e.getMessage());
            }
            try {
                riskEvidence = riskAssessmentService.assessRisk(latestTest);
            } catch (Exception e) {
                log.debug("Could not assess risk for latest test: {}", e.getMessage());
            }
        }

        VisualScreeningEvidenceDto visualScreeningEvidence = buildVisualScreeningEvidence(testResults, feedEvidence, silageEvidence);
        HistoricalSummaryDto historicalSummary = buildHistoricalSummary(null, testEvidence);

        return EvidenceSummaryResponse.builder()
                .animal(null)
                .consultation(consultationDto)
                .feedEvidence(feedEvidence)
                .silageEvidence(silageEvidence)
                .testEvidence(testEvidence)
                .qualityEvidence(qualityEvidence)
                .riskEvidence(riskEvidence)
                .visualScreeningEvidence(visualScreeningEvidence)
                .healthScreeningEvidence(null)
                .feedPlans(Collections.emptyList())
                .advisories(Collections.emptyList())
                .historicalSummary(historicalSummary)
                .disclaimer(EVIDENCE_DISCLAIMER)
                .build();
    }

    // ── Mapping Helpers ─────────────────────────────────────────

    private FeedEvidenceDto mapFeedEvidence(FeedSample sample) {
        if (sample == null) return null;

        int imageCount = 0;
        try {
            imageCount = sampleImageRepository.findByFeedSampleIdOrderByCreatedAtDesc(sample.getId()).size();
        } catch (Exception ignored) {}

        String latestQuality = "Not Available";
        List<TestResult> tests = testResultRepository.findByFeedSampleIdOrderByTestDateDesc(sample.getId());
        if (!tests.isEmpty()) {
            try {
                QualityAssessmentResponse qa = qualityAssessmentService.assessQuality(tests.get(0));
                if (qa != null && qa.getQualityStatus() != null) {
                    latestQuality = qa.getQualityStatus().name();
                }
            } catch (Exception ignored) {}
        }

        return FeedEvidenceDto.builder()
                .feedSampleId(sample.getId())
                .sampleCode(sample.getSampleCode())
                .feedType(sample.getFeedType() != null ? sample.getFeedType().name() : null)
                .source(sample.getSource())
                .sampleDate(sample.getSampleDate())
                .notes(sample.getNotes())
                .imageCount(imageCount)
                .latestQuality(latestQuality)
                .evidenceSource("RECORDED_DATA")
                .build();
    }

    private SilageEvidenceDto mapSilageEvidence(SilageSample sample) {
        if (sample == null) return null;

        int imageCount = 0;
        try {
            imageCount = sampleImageRepository.findBySilageSampleIdOrderByCreatedAtDesc(sample.getId()).size();
        } catch (Exception ignored) {}

        String latestQuality = "Not Available";
        List<TestResult> tests = testResultRepository.findBySilageSampleIdOrderByTestDateDesc(sample.getId());
        if (!tests.isEmpty()) {
            try {
                QualityAssessmentResponse qa = qualityAssessmentService.assessQuality(tests.get(0));
                if (qa != null && qa.getQualityStatus() != null) {
                    latestQuality = qa.getQualityStatus().name();
                }
            } catch (Exception ignored) {}
        }

        return SilageEvidenceDto.builder()
                .silageSampleId(sample.getId())
                .sampleCode(sample.getSampleCode())
                .silageType(sample.getSilageType() != null ? sample.getSilageType().name() : null)
                .source(sample.getSource())
                .sampleDate(sample.getSampleDate())
                .notes(sample.getNotes())
                .imageCount(imageCount)
                .latestQuality(latestQuality)
                .evidenceSource("RECORDED_DATA")
                .build();
    }

    private TestResultEvidenceDto mapTestResultEvidence(TestResult tr) {
        if (tr == null) return null;

        String qualityStatus = "Not Available";
        try {
            QualityAssessmentResponse qa = qualityAssessmentService.assessQuality(tr);
            if (qa != null && qa.getQualityStatus() != null) {
                qualityStatus = qa.getQualityStatus().name();
            }
        } catch (Exception ignored) {}

        String riskLevel = "Not Available";
        try {
            RiskAssessmentResponse ra = riskAssessmentService.assessRisk(tr);
            if (ra != null && ra.getOverallRiskLevel() != null) {
                riskLevel = ra.getOverallRiskLevel().name();
            }
        } catch (Exception ignored) {}

        String sampleType = tr.getFeedSample() != null ? "FEED" : (tr.getSilageSample() != null ? "SILAGE" : "UNKNOWN");
        String sampleCode = tr.getFeedSample() != null ? tr.getFeedSample().getSampleCode()
                : (tr.getSilageSample() != null ? tr.getSilageSample().getSampleCode() : null);

        String evidenceSource = "RECORDED_DATA";
        if (tr.getAnalysisSource() == AnalysisSource.IMAGE) {
            evidenceSource = "AI_VISUAL_SCREENING";
        } else if (tr.getAnalysisSource() == AnalysisSource.LAB) {
            evidenceSource = "LABORATORY_DATA";
        }

        return TestResultEvidenceDto.builder()
                .testResultId(tr.getId())
                .sampleType(sampleType)
                .sampleCode(sampleCode)
                .testDate(tr.getTestDate())
                .analysisSource(tr.getAnalysisSource())
                .moisture(tr.getMoisture())
                .crudeProtein(tr.getCrudeProtein())
                .fiber(tr.getFiber())
                .energyValue(tr.getEnergyValue())
                .ph(tr.getPh())
                .mineralStatus(tr.getMineralStatus())
                .aflatoxin(tr.getAflatoxin())
                .mycotoxin(tr.getMycotoxin())
                .adulteration(tr.getAdulteration())
                .mouldDetected(tr.getMouldDetected())
                .spoilageDetected(tr.getSpoilageDetected())
                .overallQuality(tr.getOverallQuality())
                .confidenceScore(tr.getConfidenceScore())
                .qualityStatus(qualityStatus)
                .riskLevel(riskLevel)
                .evidenceSource(evidenceSource)
                .build();
    }

    private VisualScreeningEvidenceDto buildVisualScreeningEvidence(
            List<TestResult> testResults,
            List<FeedEvidenceDto> feedList,
            List<SilageEvidenceDto> silageList
    ) {
        TestResult visualTest = testResults.stream()
                .filter(tr -> tr.getAnalysisSource() == AnalysisSource.IMAGE || tr.getMouldDetected() != null || tr.getSpoilageDetected() != null)
                .reduce((first, second) -> second)
                .orElse(null);

        int totalImages = feedList.stream().mapToInt(f -> f.getImageCount() != null ? f.getImageCount() : 0).sum()
                + silageList.stream().mapToInt(s -> s.getImageCount() != null ? s.getImageCount() : 0).sum();

        String modelVersion = null;
        boolean modelAvailable = false;
        try {
            if (aiServiceClient != null) {
                var info = aiServiceClient.getServiceInfo();
                if (info != null) {
                    modelVersion = info.getVersion();
                    modelAvailable = Boolean.TRUE.equals(info.getAnalysisAvailable());
                }
            }
        } catch (Exception e) {
            log.debug("AI service probe failed gracefully: {}", e.getMessage());
        }

        if (visualTest == null && totalImages == 0) {
            return VisualScreeningEvidenceDto.builder()
                    .evidenceAvailable(false)
                    .analysisSource("NOT_AVAILABLE")
                    .modelVersion(modelVersion)
                    .modelAvailable(modelAvailable)
                    .visualStatus("Not Available")
                    .mouldDetected(null)
                    .spoilageDetected(null)
                    .foreignMaterialDetected(null)
                    .confidenceScore(null)
                    .identifiedVisualRisks(Collections.emptyList())
                    .disclaimer(VisualScreeningService.VISUAL_SCREENING_DISCLAIMER)
                    .evidenceSource("AI_VISUAL_SCREENING")
                    .build();
        }

        List<String> risks = new ArrayList<>();
        Boolean mould = visualTest != null ? visualTest.getMouldDetected() : null;
        Boolean spoilage = visualTest != null ? visualTest.getSpoilageDetected() : null;
        Boolean foreign = null;

        if (visualTest != null && visualTest.getAdulteration() != null) {
            foreign = visualTest.getAdulteration().contains("FOREIGN") || visualTest.getAdulteration().contains("ADULTER");
        }

        if (Boolean.TRUE.equals(mould)) {
            risks.add("Visible surface mould or fungal growth detected via visual screening");
        }
        if (Boolean.TRUE.equals(spoilage)) {
            risks.add("Visible surface discoloration or organoleptic spoilage detected");
        }
        if (Boolean.TRUE.equals(foreign)) {
            risks.add("Visible foreign particles or adulterants detected");
        }

        String visualStatus = (visualTest == null) ? "PENDING_ANALYSIS"
                : (risks.isEmpty() ? "NORMAL" : (Boolean.TRUE.equals(mould) ? "ABNORMAL" : "SUSPICIOUS"));

        String analysisSource = (visualTest != null && visualTest.getAnalysisSource() == AnalysisSource.IMAGE)
                ? (modelAvailable ? "ML_VISUAL_SCREENING" : "DETERMINISTIC_VISUAL_SCREENING")
                : (modelAvailable ? "ML_VISUAL_SCREENING" : "DETERMINISTIC_VISUAL_SCREENING");

        String sampleType = visualTest != null && visualTest.getFeedSample() != null ? "FEED"
                : (visualTest != null && visualTest.getSilageSample() != null ? "SILAGE" : null);
        Long sampleId = visualTest != null && visualTest.getFeedSample() != null ? visualTest.getFeedSample().getId()
                : (visualTest != null && visualTest.getSilageSample() != null ? visualTest.getSilageSample().getId() : null);

        return VisualScreeningEvidenceDto.builder()
                .evidenceAvailable(true)
                .analysisSource(analysisSource)
                .modelVersion(modelVersion)
                .modelAvailable(modelAvailable)
                .visualStatus(visualStatus)
                .mouldDetected(mould)
                .spoilageDetected(spoilage)
                .foreignMaterialDetected(foreign)
                .confidenceScore(visualTest != null ? visualTest.getConfidenceScore() : null)
                .sampleType(sampleType)
                .sampleId(sampleId)
                .identifiedVisualRisks(risks)
                .screeningNotes(visualTest != null ? visualTest.getAdulteration() : null)
                .screeningTimestamp(visualTest != null && visualTest.getCreatedAt() != null ? visualTest.getCreatedAt() : LocalDateTime.now())
                .disclaimer(VisualScreeningService.VISUAL_SCREENING_DISCLAIMER)
                .evidenceSource(analysisSource)
                .build();
    }

    private HistoricalSummaryDto buildHistoricalSummary(Long animalId, List<TestResultEvidenceDto> testList) {
        long totalFeedTests = testList.stream().filter(t -> "FEED".equalsIgnoreCase(t.getSampleType())).count();
        long totalSilageTests = testList.stream().filter(t -> "SILAGE".equalsIgnoreCase(t.getSampleType())).count();

        Map<String, Long> qualityDist = new LinkedHashMap<>();
        qualityDist.put("GOOD", 0L);
        qualityDist.put("ACCEPTABLE", 0L);
        qualityDist.put("NEEDS_ATTENTION", 0L);
        qualityDist.put("UNSAFE", 0L);
        qualityDist.put("INSUFFICIENT_DATA", 0L);

        Map<String, Long> riskDist = new LinkedHashMap<>();
        riskDist.put("LOW", 0L);
        riskDist.put("MEDIUM", 0L);
        riskDist.put("HIGH", 0L);

        for (TestResultEvidenceDto t : testList) {
            if (t.getQualityStatus() != null) {
                qualityDist.put(t.getQualityStatus(), qualityDist.getOrDefault(t.getQualityStatus(), 0L) + 1L);
            }
            if (t.getRiskLevel() != null) {
                riskDist.put(t.getRiskLevel(), riskDist.getOrDefault(t.getRiskLevel(), 0L) + 1L);
            }
        }

        long consultationsCount = animalId != null ? consultationRepository.findByAnimalId(animalId).size() : 0L;
        long advisoriesCount = animalId != null ? advisoryRepository.findByAnimalId(animalId).size() : 0L;

        HistoricalTestPointDto latestPoint = null;
        String descriptiveSummary = testList.isEmpty()
                ? "No historical test records found."
                : testList.size() + " test record(s) available.";

        if (animalId != null) {
            try {
                AnimalAnalyticsResponse analytics = analyticsService.getAnimalAnalytics(animalId, null);
                if (analytics != null) {
                    latestPoint = analytics.getLatestMeasurements();
                    if (analytics.getDescriptiveSummary() != null) {
                        descriptiveSummary = analytics.getDescriptiveSummary();
                    }
                }
            } catch (Exception e) {
                log.debug("Historical analytics lookup: {}", e.getMessage());
            }
        }

        return HistoricalSummaryDto.builder()
                .totalTestResults((long) testList.size())
                .totalFeedTests(totalFeedTests)
                .totalSilageTests(totalSilageTests)
                .totalConsultations(consultationsCount)
                .totalActiveAdvisories(advisoriesCount)
                .qualityDistribution(qualityDist)
                .riskDistribution(riskDist)
                .latestMeasurements(latestPoint)
                .descriptiveSummary(descriptiveSummary)
                .disclaimer(AnalyticsService.ANALYTICS_DISCLAIMER)
                .evidenceSource("HISTORICAL_ANALYTICS")
                .build();
    }

    private ConsultationEvidenceDto buildConsultationEvidenceDto(Consultation c) {
        if (c == null) return null;

        return ConsultationEvidenceDto.builder()
                .id(c.getId())
                .subject(c.getSubject())
                .question(c.getFarmerMessage())
                .additionalContext(c.getAdditionalContext())
                .status(c.getStatus())
                .requestDate(c.getRequestDate())
                .responseDate(c.getResponseDate())
                .completedAt(c.getCompletedAt())
                .farmerId(c.getFarmer() != null ? c.getFarmer().getId() : null)
                .farmerName(c.getFarmer() != null ? c.getFarmer().getUsername() : null)
                .expertId(c.getExpert() != null ? c.getExpert().getId() : null)
                .expertName(c.getExpert() != null && c.getExpert().getUser() != null ? c.getExpert().getUser().getUsername() : null)
                .expertSpecialization(c.getExpert() != null ? c.getExpert().getSpecialization() : null)
                .expertRecommendation(c.getExpertResponse())
                .expertNotes(c.getExpertNotes())
                .evidenceSource(c.getExpertResponse() != null ? "EXPERT_RESPONSE" : "FARMER_RECORDED_INFORMATION")
                .build();
    }

    // ── Security Validation ─────────────────────────────────────

    private void validateAnimalAccess(Animal animal, User user) {
        if (securityUtils.isAdmin(user)) {
            return;
        }
        if (animal.getFarm() != null && animal.getFarm().getOwner().getId().equals(user.getId())) {
            return;
        }
        if (user.getRole() == Role.EXPERT) {
            Expert expert = expertRepository.findByUserId(user.getId()).orElse(null);
            if (expert != null) {
                boolean linked = consultationRepository.findByAnimalId(animal.getId()).stream()
                        .anyMatch(c -> c.getExpert() != null && c.getExpert().getId().equals(expert.getId()));
                if (linked) {
                    return;
                }
            }
        }
        throw new ResourceOwnershipException("Access denied: You do not have permission to access evidence for this animal");
    }

    private void validateConsultationAccess(Consultation consultation, User user) {
        if (securityUtils.isAdmin(user)) {
            return;
        }
        if (user.getRole() == Role.FARMER) {
            if (consultation.getFarmer() == null || !consultation.getFarmer().getId().equals(user.getId())) {
                throw new ResourceOwnershipException("Access denied: You are not authorized to view evidence for another farmer's consultation");
            }
            return;
        }
        if (user.getRole() == Role.EXPERT) {
            Expert expert = expertRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceOwnershipException("Expert profile not found for user: " + user.getEmail()));
            if (consultation.getExpert() == null || !consultation.getExpert().getId().equals(expert.getId())) {
                throw new ResourceOwnershipException("Access denied: You are not the assigned expert for this consultation");
            }
            return;
        }
        throw new ResourceOwnershipException("Access denied: Unauthorized role");
    }
}
