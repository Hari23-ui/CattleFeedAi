package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.AnimalHealthScreeningResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.VisualScreeningRequest;
import com.cattlefeedai.api.dto.assessment.VisualScreeningResponse;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.HealthObservation;
import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AnalysisSource;
import com.cattlefeedai.api.entity.enums.AppetiteStatus;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.ComparisonOperator;
import com.cattlefeedai.api.entity.enums.FeedType;
import com.cattlefeedai.api.entity.enums.Gender;
import com.cattlefeedai.api.entity.enums.MilkProductionStatus;
import com.cattlefeedai.api.entity.enums.Priority;
import com.cattlefeedai.api.entity.enums.QualityStatus;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.entity.enums.SilageType;
import com.cattlefeedai.api.model.AssessmentRule;
import com.cattlefeedai.api.repository.AdvisoryRepository;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.HealthObservationRepository;
import com.cattlefeedai.api.repository.HealthRiskRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.repository.TestResultRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.assessment.AdvisoryService;
import com.cattlefeedai.api.service.assessment.AnimalHealthScreeningService;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import com.cattlefeedai.api.service.assessment.VisualScreeningService;
import com.cattlefeedai.api.service.rule.RuleEngineService;
import com.cattlefeedai.api.service.rule.RuleRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentEngineUnitTest {

    private RuleRegistry ruleRegistry;
    private RuleEngineService ruleEngineService;
    private QualityAssessmentService qualityAssessmentService;
    private RiskAssessmentService riskAssessmentService;
    private AdvisoryService advisoryService;
    private AnimalHealthScreeningService animalHealthScreeningService;
    private VisualScreeningService visualScreeningService;

    @Mock
    private AdvisoryRepository advisoryRepository;

    @Mock
    private AnimalRepository animalRepository;

    @Mock
    private HealthObservationRepository healthObservationRepository;

    @Mock
    private HealthRiskRepository healthRiskRepository;

    @Mock
    private FeedSampleRepository feedSampleRepository;

    @Mock
    private SilageSampleRepository silageSampleRepository;

    @Mock
    private TestResultRepository testResultRepository;

    private TestSecurityUtils securityUtils;

    private User testUser;
    private Farm testFarm;
    private Animal testAnimal;

    static class TestSecurityUtils extends SecurityUtils {
        private User currentUser;

        public TestSecurityUtils(User user) {
            super(null);
            this.currentUser = user;
        }

        public void setCurrentUser(User user) {
            this.currentUser = user;
        }

        @Override
        public User getCurrentUser() {
            return currentUser;
        }

        @Override
        public boolean isAdmin(User user) {
            return user != null && user.getRole() == Role.ADMIN;
        }
    }

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testfarmer");
        testUser.setRole(Role.FARMER);

        testFarm = new Farm();
        testFarm.setId(10L);
        testFarm.setFarmName("Sunrise Dairy Farm");
        testFarm.setOwner(testUser);

        testAnimal = new Animal();
        testAnimal.setId(100L);
        testAnimal.setAnimalTag("COW-001");
        testAnimal.setGender(Gender.FEMALE);
        testAnimal.setFarm(testFarm);

        securityUtils = new TestSecurityUtils(testUser);

        ruleRegistry = new RuleRegistry();
        ruleRegistry.initDefaultRules(); // Initialize 9 configurable rules with placeholder thresholds

        ruleEngineService = new RuleEngineService(ruleRegistry);
        qualityAssessmentService = new QualityAssessmentService(ruleEngineService);
        riskAssessmentService = new RiskAssessmentService(ruleEngineService);
        advisoryService = new AdvisoryService(advisoryRepository, animalRepository, securityUtils);
        animalHealthScreeningService = new AnimalHealthScreeningService(
                animalRepository, feedSampleRepository, silageSampleRepository,
                testResultRepository, healthObservationRepository, healthRiskRepository, securityUtils);
        visualScreeningService = new VisualScreeningService(
                testResultRepository, feedSampleRepository, silageSampleRepository, securityUtils);
    }

    @Test
    @DisplayName("Quality Assessment: Evaluates clean feed with all normal values as GOOD")
    void testAssessQuality_GoodFeed() {
        FeedSample sample = new FeedSample();
        sample.setId(201L);
        sample.setSampleCode("FS-201");
        sample.setFarm(testFarm);
        sample.setFeedType(FeedType.GREEN_FODDER);

        TestResult result = new TestResult();
        result.setId(501L);
        result.setFeedSample(sample);
        result.setTestDate(LocalDate.now());
        result.setAnalysisSource(AnalysisSource.LAB);
        result.setMoisture(new BigDecimal("12.0")); // below threshold 14.0
        result.setCrudeProtein(new BigDecimal("18.0")); // above threshold 16.0
        result.setAflatoxin(new BigDecimal("5.0")); // below threshold 20.0
        result.setMouldDetected(false);
        result.setSpoilageDetected(false);
        result.setAdulteration("NONE");

        QualityAssessmentResponse response = qualityAssessmentService.assessQuality(result);

        assertNotNull(response);
        assertEquals(QualityStatus.GOOD, response.getQualityStatus());
        assertEquals(0, response.getTriggeredRulesCount());
        assertTrue(response.getParameters().size() >= 3);
    }

    @Test
    @DisplayName("Quality Assessment: Multiple triggered rules and critical aflatoxin yields UNSAFE")
    void testAssessQuality_MultipleRules_AflatoxinCritical() {
        FeedSample sample = new FeedSample();
        sample.setId(202L);
        sample.setSampleCode("FS-202");
        sample.setFarm(testFarm);
        sample.setFeedType(FeedType.FEED_MASH);

        TestResult result = new TestResult();
        result.setId(502L);
        result.setFeedSample(sample);
        result.setTestDate(LocalDate.now());
        result.setAnalysisSource(AnalysisSource.LAB);
        result.setMoisture(new BigDecimal("18.5")); // triggers MOIST-001 (WARNING)
        result.setCrudeProtein(new BigDecimal("9.5")); // triggers CP-001 (WARNING)
        result.setAflatoxin(new BigDecimal("45.0")); // triggers AF-001 (CRITICAL)
        result.setMouldDetected(true); // triggers MOULD-001 (HIGH)
        result.setSpoilageDetected(true); // triggers SPOIL-001 (HIGH)

        QualityAssessmentResponse response = qualityAssessmentService.assessQuality(result);

        assertNotNull(response);
        assertEquals(QualityStatus.UNSAFE, response.getQualityStatus());
        assertTrue(response.getTriggeredRulesCount() >= 4);
        assertNotNull(response.getExplanation());
        assertTrue(response.getExplanation().contains("UNSAFE"));
    }

    @Test
    @DisplayName("Quality Assessment: Missing/null parameters are NOT treated as 0 or failed")
    void testAssessQuality_NullParameters_DoNotFail() {
        FeedSample sample = new FeedSample();
        sample.setId(203L);
        sample.setSampleCode("FS-203");
        sample.setFarm(testFarm);
        sample.setFeedType(FeedType.CATTLE_FEED_PELLET);

        // All chemical parameters null
        TestResult result = new TestResult();
        result.setId(503L);
        result.setFeedSample(sample);
        result.setTestDate(LocalDate.now());
        result.setAnalysisSource(AnalysisSource.LAB);
        // Moisture is null, Protein is null, Aflatoxin is null...

        QualityAssessmentResponse response = qualityAssessmentService.assessQuality(result);

        assertNotNull(response);
        assertEquals(QualityStatus.INSUFFICIENT_DATA, response.getQualityStatus());
        assertEquals(0, response.getTriggeredRulesCount());

        // Check that moisture is marked as NOT_AVAILABLE, not failed
        boolean moistureNotAvailable = response.getParameters().stream()
                .filter(p -> p.getParameter() == AssessmentParameter.MOISTURE)
                .findFirst()
                .map(p -> "NOT_AVAILABLE".equals(p.getStatus()))
                .orElse(false);
        assertTrue(moistureNotAvailable, "Null moisture must be marked as NOT_AVAILABLE");
    }

    @Test
    @DisplayName("Quality Assessment: Silage evaluation triggers Silage pH and Moisture rules")
    void testAssessQuality_SilageRules() {
        SilageSample silage = new SilageSample();
        silage.setId(301L);
        silage.setSampleCode("SS-301");
        silage.setSilageType(SilageType.MAIZE);
        silage.setFarm(testFarm);

        TestResult result = new TestResult();
        result.setId(601L);
        result.setSilageSample(silage);
        result.setTestDate(LocalDate.now());
        result.setAnalysisSource(AnalysisSource.LAB);
        result.setPh(new BigDecimal("5.5")); // Silage pH > 4.5 -> triggers SIL_PH rule
        result.setMoisture(new BigDecimal("75.0")); // Silage Moisture > 72.0% -> triggers SIL_MOIST rule

        QualityAssessmentResponse response = qualityAssessmentService.assessQuality(result);

        assertNotNull(response);
        assertEquals(QualityStatus.NEEDS_ATTENTION, response.getQualityStatus());
        assertTrue(response.getTriggeredRulesCount() >= 2);
    }

    @Test
    @DisplayName("Risk Assessment: Uses non-diagnostic terminology and classifies risk categories")
    void testRiskAssessment_NonDiagnosticTerminology() {
        FeedSample sample = new FeedSample();
        sample.setId(204L);
        sample.setSampleCode("FS-204");
        sample.setFarm(testFarm);
        sample.setFeedType(FeedType.GREEN_FODDER);

        TestResult result = new TestResult();
        result.setId(504L);
        result.setFeedSample(sample);
        result.setTestDate(LocalDate.now());
        result.setAnalysisSource(AnalysisSource.LAB);
        result.setAflatoxin(new BigDecimal("35.0"));
        result.setMouldDetected(true);
        result.setSpoilageDetected(true);
        result.setCrudeProtein(new BigDecimal("11.0"));

        RiskAssessmentResponse response = riskAssessmentService.assessRisk(result);

        assertNotNull(response);
        assertTrue(response.getContaminationRisks().size() > 0);
        assertTrue(response.getStorageSpoilageRisks().size() > 0);
        assertTrue(response.getNutritionalImbalances().size() > 0);

        // Verify non-diagnostic terminology
        for (var risk : response.getAllRisks()) {
            assertFalse(risk.getRiskTitle().toLowerCase().contains("diagnosed disease"),
                    "Terminology must be non-diagnostic");
            assertTrue(risk.getRiskTitle().contains("Potential Risk")
                    || risk.getRiskTitle().contains("Risk Indicator")
                    || risk.getRiskTitle().contains("Possible Feed-Related Concern")
                    || risk.getRiskTitle().contains("Potential Storage/Spoilage Risk")
                    || risk.getRiskTitle().contains("Potential Nutritional Imbalance"));
        }
    }

    @Test
    @DisplayName("Animal Health Screening: Returns INSUFFICIENT_DATA when no records exist")
    void testAnimalHealthScreening_InsufficientData() {
        when(animalRepository.findById(100L)).thenReturn(Optional.of(testAnimal));
        when(healthObservationRepository.findByAnimalIdOrderByObservationDateDesc(100L))
                .thenReturn(Collections.emptyList());
        when(feedSampleRepository.findByAnimalId(100L)).thenReturn(Collections.emptyList());
        when(silageSampleRepository.findByAnimalId(100L)).thenReturn(Collections.emptyList());

        AnimalHealthScreeningResponse response = animalHealthScreeningService.screenAnimalHealth(100L);

        assertNotNull(response);
        assertEquals("INSUFFICIENT_DATA", response.getScreeningStatus());
        assertTrue(response.getDetectedRisks().isEmpty());
        assertFalse(response.getMissingInformation().isEmpty());
    }

    @Test
    @DisplayName("Animal Health Screening: Correlates reduced feed intake with high moisture feed")
    void testAnimalHealthScreening_Correlation() {
        when(animalRepository.findById(100L)).thenReturn(Optional.of(testAnimal));

        // Observation: reduced feed intake
        HealthObservation obs = new HealthObservation();
        obs.setId(801L);
        obs.setAnimal(testAnimal);
        obs.setObservationDate(LocalDate.now());
        obs.setAppetiteStatus(AppetiteStatus.REDUCED);
        obs.setMilkProductionStatus(MilkProductionStatus.REDUCED);
        when(healthObservationRepository.findByAnimalIdOrderByObservationDateDesc(100L))
                .thenReturn(List.of(obs));

        // Feed sample with high moisture
        FeedSample feed = new FeedSample();
        feed.setId(205L);
        feed.setSampleCode("FS-205");
        feed.setFeedType(FeedType.GREEN_FODDER);
        feed.setAnimal(testAnimal);
        feed.setFarm(testFarm);
        when(feedSampleRepository.findByAnimalId(100L)).thenReturn(List.of(feed));

        TestResult testResult = new TestResult();
        testResult.setId(505L);
        testResult.setFeedSample(feed);
        testResult.setMoisture(new BigDecimal("18.0"));
        testResult.setMouldDetected(true);
        when(testResultRepository.findByFeedSampleId(205L))
                .thenReturn(List.of(testResult));

        AnimalHealthScreeningResponse response = animalHealthScreeningService.screenAnimalHealth(100L);

        assertNotNull(response);
        assertEquals("POTENTIAL_CONCERN", response.getScreeningStatus());
        assertTrue(response.getDetectedRisks().size() >= 2);
        assertTrue(response.getDisclaimer().contains("does NOT constitute a veterinary diagnosis"));
    }

    @Test
    @DisplayName("Visual Screening: Payload ingestion is marked VISUAL SCREENING ONLY and does not assert chemical values")
    void testVisualScreening_Ingestion() {
        FeedSample sample = new FeedSample();
        sample.setId(206L);
        sample.setSampleCode("FS-206");
        sample.setFeedType(FeedType.GREEN_FODDER);
        sample.setFarm(testFarm);

        when(feedSampleRepository.findById(206L)).thenReturn(Optional.of(sample));
        when(testResultRepository.save(any(TestResult.class))).thenAnswer(invocation -> {
            TestResult tr = invocation.getArgument(0);
            tr.setId(999L);
            return tr;
        });

        VisualScreeningRequest request = new VisualScreeningRequest();
        request.setFeedSampleId(206L);
        request.setImageReference("https://storage.cattlefeedai.com/uploads/cam_feed_001.jpg");
        request.setVisualQualityIndicators(List.of("Surface discolouration observed near upper layer"));
        request.setMouldIndication(true);
        request.setSpoilageIndication(false);
        request.setVisibleForeignMaterialIndication(false);
        request.setConfidenceScore(new BigDecimal("0.88"));
        request.setAnalysisTimestamp(LocalDateTime.now());

        VisualScreeningResponse response = visualScreeningService.ingestVisualScreening(request);

        assertNotNull(response);
        assertTrue(response.getMouldDetected());
        assertEquals("ABNORMAL", response.getVisualStatus());
        assertNotNull(response.getDisclaimer());
        assertTrue(response.getDisclaimer().contains("VISUAL SCREENING ONLY"));
    }

    @Test
    @DisplayName("Advisory Service: Generates and maps priorities correctly")
    void testAdvisoryGeneration() {
        var risks = List.of(
                com.cattlefeedai.api.dto.assessment.RiskIndicatorDto.builder()
                        .category(AdvisoryCategory.CONTAMINATION)
                        .riskTitle("Potential Risk: Elevated Aflatoxin Detected")
                        .severity(Severity.CRITICAL)
                        .description("Aflatoxin exceeds safety limit.")
                        .mitigationRecommendation("Stop feeding immediately.")
                        .build(),
                com.cattlefeedai.api.dto.assessment.RiskIndicatorDto.builder()
                        .category(AdvisoryCategory.NUTRITION)
                        .riskTitle("Possible Feed-Related Concern: Low Crude Protein")
                        .severity(Severity.WARNING)
                        .description("Crude protein is lower than recommended.")
                        .mitigationRecommendation("Supplement with protein-rich oilseed cake.")
                        .build()
        );

        List<AdvisoryResponse> advisories = advisoryService.generateAdvisories(null, risks, 1001L);

        assertEquals(2, advisories.size());
        assertEquals(Priority.HIGH, advisories.get(0).getPriority());
        assertEquals(Priority.MEDIUM, advisories.get(1).getPriority());
        assertEquals(AdvisoryCategory.CONTAMINATION, advisories.get(0).getCategory());
        assertEquals(AdvisoryCategory.NUTRITION, advisories.get(1).getCategory());
    }

    @Test
    @DisplayName("Rule Engine: Threshold configuration supports non-hardcoded rules")
    void testRuleRegistry_ConfigurableArchitecture() {
        AssessmentRule customRule = AssessmentRule.builder()
                .ruleCode("CUSTOM-001")
                .sampleType("FEED")
                .parameter(AssessmentParameter.CRUDE_PROTEIN)
                .operator(ComparisonOperator.GREATER_THAN)
                .thresholdValue(30.0)
                .severity(Severity.INFO)
                .message("High protein feed detected.")
                .recommendation("Ensure adequate water supply.")
                .active(true)
                .note("Custom placeholder test rule")
                .build();

        ruleRegistry.registerRule(customRule);

        List<AssessmentRule> feedRules = ruleRegistry.getRulesForSampleTypeAndParameter("FEED", AssessmentParameter.CRUDE_PROTEIN);
        assertTrue(feedRules.stream().anyMatch(r -> "CUSTOM-001".equals(r.getRuleCode())));
    }
}
