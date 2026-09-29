package com.cattlefeedai.api.service.assessment;

import com.cattlefeedai.api.dto.assessment.AnimalHealthScreeningResponse;
import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.HealthObservation;
import com.cattlefeedai.api.entity.HealthRisk;
import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AppetiteStatus;
import com.cattlefeedai.api.entity.enums.FeedIntakeStatus;
import com.cattlefeedai.api.entity.enums.LactationStage;
import com.cattlefeedai.api.entity.enums.MilkProductionStatus;
import com.cattlefeedai.api.entity.enums.RiskLevel;
import com.cattlefeedai.api.entity.enums.RiskSource;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.HealthObservationRepository;
import com.cattlefeedai.api.repository.HealthRiskRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.repository.TestResultRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service providing nutritional and feed-related health risk screening for animals.
 * Explicitly maintains non-diagnostic language.
 */
@Service
@Transactional
public class AnimalHealthScreeningService {

    private final AnimalRepository animalRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final TestResultRepository testResultRepository;
    private final HealthObservationRepository healthObservationRepository;
    private final HealthRiskRepository healthRiskRepository;
    private final SecurityUtils securityUtils;

    public static final String HEALTH_SCREENING_DISCLAIMER =
            "Screening Disclaimer: Animal health risk screening correlates nutritional parameters and logged farmer observations. It identifies potential feed-related risk indicators and does NOT constitute a veterinary diagnosis.";

    public AnimalHealthScreeningService(
            AnimalRepository animalRepository,
            FeedSampleRepository feedSampleRepository,
            SilageSampleRepository silageSampleRepository,
            TestResultRepository testResultRepository,
            HealthObservationRepository healthObservationRepository,
            HealthRiskRepository healthRiskRepository,
            SecurityUtils securityUtils
    ) {
        this.animalRepository = animalRepository;
        this.feedSampleRepository = feedSampleRepository;
        this.silageSampleRepository = silageSampleRepository;
        this.testResultRepository = testResultRepository;
        this.healthObservationRepository = healthObservationRepository;
        this.healthRiskRepository = healthRiskRepository;
        this.securityUtils = securityUtils;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.cattlefeedai.api.repository.ExpertRepository expertRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.cattlefeedai.api.repository.ConsultationRepository consultationRepository;

    /**
     * Perform animal health risk screening.
     * If insufficient data exists, returns INSUFFICIENT_DATA and lists missing requirements.
     */
    public AnimalHealthScreeningResponse screenAnimalHealth(Long animalId) {
        User currentUser = securityUtils.getCurrentUser();

        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));

        boolean authorized = securityUtils.isAdmin(currentUser) ||
                (animal.getFarm() != null && animal.getFarm().getOwner().getId().equals(currentUser.getId()));

        if (!authorized && currentUser.getRole() == com.cattlefeedai.api.entity.enums.Role.EXPERT && expertRepository != null && consultationRepository != null) {
            com.cattlefeedai.api.entity.Expert expert = expertRepository.findByUserId(currentUser.getId()).orElse(null);
            if (expert != null) {
                authorized = consultationRepository.findByAnimalId(animal.getId()).stream()
                        .anyMatch(c -> c.getExpert() != null && c.getExpert().getId().equals(expert.getId()));
            }
        }

        if (!authorized) {
            throw new ResourceOwnershipException(
                    "Access denied: You do not have permission to perform health screening for this animal");
        }

        // Fetch related feed and silage tests
        List<FeedSample> feedSamples = feedSampleRepository.findByAnimalId(animalId);
        List<SilageSample> silageSamples = silageSampleRepository.findByAnimalId(animalId);

        List<TestResult> testResults = new ArrayList<>();
        for (FeedSample fs : feedSamples) {
            testResults.addAll(testResultRepository.findByFeedSampleId(fs.getId()));
        }
        for (SilageSample ss : silageSamples) {
            testResults.addAll(testResultRepository.findBySilageSampleId(ss.getId()));
        }

        List<HealthObservation> observations = healthObservationRepository.findByAnimalIdOrderByObservationDateDesc(animalId);

        // Check if sufficient data exists
        if (testResults.isEmpty() && observations.isEmpty()) {
            return AnimalHealthScreeningResponse.builder()
                    .animalId(animal.getId())
                    .animalTag(animal.getAnimalTag())
                    .screeningStatus("INSUFFICIENT_DATA")
                    .missingInformation(List.of(
                            "Feed or Silage test results for this animal",
                            "Farmer-logged health observations"
                    ))
                    .detectedRisks(new ArrayList<>())
                    .recentObservationsCount(0)
                    .recentTestResultsCount(0)
                    .dietaryAndHealthSummary("No feed tests or health observations available for this animal.")
                    .recommendationSummary("Record at least one feed/silage test or health observation to enable nutritional risk screening.")
                    .screeningTimestamp(LocalDateTime.now())
                    .disclaimer(HEALTH_SCREENING_DISCLAIMER)
                    .build();
        }

        List<RiskIndicatorDto> detectedRisks = new ArrayList<>();

