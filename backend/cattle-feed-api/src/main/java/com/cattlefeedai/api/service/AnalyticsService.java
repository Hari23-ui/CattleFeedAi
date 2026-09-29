package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.analytics.AnimalAnalyticsResponse;
import com.cattlefeedai.api.dto.analytics.FarmAnalyticsSummaryResponse;
import com.cattlefeedai.api.dto.analytics.HistoricalTestPointDto;
import com.cattlefeedai.api.dto.analytics.SampleHistoricalTrendsResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service providing descriptive historical analytics and trend tracking
 * across farms, animals, feed samples, and silage samples.
 *
 * Adheres strictly to scientific boundaries:
 * - Descriptive analysis only; no medical diagnosis or causal inference
 * - Preserves null measurements without fabrication or default values
 * - Reuses existing QualityAssessment and RiskAssessment rule engines
 */
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    public static final String ANALYTICS_DISCLAIMER =
            "Analytics are descriptive summaries of available historical records and do not establish medical or causal conclusions. Offline support, IoT integration, and NIR instrumentation remain future scope and are not implemented.";

    private final TestResultRepository testResultRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final AnimalRepository animalRepository;
    private final FarmRepository farmRepository;
    private final AdvisoryRepository advisoryRepository;
    private final ConsultationRepository consultationRepository;
    private final HealthRiskRepository healthRiskRepository;
    private final ExpertRepository expertRepository;
    private final SecurityUtils securityUtils;
    private final QualityAssessmentService qualityAssessmentService;
    private final RiskAssessmentService riskAssessmentService;

    public AnalyticsService(
            TestResultRepository testResultRepository,
            FeedSampleRepository feedSampleRepository,
            SilageSampleRepository silageSampleRepository,
            AnimalRepository animalRepository,
            FarmRepository farmRepository,
            AdvisoryRepository advisoryRepository,
            ConsultationRepository consultationRepository,
            HealthRiskRepository healthRiskRepository,
            ExpertRepository expertRepository,
            SecurityUtils securityUtils,
            QualityAssessmentService qualityAssessmentService,
            RiskAssessmentService riskAssessmentService
    ) {
        this.testResultRepository = testResultRepository;
        this.feedSampleRepository = feedSampleRepository;
        this.silageSampleRepository = silageSampleRepository;
        this.animalRepository = animalRepository;
        this.farmRepository = farmRepository;
        this.advisoryRepository = advisoryRepository;
        this.consultationRepository = consultationRepository;
        this.healthRiskRepository = healthRiskRepository;
        this.expertRepository = expertRepository;
        this.securityUtils = securityUtils;
        this.qualityAssessmentService = qualityAssessmentService;
        this.riskAssessmentService = riskAssessmentService;
    }

    /**
     * Get aggregate analytics summary for the authenticated user.
     */
    public FarmAnalyticsSummaryResponse getFarmSummary(Integer days) {
        User currentUser = securityUtils.getCurrentUser();
        LocalDate startDate = (days != null && days > 0) ? LocalDate.now().minusDays(days) : null;

        long totalAnimals;
        long totalFeedSamples;
        long totalSilageSamples;
        List<TestResult> testResults;
        long totalActiveAdvisories;
        long totalConsultations;

        if (securityUtils.isAdmin(currentUser)) {
            totalAnimals = animalRepository.count();
            totalFeedSamples = feedSampleRepository.count();
            totalSilageSamples = silageSampleRepository.count();
            testResults = (startDate != null)
                    ? testResultRepository.findByTestDateGreaterThanEqualOrderByTestDateDesc(startDate)
                    : testResultRepository.findAllByOrderByTestDateDesc();
            totalActiveAdvisories = advisoryRepository.count();
            totalConsultations = consultationRepository.count();
        } else if (currentUser.getRole() == Role.EXPERT) {
            Expert expert = expertRepository.findByUserId(currentUser.getId()).orElse(null);
            List<Consultation> consultations = expert != null
                    ? consultationRepository.findByExpertId(expert.getId())
                    : Collections.emptyList();
            totalConsultations = consultations.size();

            Set<Long> animalIds = consultations.stream()
                    .map(Consultation::getAnimal)
                    .filter(Objects::nonNull)
                    .map(Animal::getId)
                    .collect(Collectors.toSet());
            totalAnimals = animalIds.size();

            Set<Long> feedSampleIds = consultations.stream()
                    .map(Consultation::getFeedSample)
                    .filter(Objects::nonNull)
                    .map(FeedSample::getId)
                    .collect(Collectors.toSet());
            totalFeedSamples = feedSampleIds.size();

            Set<Long> silageSampleIds = consultations.stream()
                    .map(Consultation::getSilageSample)
                    .filter(Objects::nonNull)
                    .map(SilageSample::getId)
                    .collect(Collectors.toSet());
            totalSilageSamples = silageSampleIds.size();

            testResults = new ArrayList<>();
            for (Long fsId : feedSampleIds) {
                testResults.addAll(startDate != null
                        ? testResultRepository.findByFeedSampleIdAndStartDateOrderByTestDateAsc(fsId, startDate)
                        : testResultRepository.findByFeedSampleIdOrderByTestDateAsc(fsId));
            }
            for (Long ssId : silageSampleIds) {
                testResults.addAll(startDate != null
                        ? testResultRepository.findBySilageSampleIdAndStartDateOrderByTestDateAsc(ssId, startDate)
                        : testResultRepository.findBySilageSampleIdOrderByTestDateAsc(ssId));
            }
            totalActiveAdvisories = 0;
        } else {
            // Standard Farmer ownership scoping
            Long ownerId = currentUser.getId();
            totalAnimals = animalRepository.findByFarmOwnerId(ownerId).size();
            totalFeedSamples = feedSampleRepository.findByFarmOwnerId(ownerId).size();
            totalSilageSamples = silageSampleRepository.findByFarmOwnerId(ownerId).size();
            testResults = (startDate != null)
                    ? testResultRepository.findByOwnerIdAndStartDate(ownerId, startDate)
                    : testResultRepository.findByOwnerId(ownerId);
            totalActiveAdvisories = advisoryRepository.findByAnimalFarmOwnerIdAndIsRead(ownerId, false).size();
            totalConsultations = consultationRepository.findByFarmerId(ownerId).size();
        }

        // Quality Status Distribution
        Map<String, Long> qualityDist = initQualityStatusMap();
        Map<String, Long> riskDist = initRiskMap();
        long contaminationCount = 0;
        long nutritionalCount = 0;
        long storageCount = 0;

        for (TestResult tr : testResults) {
            QualityAssessmentResponse qa = qualityAssessmentService.assessQuality(tr);
            if (qa != null && qa.getQualityStatus() != null) {
                String qs = qa.getQualityStatus().name();
                qualityDist.put(qs, qualityDist.getOrDefault(qs, 0L) + 1L);
            }

            RiskAssessmentResponse ra = riskAssessmentService.assessRisk(tr);
            if (ra != null && ra.getOverallRiskLevel() != null) {
                String rk = ra.getOverallRiskLevel().name();
                riskDist.put(rk, riskDist.getOrDefault(rk, 0L) + 1L);
                if (ra.getContaminationRisks() != null) {
                    contaminationCount += ra.getContaminationRisks().size();
                }
                if (ra.getNutritionalImbalances() != null) {
                    nutritionalCount += ra.getNutritionalImbalances().size();
                }
                if (ra.getStorageSpoilageRisks() != null) {
                    storageCount += ra.getStorageSpoilageRisks().size();
                }
            }
        }

        return FarmAnalyticsSummaryResponse.builder()
                .totalAnimals(totalAnimals)
                .totalFeedSamples(totalFeedSamples)
                .totalSilageSamples(totalSilageSamples)
                .totalTestResults(testResults.size())
                .totalActiveAdvisories(totalActiveAdvisories)
                .totalConsultations(totalConsultations)
                .qualityStatusDistribution(qualityDist)
                .riskDistribution(riskDist)
                .contaminationRiskCount(contaminationCount)
                .nutritionalRiskCount(nutritionalCount)
                .storageRiskCount(storageCount)
                .daysFilter(days)
                .disclaimer(ANALYTICS_DISCLAIMER)
                .build();
    }

    /**
     * Get historical analytics and test trends for a specific animal.
     */
    public AnimalAnalyticsResponse getAnimalAnalytics(Long animalId, Integer days) {
        User currentUser = securityUtils.getCurrentUser();
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));

        validateAnimalAccess(animal, currentUser);

        LocalDate startDate = (days != null && days > 0) ? LocalDate.now().minusDays(days) : null;
        List<TestResult> testResults = (startDate != null)
                ? testResultRepository.findByAnimalIdAndStartDateOrderByTestDateAsc(animalId, startDate)
                : testResultRepository.findByAnimalIdOrderByTestDateAsc(animalId);

        List<HistoricalTestPointDto> points = testResults.stream()
                .map(this::mapToHistoricalTestPointDto)
                .toList();

        long feedTests = points.stream().filter(p -> "FEED".equalsIgnoreCase(p.getSampleType())).count();
        long silageTests = points.stream().filter(p -> "SILAGE".equalsIgnoreCase(p.getSampleType())).count();

        HistoricalTestPointDto latestMeasurements = points.isEmpty() ? null : points.get(points.size() - 1);

        Map<String, Long> qualityDist = initQualityStatusMap();
        Map<String, Long> riskDist = initRiskMap();
        for (HistoricalTestPointDto p : points) {
            if (p.getQualityStatus() != null) {
                qualityDist.put(p.getQualityStatus(), qualityDist.getOrDefault(p.getQualityStatus(), 0L) + 1L);
            }
            if (p.getRiskLevel() != null) {
                riskDist.put(p.getRiskLevel(), riskDist.getOrDefault(p.getRiskLevel(), 0L) + 1L);
            }
        }

        List<Advisory> advisories = advisoryRepository.findByAnimalIdAndIsReadFalse(animalId);
        List<String> advisoryTitles = advisories.stream().map(Advisory::getTitle).toList();

        List<HealthRisk> healthRisks = healthRiskRepository.findByAnimalId(animalId);
        List<String> healthRiskSummaries = healthRisks.stream()
                .map(hr -> (hr.getRiskType() != null ? hr.getRiskType() : "RISK") + ": " + (hr.getDescription() != null ? hr.getDescription() : ""))
                .toList();

        long consultationCount = consultationRepository.findByAnimalId(animalId).size();

        String summary = buildDescriptiveSummary(points, "animal " + animal.getAnimalTag());

        return AnimalAnalyticsResponse.builder()
                .animalId(animal.getId())
                .animalTag(animal.getAnimalTag())
                .name(animal.getName())
                .breed(animal.getBreed())
                .gender(animal.getGender() != null ? animal.getGender().name() : null)
                .weight(animal.getWeight())
                .lactationStage(animal.getLactationStage() != null ? animal.getLactationStage().name() : null)
                .milkProductionPerDay(animal.getMilkProductionPerDay())
                .farmId(animal.getFarm() != null ? animal.getFarm().getId() : null)
                .farmName(animal.getFarm() != null ? animal.getFarm().getFarmName() : null)
                .totalFeedTests(feedTests)
                .totalSilageTests(silageTests)
                .totalTestResults(points.size())
                .totalActiveAdvisories(advisories.size())
                .totalConsultations(consultationCount)
                .daysFilter(days)
                .latestMeasurements(latestMeasurements)
                .testHistory(points)
                .qualityStatusDistribution(qualityDist)
                .riskDistribution(riskDist)
                .activeAdvisoryTitles(advisoryTitles)
                .healthRiskSummary(healthRiskSummaries)
                .descriptiveSummary(summary)
                .disclaimer(ANALYTICS_DISCLAIMER)
                .build();
    }

    /**
     * Get historical test trends for a specific feed sample.
     */
    public SampleHistoricalTrendsResponse getFeedSampleHistory(Long feedSampleId, Integer days) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample sample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFeedSampleAccess(sample, currentUser);

        LocalDate startDate = (days != null && days > 0) ? LocalDate.now().minusDays(days) : null;
        List<TestResult> testResults = (startDate != null)
                ? testResultRepository.findByFeedSampleIdAndStartDateOrderByTestDateAsc(feedSampleId, startDate)
                : testResultRepository.findByFeedSampleIdOrderByTestDateAsc(feedSampleId);

        List<HistoricalTestPointDto> points = testResults.stream()
                .map(this::mapToHistoricalTestPointDto)
                .toList();

        Map<String, Long> qualityDist = initQualityStatusMap();
        Map<String, Long> riskDist = initRiskMap();
        for (HistoricalTestPointDto p : points) {
            if (p.getQualityStatus() != null) {
                qualityDist.put(p.getQualityStatus(), qualityDist.getOrDefault(p.getQualityStatus(), 0L) + 1L);
            }
            if (p.getRiskLevel() != null) {
                riskDist.put(p.getRiskLevel(), riskDist.getOrDefault(p.getRiskLevel(), 0L) + 1L);
            }
        }

        String summary = buildDescriptiveSummary(points, "feed sample " + sample.getSampleCode());

        return SampleHistoricalTrendsResponse.builder()
                .sampleId(sample.getId())
                .sampleCode(sample.getSampleCode())
                .sampleType("FEED")
                .subtype(sample.getFeedType() != null ? sample.getFeedType().name() : null)
                .farmId(sample.getFarm() != null ? sample.getFarm().getId() : null)
                .farmName(sample.getFarm() != null ? sample.getFarm().getFarmName() : null)
                .animalId(sample.getAnimal() != null ? sample.getAnimal().getId() : null)
                .animalTag(sample.getAnimal() != null ? sample.getAnimal().getAnimalTag() : null)
                .sampleDate(sample.getSampleDate())
                .totalTestPoints(points.size())
                .daysFilter(days)
                .testPoints(points)
                .qualityStatusDistribution(qualityDist)
                .riskDistribution(riskDist)
                .descriptiveSummary(summary)
                .disclaimer(ANALYTICS_DISCLAIMER)
                .build();
    }

    /**
     * Get historical test trends for a specific silage sample.
     */
    public SampleHistoricalTrendsResponse getSilageSampleHistory(Long silageSampleId, Integer days) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample sample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateSilageSampleAccess(sample, currentUser);

        LocalDate startDate = (days != null && days > 0) ? LocalDate.now().minusDays(days) : null;
        List<TestResult> testResults = (startDate != null)
                ? testResultRepository.findBySilageSampleIdAndStartDateOrderByTestDateAsc(silageSampleId, startDate)
                : testResultRepository.findBySilageSampleIdOrderByTestDateAsc(silageSampleId);

        List<HistoricalTestPointDto> points = testResults.stream()
                .map(this::mapToHistoricalTestPointDto)
                .toList();

        Map<String, Long> qualityDist = initQualityStatusMap();
        Map<String, Long> riskDist = initRiskMap();
        for (HistoricalTestPointDto p : points) {
            if (p.getQualityStatus() != null) {
                qualityDist.put(p.getQualityStatus(), qualityDist.getOrDefault(p.getQualityStatus(), 0L) + 1L);
            }
            if (p.getRiskLevel() != null) {
                riskDist.put(p.getRiskLevel(), riskDist.getOrDefault(p.getRiskLevel(), 0L) + 1L);
            }
        }

        String summary = buildDescriptiveSummary(points, "silage sample " + sample.getSampleCode());

        return SampleHistoricalTrendsResponse.builder()
                .sampleId(sample.getId())
                .sampleCode(sample.getSampleCode())
                .sampleType("SILAGE")
                .subtype(sample.getSilageType() != null ? sample.getSilageType().name() : null)
                .farmId(sample.getFarm() != null ? sample.getFarm().getId() : null)
                .farmName(sample.getFarm() != null ? sample.getFarm().getFarmName() : null)
                .animalId(sample.getAnimal() != null ? sample.getAnimal().getId() : null)
                .animalTag(sample.getAnimal() != null ? sample.getAnimal().getAnimalTag() : null)
                .sampleDate(sample.getSampleDate())
                .totalTestPoints(points.size())
                .daysFilter(days)
                .testPoints(points)
                .qualityStatusDistribution(qualityDist)
                .riskDistribution(riskDist)
                .descriptiveSummary(summary)
                .disclaimer(ANALYTICS_DISCLAIMER)
                .build();
    }

    /**
     * Map a TestResult entity to HistoricalTestPointDto.
     * Preserves exact database values, keeping nulls as null without zero-filling.
     */
    public HistoricalTestPointDto mapToHistoricalTestPointDto(TestResult tr) {
        if (tr == null) {
            return null;
        }

        QualityAssessmentResponse qa = qualityAssessmentService.assessQuality(tr);
        RiskAssessmentResponse ra = riskAssessmentService.assessRisk(tr);

        String sampleType = tr.getFeedSample() != null ? "FEED" :
                (tr.getSilageSample() != null ? "SILAGE" : "UNKNOWN");

        String sampleCode = tr.getFeedSample() != null ? tr.getFeedSample().getSampleCode() :
                (tr.getSilageSample() != null ? tr.getSilageSample().getSampleCode() : null);

        return HistoricalTestPointDto.builder()
                .testResultId(tr.getId())
                .testDate(tr.getTestDate())
                .sampleType(sampleType)
                .sampleCode(sampleCode)
                .analysisSource(tr.getAnalysisSource() != null ? tr.getAnalysisSource().name() : null)
                .moisture(tr.getMoisture())
                .crudeProtein(tr.getCrudeProtein())
                .fiber(tr.getFiber())
                .energyValue(tr.getEnergyValue())
                .aflatoxin(tr.getAflatoxin())
                .mycotoxin(tr.getMycotoxin())
                .ph(tr.getPh())
                .mineralStatus(tr.getMineralStatus())
                .adulteration(tr.getAdulteration())
                .mouldDetected(tr.getMouldDetected())
                .spoilageDetected(tr.getSpoilageDetected())
                .qualityStatus(qa != null && qa.getQualityStatus() != null ? qa.getQualityStatus().name() : "INSUFFICIENT_DATA")
                .riskLevel(ra != null && ra.getOverallRiskLevel() != null ? ra.getOverallRiskLevel().name() : "LOW")
                .confidenceScore(tr.getConfidenceScore())
                .triggeredRulesCount(qa != null ? qa.getTriggeredRulesCount() : 0)
                .build();
    }

    /**
     * Build an objective, factual, non-causal descriptive summary from test points.
     */
    private String buildDescriptiveSummary(List<HistoricalTestPointDto> points, String targetDescription) {
        if (points == null || points.isEmpty()) {
            return "No historical test records found for " + targetDescription + " in the selected time period.";
        }

        int count = points.size();
        HistoricalTestPointDto first = points.get(0);
        HistoricalTestPointDto latest = points.get(count - 1);

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%d historical test record(s) recorded for %s between %s and %s. ",
                count, targetDescription, first.getTestDate(), latest.getTestDate()));

        if (count > 1) {
            if (first.getCrudeProtein() != null && latest.getCrudeProtein() != null) {
                sb.append(String.format("Crude protein recorded at %s%% initially and %s%% most recently. ",
                        first.getCrudeProtein(), latest.getCrudeProtein()));
            }
            if (first.getMoisture() != null && latest.getMoisture() != null) {
                sb.append(String.format("Moisture recorded at %s%% initially and %s%% most recently. ",
                        first.getMoisture(), latest.getMoisture()));
            }
            if (first.getPh() != null && latest.getPh() != null) {
                sb.append(String.format("pH recorded at %s initially and %s most recently. ",
                        first.getPh(), latest.getPh()));
            }
        } else {
            if (latest.getCrudeProtein() != null) {
                sb.append(String.format("Crude protein: %s%%. ", latest.getCrudeProtein()));
            }
            if (latest.getMoisture() != null) {
                sb.append(String.format("Moisture: %s%%. ", latest.getMoisture()));
            }
            if (latest.getPh() != null) {
                sb.append(String.format("pH: %s. ", latest.getPh()));
            }
        }

        sb.append(String.format("Latest recorded quality status is %s with %s risk level.",
                latest.getQualityStatus(), latest.getRiskLevel()));

        return sb.toString().trim();
    }

    private Map<String, Long> initQualityStatusMap() {
        Map<String, Long> map = new LinkedHashMap<>();
        map.put("GOOD", 0L);
        map.put("ACCEPTABLE", 0L);
        map.put("NEEDS_ATTENTION", 0L);
        map.put("UNSAFE", 0L);
        map.put("INSUFFICIENT_DATA", 0L);
        return map;
    }

    private Map<String, Long> initRiskMap() {
        Map<String, Long> map = new LinkedHashMap<>();
        map.put("LOW", 0L);
        map.put("MEDIUM", 0L);
        map.put("HIGH", 0L);
        return map;
    }

    // ── Security & Ownership Validation ─────────────────────────

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
        throw new ResourceOwnershipException("Access denied: You do not have permission to access this animal's analytics");
    }

    private void validateFeedSampleAccess(FeedSample sample, User user) {
        if (securityUtils.isAdmin(user)) {
            return;
        }
        if (sample.getFarm() != null && sample.getFarm().getOwner().getId().equals(user.getId())) {
            return;
        }
        if (user.getRole() == Role.EXPERT) {
            Expert expert = expertRepository.findByUserId(user.getId()).orElse(null);
            if (expert != null) {
                boolean linked = consultationRepository.findByExpertId(expert.getId()).stream()
                        .anyMatch(c -> c.getFeedSample() != null && c.getFeedSample().getId().equals(sample.getId()));
                if (linked) {
                    return;
                }
            }
        }
        throw new ResourceOwnershipException("Access denied: You do not have permission to access this feed sample's history");
    }

    private void validateSilageSampleAccess(SilageSample sample, User user) {
        if (securityUtils.isAdmin(user)) {
            return;
        }
        if (sample.getFarm() != null && sample.getFarm().getOwner().getId().equals(user.getId())) {
            return;
        }
        if (user.getRole() == Role.EXPERT) {
            Expert expert = expertRepository.findByUserId(user.getId()).orElse(null);
            if (expert != null) {
                boolean linked = consultationRepository.findByExpertId(expert.getId()).stream()
                        .anyMatch(c -> c.getSilageSample() != null && c.getSilageSample().getId().equals(sample.getId()));
                if (linked) {
                    return;
                }
            }
        }
        throw new ResourceOwnershipException("Access denied: You do not have permission to access this silage sample's history");
    }
}
