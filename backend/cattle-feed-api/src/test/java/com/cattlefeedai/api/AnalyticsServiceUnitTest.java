package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.analytics.AnimalAnalyticsResponse;
import com.cattlefeedai.api.dto.analytics.FarmAnalyticsSummaryResponse;
import com.cattlefeedai.api.dto.analytics.HistoricalTestPointDto;
import com.cattlefeedai.api.dto.analytics.SampleHistoricalTrendsResponse;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.*;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.AnalyticsService;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import com.cattlefeedai.api.service.rule.RuleEngineService;
import com.cattlefeedai.api.service.rule.RuleRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class AnalyticsServiceUnitTest {

    private TestResultRepository testResultRepository;
    private FeedSampleRepository feedSampleRepository;
    private SilageSampleRepository silageSampleRepository;
    private AnimalRepository animalRepository;
    private FarmRepository farmRepository;
    private AdvisoryRepository advisoryRepository;
    private ConsultationRepository consultationRepository;
    private HealthRiskRepository healthRiskRepository;
    private ExpertRepository expertRepository;

    private RuleRegistry ruleRegistry;
    private RuleEngineService ruleEngineService;
    private QualityAssessmentService qualityAssessmentService;
    private RiskAssessmentService riskAssessmentService;
    private TestSecurityUtils securityUtils;

    private AnalyticsService analyticsService;

    private User farmerA;
    private User farmerB;
    private Farm farmA;
    private Animal animalA;
    private FeedSample feedSampleA;
    private SilageSample silageSampleA;

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
            if (currentUser == null) {
                throw new ResourceOwnershipException("User is not authenticated");
            }
            return currentUser;
        }

        @Override
        public boolean isAdmin(User user) {
            return user != null && user.getRole() == Role.ADMIN;
        }
    }

    @BeforeEach
    void setUp() {
        testResultRepository = mock(TestResultRepository.class);
        feedSampleRepository = mock(FeedSampleRepository.class);
        silageSampleRepository = mock(SilageSampleRepository.class);
        animalRepository = mock(AnimalRepository.class);
        farmRepository = mock(FarmRepository.class);
        advisoryRepository = mock(AdvisoryRepository.class);
        consultationRepository = mock(ConsultationRepository.class);
        healthRiskRepository = mock(HealthRiskRepository.class);
        expertRepository = mock(ExpertRepository.class);

        // Real assessment engine integration
        ruleRegistry = new RuleRegistry();
        ruleRegistry.initDefaultRules();
        ruleEngineService = new RuleEngineService(ruleRegistry);
        qualityAssessmentService = new QualityAssessmentService(ruleEngineService);
        riskAssessmentService = new RiskAssessmentService(ruleEngineService);

        farmerA = new User();
        farmerA.setId(1L);
        farmerA.setEmail("farmerA@test.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(2L);
        farmerB.setEmail("farmerB@test.com");
        farmerB.setRole(Role.FARMER);

        farmA = new Farm();
        farmA.setId(10L);
        farmA.setFarmName("Green Pastures");
        farmA.setOwner(farmerA);

        animalA = new Animal();
        animalA.setId(100L);
        animalA.setAnimalTag("COW-001");
        animalA.setName("Bessie");
        animalA.setBreed("Holstein");
        animalA.setGender(Gender.FEMALE);
        animalA.setWeight(new BigDecimal("550.00"));
        animalA.setFarm(farmA);

        feedSampleA = new FeedSample();
        feedSampleA.setId(200L);
        feedSampleA.setSampleCode("FS-001");
        feedSampleA.setFeedType(FeedType.CATTLE_FEED_PELLET);
        feedSampleA.setSampleDate(LocalDate.now().minusDays(10));
        feedSampleA.setFarm(farmA);
        feedSampleA.setAnimal(animalA);

        silageSampleA = new SilageSample();
        silageSampleA.setId(300L);
        silageSampleA.setSampleCode("SS-001");
        silageSampleA.setSilageType(SilageType.MAIZE);
        silageSampleA.setSampleDate(LocalDate.now().minusDays(12));
        silageSampleA.setFarm(farmA);
        silageSampleA.setAnimal(animalA);

        securityUtils = new TestSecurityUtils(farmerA);

        analyticsService = new AnalyticsService(
                testResultRepository,
                feedSampleRepository,
                silageSampleRepository,
                animalRepository,
                farmRepository,
                advisoryRepository,
                consultationRepository,
                healthRiskRepository,
                expertRepository,
                securityUtils,
                qualityAssessmentService,
                riskAssessmentService
        );
    }

    private TestResult createMockTestResult(Long id, LocalDate date, BigDecimal protein, BigDecimal moisture) {
        TestResult tr = new TestResult();
        tr.setId(id);
        tr.setTestDate(date);
        tr.setCrudeProtein(protein);
        tr.setMoisture(moisture);
        tr.setFeedSample(feedSampleA);
        tr.setAnalysisSource(AnalysisSource.LAB);
        tr.setConfidenceScore(new BigDecimal("95.00"));
        return tr;
    }

    // 1. Farmer Summary
    @Test
    void test1_FarmerSummary_ReturnsCorrectCounts() {
        when(animalRepository.findByFarmOwnerId(1L)).thenReturn(List.of(animalA));
        when(feedSampleRepository.findByFarmOwnerId(1L)).thenReturn(List.of(feedSampleA));
        when(silageSampleRepository.findByFarmOwnerId(1L)).thenReturn(List.of(silageSampleA));

        // Normal parameters (moisture 12.0%, protein 18.0%) -> GOOD quality, LOW risk
        TestResult tr = createMockTestResult(1L, LocalDate.now().minusDays(2), new BigDecimal("18.0"), new BigDecimal("12.0"));
        when(testResultRepository.findByOwnerId(1L)).thenReturn(List.of(tr));
        when(advisoryRepository.findByAnimalFarmOwnerIdAndIsRead(1L, false)).thenReturn(Collections.emptyList());
        when(consultationRepository.findByFarmerId(1L)).thenReturn(Collections.emptyList());

        FarmAnalyticsSummaryResponse summary = analyticsService.getFarmSummary(null);

        assertNotNull(summary);
        assertEquals(1, summary.getTotalAnimals());
        assertEquals(1, summary.getTotalFeedSamples());
        assertEquals(1, summary.getTotalSilageSamples());
        assertEquals(1, summary.getTotalTestResults());
        assertEquals(0, summary.getTotalActiveAdvisories());
        assertEquals(0, summary.getTotalConsultations());
        assertEquals(1L, summary.getQualityStatusDistribution().get("GOOD"));
        assertEquals(1L, summary.getRiskDistribution().get("LOW"));
        assertNotNull(summary.getDisclaimer());
    }

    // 2. Farmer Ownership Filtering
    @Test
    void test2_FarmerOwnershipFiltering_OnlyIncludesOwnRecords() {
        when(animalRepository.findByFarmOwnerId(1L)).thenReturn(List.of(animalA));
        when(feedSampleRepository.findByFarmOwnerId(1L)).thenReturn(List.of(feedSampleA));
        when(silageSampleRepository.findByFarmOwnerId(1L)).thenReturn(Collections.emptyList());
        when(testResultRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());
        when(advisoryRepository.findByAnimalFarmOwnerIdAndIsRead(1L, false)).thenReturn(Collections.emptyList());
        when(consultationRepository.findByFarmerId(1L)).thenReturn(Collections.emptyList());

        FarmAnalyticsSummaryResponse summary = analyticsService.getFarmSummary(null);

        assertEquals(1, summary.getTotalAnimals());
        assertEquals(1, summary.getTotalFeedSamples());
        assertEquals(0, summary.getTotalSilageSamples());
        verify(animalRepository, times(1)).findByFarmOwnerId(1L);
        verify(animalRepository, never()).findAll();
    }

    // 3. Animal Analytics
    @Test
    void test3_AnimalAnalytics_ReturnsAnimalSummaryAndHistory() {
        when(animalRepository.findById(100L)).thenReturn(Optional.of(animalA));

        TestResult tr = createMockTestResult(1L, LocalDate.now().minusDays(3), new BigDecimal("18.0"), new BigDecimal("12.5"));
        when(testResultRepository.findByAnimalIdOrderByTestDateAsc(100L)).thenReturn(List.of(tr));
        when(advisoryRepository.findByAnimalIdAndIsReadFalse(100L)).thenReturn(Collections.emptyList());
        when(healthRiskRepository.findByAnimalId(100L)).thenReturn(Collections.emptyList());
        when(consultationRepository.findByAnimalId(100L)).thenReturn(Collections.emptyList());

        AnimalAnalyticsResponse resp = analyticsService.getAnimalAnalytics(100L, null);

        assertNotNull(resp);
        assertEquals(100L, resp.getAnimalId());
        assertEquals("COW-001", resp.getAnimalTag());
        assertEquals(1, resp.getTotalTestResults());
        assertEquals(1, resp.getTotalFeedTests());
        assertEquals(0, resp.getTotalSilageTests());
        assertNotNull(resp.getLatestMeasurements());
        assertEquals(new BigDecimal("18.0"), resp.getLatestMeasurements().getCrudeProtein());
        assertEquals("GOOD", resp.getLatestMeasurements().getQualityStatus());
        assertNotNull(resp.getDescriptiveSummary());
    }

    // 4. Feed History
    @Test
    void test4_FeedHistory_ReturnsChronologicalMeasurements() {
        when(feedSampleRepository.findById(200L)).thenReturn(Optional.of(feedSampleA));

        TestResult tr1 = createMockTestResult(1L, LocalDate.now().minusDays(5), new BigDecimal("17.0"), new BigDecimal("11.0"));
        TestResult tr2 = createMockTestResult(2L, LocalDate.now().minusDays(1), new BigDecimal("18.5"), new BigDecimal("12.0"));
        when(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(200L)).thenReturn(List.of(tr1, tr2));

        SampleHistoricalTrendsResponse resp = analyticsService.getFeedSampleHistory(200L, null);

        assertNotNull(resp);
        assertEquals(200L, resp.getSampleId());
        assertEquals("FEED", resp.getSampleType());
        assertEquals(2, resp.getTotalTestPoints());
        assertEquals(new BigDecimal("17.0"), resp.getTestPoints().get(0).getCrudeProtein());
        assertEquals(new BigDecimal("18.5"), resp.getTestPoints().get(1).getCrudeProtein());
    }

    // 5. Silage History
    @Test
    void test5_SilageHistory_ReturnsChronologicalMeasurements() {
        when(silageSampleRepository.findById(300L)).thenReturn(Optional.of(silageSampleA));

        TestResult tr = new TestResult();
        tr.setId(5L);
        tr.setTestDate(LocalDate.now().minusDays(3));
        tr.setPh(new BigDecimal("3.9"));
        tr.setMoisture(new BigDecimal("65.0"));
        tr.setSilageSample(silageSampleA);

        when(testResultRepository.findBySilageSampleIdOrderByTestDateAsc(300L)).thenReturn(List.of(tr));

        SampleHistoricalTrendsResponse resp = analyticsService.getSilageSampleHistory(300L, null);

        assertNotNull(resp);
        assertEquals("SILAGE", resp.getSampleType());
        assertEquals(1, resp.getTotalTestPoints());
        assertEquals(new BigDecimal("3.9"), resp.getTestPoints().get(0).getPh());
        assertEquals(new BigDecimal("65.0"), resp.getTestPoints().get(0).getMoisture());
    }

    // 6. Quality Status History
    @Test
    void test6_QualityStatusHistory_IntegratesWithQualityAssessment() {
        when(feedSampleRepository.findById(200L)).thenReturn(Optional.of(feedSampleA));

        // Moisture 18% is above safe storage threshold (14.0%) -> triggers WARNING -> NEEDS_ATTENTION
        TestResult tr = createMockTestResult(10L, LocalDate.now().minusDays(2), new BigDecimal("17.0"), new BigDecimal("18.0"));
        when(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(200L)).thenReturn(List.of(tr));

        SampleHistoricalTrendsResponse resp = analyticsService.getFeedSampleHistory(200L, null);

        assertEquals(1, resp.getQualityStatusDistribution().get("NEEDS_ATTENTION"));
        assertEquals("NEEDS_ATTENTION", resp.getTestPoints().get(0).getQualityStatus());
        assertEquals(1, resp.getTestPoints().get(0).getTriggeredRulesCount());
    }

    // 7. Risk History
    @Test
    void test7_RiskHistory_IntegratesWithRiskAssessment() {
        when(animalRepository.findByFarmOwnerId(1L)).thenReturn(List.of(animalA));
        when(feedSampleRepository.findByFarmOwnerId(1L)).thenReturn(List.of(feedSampleA));
        when(silageSampleRepository.findByFarmOwnerId(1L)).thenReturn(Collections.emptyList());

        // Aflatoxin 35 ppb exceeds threshold (20 ppb) -> CRITICAL CONTAMINATION -> HIGH risk
        TestResult tr = new TestResult();
        tr.setId(15L);
        tr.setTestDate(LocalDate.now().minusDays(1));
        tr.setFeedSample(feedSampleA);
        tr.setAflatoxin(new BigDecimal("35.0"));
        when(testResultRepository.findByOwnerId(1L)).thenReturn(List.of(tr));
        when(advisoryRepository.findByAnimalFarmOwnerIdAndIsRead(1L, false)).thenReturn(Collections.emptyList());
        when(consultationRepository.findByFarmerId(1L)).thenReturn(Collections.emptyList());

        FarmAnalyticsSummaryResponse resp = analyticsService.getFarmSummary(null);

        assertEquals(1L, resp.getRiskDistribution().get("HIGH"));
        assertEquals(1L, resp.getContaminationRiskCount());
    }

    // 8. Date Filtering
    @Test
    void test8_DateFiltering_RespectsDaysParameter() {
        when(animalRepository.findByFarmOwnerId(1L)).thenReturn(List.of(animalA));
        when(feedSampleRepository.findByFarmOwnerId(1L)).thenReturn(List.of(feedSampleA));
        when(silageSampleRepository.findByFarmOwnerId(1L)).thenReturn(Collections.emptyList());
        when(advisoryRepository.findByAnimalFarmOwnerIdAndIsRead(1L, false)).thenReturn(Collections.emptyList());
        when(consultationRepository.findByFarmerId(1L)).thenReturn(Collections.emptyList());

        when(testResultRepository.findByOwnerIdAndStartDate(eq(1L), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        FarmAnalyticsSummaryResponse summary = analyticsService.getFarmSummary(30);

        assertEquals(30, summary.getDaysFilter());
        verify(testResultRepository, times(1)).findByOwnerIdAndStartDate(eq(1L), any(LocalDate.class));
        verify(testResultRepository, never()).findByOwnerId(1L);
    }

    // 9. Null Measurement Handling
    @Test
    void test9_NullMeasurementHandling_PreservesNullsWithoutDefaultingToZero() {
        TestResult tr = new TestResult();
        tr.setId(50L);
        tr.setTestDate(LocalDate.now());
        tr.setFeedSample(feedSampleA);
        // All measurements left null
        tr.setCrudeProtein(null);
        tr.setMoisture(null);
        tr.setFiber(null);
        tr.setPh(null);
        tr.setAflatoxin(null);

        HistoricalTestPointDto dto = analyticsService.mapToHistoricalTestPointDto(tr);

        assertNotNull(dto);
        assertNull(dto.getCrudeProtein(), "Null crude protein must NOT be converted to 0");
        assertNull(dto.getMoisture(), "Null moisture must NOT be converted to 0");
        assertNull(dto.getFiber(), "Null fiber must NOT be converted to 0");
        assertNull(dto.getPh(), "Null pH must NOT be converted to 0");
        assertNull(dto.getAflatoxin(), "Null aflatoxin must NOT be converted to 0");
        assertEquals("INSUFFICIENT_DATA", dto.getQualityStatus());
    }

    // 10. 401 Unauthorized
    @Test
    void test10_Unauthorized_ThrowsExceptionWhenUserNotAuthenticated() {
        securityUtils.setCurrentUser(null);

        assertThrows(ResourceOwnershipException.class, () -> {
            analyticsService.getFarmSummary(null);
        });
    }

    // 11. 403 Cross-Owner Access
    @Test
    void test11_CrossOwnerAccess_Throws403ResourceOwnershipException() {
        securityUtils.setCurrentUser(farmerB);
        when(animalRepository.findById(100L)).thenReturn(Optional.of(animalA));
        when(feedSampleRepository.findById(200L)).thenReturn(Optional.of(feedSampleA));

        assertThrows(ResourceOwnershipException.class, () -> {
            analyticsService.getAnimalAnalytics(100L, null);
        });

        assertThrows(ResourceOwnershipException.class, () -> {
            analyticsService.getFeedSampleHistory(200L, null);
        });
    }

    // 12. 404 Missing Resource
    @Test
    void test12_MissingResource_Throws404ResourceNotFoundException() {
        when(animalRepository.findById(999L)).thenReturn(Optional.empty());
        when(feedSampleRepository.findById(999L)).thenReturn(Optional.empty());
        when(silageSampleRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            analyticsService.getAnimalAnalytics(999L, null);
        });

        assertThrows(ResourceNotFoundException.class, () -> {
            analyticsService.getFeedSampleHistory(999L, null);
        });

        assertThrows(ResourceNotFoundException.class, () -> {
            analyticsService.getSilageSampleHistory(999L, null);
        });
    }

    // 13. No Fake Data
    @Test
    void test13_NoFakeData_DoesNotGenerateSyntheticRecords() {
        when(feedSampleRepository.findById(200L)).thenReturn(Optional.of(feedSampleA));
        when(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(200L)).thenReturn(Collections.emptyList());

        SampleHistoricalTrendsResponse resp = analyticsService.getFeedSampleHistory(200L, null);

        assertNotNull(resp);
        assertEquals(0, resp.getTotalTestPoints(), "Must not invent synthetic test points");
        assertTrue(resp.getTestPoints().isEmpty(), "Points array must be genuinely empty");
    }

    // 14. Empty History
    @Test
    void test14_EmptyHistory_ReturnsCleanEmptyStateWithDescriptiveSummary() {
        when(animalRepository.findById(100L)).thenReturn(Optional.of(animalA));
        when(testResultRepository.findByAnimalIdOrderByTestDateAsc(100L)).thenReturn(Collections.emptyList());
        when(advisoryRepository.findByAnimalIdAndIsReadFalse(100L)).thenReturn(Collections.emptyList());
        when(healthRiskRepository.findByAnimalId(100L)).thenReturn(Collections.emptyList());
        when(consultationRepository.findByAnimalId(100L)).thenReturn(Collections.emptyList());

        AnimalAnalyticsResponse resp = analyticsService.getAnimalAnalytics(100L, null);

        assertNotNull(resp);
        assertEquals(0, resp.getTotalTestResults());
        assertNull(resp.getLatestMeasurements());
        assertTrue(resp.getTestHistory().isEmpty());
        assertTrue(resp.getDescriptiveSummary().contains("No historical test records found"));
    }

    // 15. Multiple Historical Test Results
    @Test
    void test15_MultipleHistoricalTestResults_MaintainsAscendingOrderAndTrend() {
        when(feedSampleRepository.findById(200L)).thenReturn(Optional.of(feedSampleA));

        TestResult tr1 = createMockTestResult(1L, LocalDate.now().minusDays(10), new BigDecimal("17.0"), new BigDecimal("10.0"));
        TestResult tr2 = createMockTestResult(2L, LocalDate.now().minusDays(5), new BigDecimal("17.5"), new BigDecimal("11.5"));
        TestResult tr3 = createMockTestResult(3L, LocalDate.now().minusDays(1), new BigDecimal("18.0"), new BigDecimal("13.0"));

        when(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(200L)).thenReturn(List.of(tr1, tr2, tr3));

        SampleHistoricalTrendsResponse resp = analyticsService.getFeedSampleHistory(200L, null);

        assertEquals(3, resp.getTotalTestPoints());
        assertEquals(LocalDate.now().minusDays(10), resp.getTestPoints().get(0).getTestDate());
        assertEquals(LocalDate.now().minusDays(1), resp.getTestPoints().get(2).getTestDate());
        assertTrue(resp.getDescriptiveSummary().contains("3 historical test record(s)"));
        assertTrue(resp.getDescriptiveSummary().contains("Crude protein recorded at 17.0% initially and 18.0% most recently"));
    }

    // 16. Existing Assessment Integration
    @Test
    void test16_ExistingAssessmentIntegration_TriggersRulesProperly() {
        when(feedSampleRepository.findById(200L)).thenReturn(Optional.of(feedSampleA));

        // Moisture 18.0% (triggers RULE_FEED_MOISTURE_HIGH) and crude protein 12.0% (triggers RULE_FEED_PROTEIN_LOW)
        TestResult tr = createMockTestResult(1L, LocalDate.now(), new BigDecimal("12.0"), new BigDecimal("18.0"));
        when(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(200L)).thenReturn(List.of(tr));

        SampleHistoricalTrendsResponse resp = analyticsService.getFeedSampleHistory(200L, null);

        HistoricalTestPointDto point = resp.getTestPoints().get(0);
        assertEquals("NEEDS_ATTENTION", point.getQualityStatus());
        assertEquals("MEDIUM", point.getRiskLevel());
        assertEquals(2, point.getTriggeredRulesCount());
    }
}