        // 1. High yield lactation protein demand screening
        boolean isHighProducing = (animal.getLactationStage() == LactationStage.EARLY || animal.getLactationStage() == LactationStage.MID)
                && animal.getMilkProductionPerDay() != null
                && animal.getMilkProductionPerDay().compareTo(new BigDecimal("12.0")) >= 0;

        boolean hasLowProteinTest = testResults.stream()
                .anyMatch(t -> t.getCrudeProtein() != null && t.getCrudeProtein().compareTo(new BigDecimal("16.0")) < 0);

        if (isHighProducing && hasLowProteinTest) {
            detectedRisks.add(RiskIndicatorDto.builder()
                    .category(AdvisoryCategory.NUTRITION)
                    .riskTitle("Potential Nutritional Imbalance: Protein Deficit Risk for Lactation Yield")
                    .severity(Severity.WARNING)
                    .description("Animal is in high-demand lactation (" + animal.getLactationStage() + ", " + animal.getMilkProductionPerDay() + " L/day), while recent feed tests show crude protein below 16%.")
                    .mitigationRecommendation("Supplement with oil cakes, high-protein concentrate, or leguminous green fodder to prevent negative energy/protein balance.")
                    .build());
        }

        // 2. Reduced feed intake / appetite correlation with feed moisture/mould
        boolean hasReducedIntake = animal.getFeedIntakeStatus() == FeedIntakeStatus.REDUCED
                || observations.stream().anyMatch(o -> o.getAppetiteStatus() == AppetiteStatus.REDUCED);

        boolean hasFeedMouldOrMoisture = testResults.stream()
                .anyMatch(t -> Boolean.TRUE.equals(t.getMouldDetected()) || (t.getMoisture() != null && t.getMoisture().compareTo(new BigDecimal("14.0")) > 0));

        if (hasReducedIntake && hasFeedMouldOrMoisture) {
            detectedRisks.add(RiskIndicatorDto.builder()
                    .category(AdvisoryCategory.CONTAMINATION)
                    .riskTitle("Possible Feed-Related Concern: Appetite Reduction Linked to Feed Quality")
                    .severity(Severity.HIGH)
                    .description("Animal appetite or feed intake is reduced concurrently with elevated moisture or mould indications in recent feed tests.")
                    .mitigationRecommendation("Inspect feed bunks for heating or unpalatable feed. Discard spoiled feed and provide fresh, palatable forage.")
                    .build());
        }

        // 3. Milk drop indicator
        boolean hasMilkDrop = observations.stream()
                .anyMatch(o -> o.getMilkProductionStatus() == MilkProductionStatus.REDUCED);
        if (hasMilkDrop) {
            detectedRisks.add(RiskIndicatorDto.builder()
                    .category(AdvisoryCategory.HEALTH_SCREENING)
                    .riskTitle("Potential Production Risk: Decreased Milk Production Reported")
                    .severity(Severity.WARNING)
                    .description("Recent health observations noted a decrease in milk yield. Nutritional or subclinical factors may be present.")
                    .mitigationRecommendation("Review daily dry matter intake, water availability, and rule out subclinical mastitis or digestive discomfort.")
                    .build());
        }

        // Persist detected risks to HealthRisk table
        for (RiskIndicatorDto risk : detectedRisks) {
            HealthRisk healthRisk = new HealthRisk();
            healthRisk.setAnimal(animal);
            healthRisk.setRiskType(risk.getRiskTitle());
            healthRisk.setRiskLevel(risk.getSeverity() == Severity.HIGH || risk.getSeverity() == Severity.CRITICAL ? RiskLevel.HIGH : RiskLevel.MEDIUM);
            healthRisk.setDescription(risk.getDescription());
            healthRisk.setDetectedDate(LocalDate.now());
            healthRisk.setSource(RiskSource.RULE_BASED);
            healthRisk.setRecommendation(risk.getMitigationRecommendation());
            healthRiskRepository.save(healthRisk);
        }

        String screeningStatus = detectedRisks.isEmpty() ? "NORMAL" : "POTENTIAL_CONCERN";
        String summary = detectedRisks.isEmpty()
                ? "No immediate feed-related risk indicators detected based on available records."
                : "Identified " + detectedRisks.size() + " potential feed-related risk indicator(s) requiring attention.";

        List<String> missingInfo = new ArrayList<>();
        if (testResults.isEmpty()) {
            missingInfo.add("No feed or silage chemical tests recorded directly for this animal's batches");
        }
        if (observations.isEmpty()) {
            missingInfo.add("No recent health observations logged");
        }

        return AnimalHealthScreeningResponse.builder()
                .animalId(animal.getId())
                .animalTag(animal.getAnimalTag())
                .screeningStatus(screeningStatus)
                .missingInformation(missingInfo)
                .detectedRisks(detectedRisks)
                .recentObservationsCount(observations.size())
                .recentTestResultsCount(testResults.size())
                .dietaryAndHealthSummary(summary)
                .recommendationSummary(detectedRisks.isEmpty() ? "Continue regular feeding and health observation logging." : "Review indicated nutritional and storage mitigations.")
                .screeningTimestamp(LocalDateTime.now())
                .disclaimer(HEALTH_SCREENING_DISCLAIMER)
                .build();
    }
}
