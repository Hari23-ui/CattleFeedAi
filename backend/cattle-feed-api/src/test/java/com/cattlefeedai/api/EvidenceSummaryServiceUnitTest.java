package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.AnimalResponse;
import com.cattlefeedai.api.dto.FeedPlanResponse;
import com.cattlefeedai.api.dto.ai.AiServiceInfoResponse;
import com.cattlefeedai.api.dto.analytics.AnimalAnalyticsResponse;
import com.cattlefeedai.api.dto.analytics.HistoricalTestPointDto;
import com.cattlefeedai.api.dto.assessment.AnimalHealthScreeningResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.evidence.EvidenceSummaryResponse;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.*;
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
import com.cattlefeedai.api.service.evidence.EvidenceSummaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class EvidenceSummaryServiceUnitTest {

    private AnimalRepository animalRepository;
    private FeedSampleRepository feedSampleRepository;
    private SilageSampleRepository silageSampleRepository;
    private TestResultRepository testResultRepository;
    private SampleImageRepository sampleImageRepository;
    private ConsultationRepository consultationRepository;
    private ExpertRepository expertRepository;
    private FeedPlanRepository feedPlanRepository;
    private AdvisoryRepository advisoryRepository;

    private TestQualityAssessmentService qualityAssessmentService;
    private TestRiskAssessmentService riskAssessmentService;
    private TestAnimalHealthScreeningService animalHealthScreeningService;
    private TestAiServiceClient aiServiceClient;
    private TestAnalyticsService analyticsService;
    private TestFeedPlanService feedPlanService;
    private TestSecurityUtils securityUtils;

    private EvidenceSummaryService evidenceSummaryService;

    private User farmerA;
    private User farmerB;
    private User expertUserA;
    private User expertUserB;
    private Expert expertA;
    private Expert expertB;
    private Farm farmA;
    private Farm farmB;
    private Animal animalA;
    private Animal animalB;
    private FeedSample feedA;
    private SilageSample silageA;
    private TestResult testResultA;
    private Consultation consultationA;
    private FeedPlan planA;
    private Advisory advisoryA;

    // ── Test Stubs ──────────────────────────────────────────────

    static class TestQualityAssessmentService extends QualityAssessmentService {
        private QualityAssessmentResponse stubResponse;

        public TestQualityAssessmentService() {
            super(null);
        }

        public void setStubResponse(QualityAssessmentResponse resp) {
            this.stubResponse = resp;
        }

        @Override
        public QualityAssessmentResponse assessQuality(TestResult testResult) {
            return stubResponse;
        }
    }

    static class TestRiskAssessmentService extends RiskAssessmentService {
        private RiskAssessmentResponse stubResponse;

        public TestRiskAssessmentService() {
            super(null);
        }

        public void setStubResponse(RiskAssessmentResponse resp) {
            this.stubResponse = resp;
        }

        @Override
        public RiskAssessmentResponse assessRisk(TestResult testResult) {
            return stubResponse;
        }
    }

    static class TestAnimalHealthScreeningService extends AnimalHealthScreeningService {
        private AnimalHealthScreeningResponse stubResponse;

        public TestAnimalHealthScreeningService() {
            super(null, null, null, null, null, null, null);
        }

        public void setStubResponse(AnimalHealthScreeningResponse resp) {
            this.stubResponse = resp;
        }

        @Override
        public AnimalHealthScreeningResponse screenAnimalHealth(Long animalId) {
            return stubResponse;
        }
    }

    static class TestAiServiceClient extends AiServiceClient {
        private AiServiceInfoResponse stubInfo;

        public TestAiServiceClient() {
            super("http://localhost:8000", 1000);
        }

        public void setStubInfo(AiServiceInfoResponse stubInfo) {
            this.stubInfo = stubInfo;
        }

        @Override
        public AiServiceInfoResponse getServiceInfo() {
            return stubInfo;
        }
    }

    static class TestAnalyticsService extends AnalyticsService {
        private AnimalAnalyticsResponse stubAnalytics;

        public TestAnalyticsService() {
            super(null, null, null, null, null, null, null, null, null, null, null, null);
        }

        public void setStubAnalytics(AnimalAnalyticsResponse resp) {
            this.stubAnalytics = resp;
        }

        @Override
        public AnimalAnalyticsResponse getAnimalAnalytics(Long animalId, Integer days) {
            return stubAnalytics;
        }
    }

    static class TestFeedPlanService extends FeedPlanService {
        public TestFeedPlanService() {
            super(null, null, null, null, null, null, null, null, null);
        }

        @Override
        public FeedPlanResponse toResponse(FeedPlan plan) {
            if (plan == null) return null;
            return FeedPlanResponse.builder()
                    .id(plan.getId())
                    .planName(plan.getPlanName())
                    .status(plan.getStatus())
                    .plannedQuantity(plan.getPlannedQuantity())
                    .frequency(plan.getFrequency())
                    .build();
        }
    }

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
            return this.currentUser;
        }

        @Override
        public boolean isAdmin(User user) {
            return user != null && user.getRole() == Role.ADMIN;
        }
    }

    @BeforeEach
    void setUp() {
        animalRepository = mock(AnimalRepository.class);
        feedSampleRepository = mock(FeedSampleRepository.class);
        silageSampleRepository = mock(SilageSampleRepository.class);
        testResultRepository = mock(TestResultRepository.class);
        sampleImageRepository = mock(SampleImageRepository.class);
        consultationRepository = mock(ConsultationRepository.class);
        expertRepository = mock(ExpertRepository.class);
        feedPlanRepository = mock(FeedPlanRepository.class);
        advisoryRepository = mock(AdvisoryRepository.class);

        qualityAssessmentService = new TestQualityAssessmentService();
        riskAssessmentService = new TestRiskAssessmentService();
        animalHealthScreeningService = new TestAnimalHealthScreeningService();
        aiServiceClient = new TestAiServiceClient();
        analyticsService = new TestAnalyticsService();
        feedPlanService = new TestFeedPlanService();

        farmerA = new User();
        farmerA.setId(101L);
        farmerA.setUsername("farmerA");
        farmerA.setEmail("farmerA@test.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(102L);
        farmerB.setUsername("farmerB");
        farmerB.setEmail("farmerB@test.com");
        farmerB.setRole(Role.FARMER);

        expertUserA = new User();
        expertUserA.setId(201L);
        expertUserA.setUsername("expertDrSmith");
        expertUserA.setEmail("drsmith@test.com");
        expertUserA.setRole(Role.EXPERT);

        expertA = new Expert();
        expertA.setId(301L);
        expertA.setUser(expertUserA);
        expertA.setSpecialization(Specialization.ANIMAL_NUTRITION);

        expertUserB = new User();
        expertUserB.setId(202L);
        expertUserB.setUsername("expertDrJones");
        expertUserB.setEmail("drjones@test.com");
        expertUserB.setRole(Role.EXPERT);

        expertB = new Expert();
        expertB.setId(302L);
        expertB.setUser(expertUserB);
        expertB.setSpecialization(Specialization.VETERINARY);

        farmA = new Farm();
        farmA.setId(1L);
        farmA.setFarmName("Sunrise Dairy Farm");
        farmA.setOwner(farmerA);

        farmB = new Farm();
        farmB.setId(2L);
        farmB.setFarmName("Green Valley Farm");
        farmB.setOwner(farmerB);

        animalA = new Animal();
        animalA.setId(10L);
        animalA.setAnimalTag("COW-001");
        animalA.setName("Bella");
        animalA.setBreed("Holstein Friesian");
        animalA.setFarm(farmA);
        animalA.setLactationStage(LactationStage.MID);
        animalA.setWeight(new BigDecimal("550.0"));

        animalB = new Animal();
        animalB.setId(20L);
        animalB.setAnimalTag("COW-002");
        animalB.setName("Daisy");
        animalB.setFarm(farmB);

        feedA = new FeedSample();
        feedA.setId(100L);
        feedA.setSampleCode("FS-001");
        feedA.setFeedType(FeedType.CATTLE_FEED_PELLET);
        feedA.setSampleDate(LocalDate.now().minusDays(5));
        feedA.setFarm(farmA);
        feedA.setAnimal(animalA);

        silageA = new SilageSample();
        silageA.setId(200L);
        silageA.setSampleCode("SS-001");
        silageA.setSilageType(SilageType.MAIZE);
        silageA.setSampleDate(LocalDate.now().minusDays(3));
        silageA.setFarm(farmA);
        silageA.setAnimal(animalA);

        testResultA = new TestResult();
        testResultA.setId(501L);
        testResultA.setFeedSample(feedA);
        testResultA.setTestDate(LocalDate.now().minusDays(2));
        testResultA.setAnalysisSource(AnalysisSource.LAB);
        testResultA.setMoisture(new BigDecimal("12.5"));
        testResultA.setCrudeProtein(new BigDecimal("18.0"));
        testResultA.setFiber(new BigDecimal("22.0"));
        testResultA.setPh(new BigDecimal("6.5"));
        testResultA.setOverallQuality(OverallQuality.GOOD);
        testResultA.setMouldDetected(false);
        testResultA.setSpoilageDetected(false);

        planA = new FeedPlan();
        planA.setId(601L);
        planA.setPlanName("Balanced Lactation Diet");
        planA.setStatus("ACTIVE");
        planA.setPlannedQuantity(15.0);
        planA.setFrequency("TWICE_DAILY");
        planA.setAnimal(animalA);
        planA.setFeedSample(feedA);

        advisoryA = new Advisory();
        advisoryA.setId(701L);
        advisoryA.setTitle("Fiber Adequacy Check");
        advisoryA.setMessage("Ensure fiber levels remain consistent.");
        advisoryA.setAnimal(animalA);
        advisoryA.setAdvisoryType(AdvisoryType.NUTRITION);
        advisoryA.setPriority(Priority.MEDIUM);
        advisoryA.setIsRead(false);

        consultationA = new Consultation();
        consultationA.setId(801L);
        consultationA.setSubject("Lactation feed evaluation");
        consultationA.setFarmerMessage("Is this protein level sufficient for mid lactation?");
        consultationA.setStatus(ConsultationStatus.RESPONDED);
        consultationA.setFarmer(farmerA);
        consultationA.setExpert(expertA);
        consultationA.setAnimal(animalA);
        consultationA.setFeedSample(feedA);
        consultationA.setExpertResponse("Protein levels are adequate. Maintain mineral supplementation.");
        consultationA.setExpertNotes("Follow up after next test result.");

        securityUtils = new TestSecurityUtils(farmerA);

        evidenceSummaryService = new EvidenceSummaryService(
                animalRepository,
                feedSampleRepository,
                silageSampleRepository,
                testResultRepository,
                sampleImageRepository,
                consultationRepository,
                expertRepository,
                feedPlanRepository,
                advisoryRepository,
                qualityAssessmentService,
                riskAssessmentService,
                animalHealthScreeningService,
                aiServiceClient,
                analyticsService,
                feedPlanService,
                securityUtils
        );
    }

    // ── Tests ───────────────────────────────────────────────────

    @Test
    @DisplayName("Aggregates all evidence sections successfully for an animal owned by the farmer")
    void testGetEvidenceForAnimal_Success() {
        when(animalRepository.findById(10L)).thenReturn(Optional.of(animalA));
        when(feedSampleRepository.findByAnimalId(10L)).thenReturn(List.of(feedA));
        when(silageSampleRepository.findByAnimalId(10L)).thenReturn(List.of(silageA));
        when(testResultRepository.findByAnimalIdOrderByTestDateAsc(10L)).thenReturn(List.of(testResultA));
        when(feedPlanRepository.findByAnimalIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(planA));
        when(advisoryRepository.findByAnimalId(10L)).thenReturn(List.of(advisoryA));

        qualityAssessmentService.setStubResponse(QualityAssessmentResponse.builder()
                .qualityStatus(QualityStatus.GOOD)
                .build());

        riskAssessmentService.setStubResponse(RiskAssessmentResponse.builder()
                .overallRiskLevel(RiskLevel.LOW)
                .build());

        animalHealthScreeningService.setStubResponse(AnimalHealthScreeningResponse.builder()
                .animalId(10L)
                .animalTag("COW-001")
                .screeningStatus("NORMAL")
                .build());

        aiServiceClient.setStubInfo(AiServiceInfoResponse.builder()
                .version("0.2.0")
                .analysisAvailable(true)
                .build());

        analyticsService.setStubAnalytics(AnimalAnalyticsResponse.builder()
                .animalId(10L)
                .descriptiveSummary("1 historical test recorded.")
                .latestMeasurements(HistoricalTestPointDto.builder().crudeProtein(new BigDecimal("18.0")).build())
                .build());

        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForAnimal(10L);

        assertNotNull(response);
        assertNotNull(response.getAnimal());
        assertEquals("COW-001", response.getAnimal().getAnimalTag());
        assertEquals(1, response.getFeedEvidence().size());
        assertEquals("FS-001", response.getFeedEvidence().get(0).getSampleCode());
        assertEquals(1, response.getSilageEvidence().size());
        assertEquals("SS-001", response.getSilageEvidence().get(0).getSampleCode());
        assertEquals(1, response.getTestEvidence().size());
        assertEquals("LABORATORY_DATA", response.getTestEvidence().get(0).getEvidenceSource());

        assertNotNull(response.getQualityEvidence());
        assertEquals(QualityStatus.GOOD, response.getQualityEvidence().getQualityStatus());

        assertNotNull(response.getRiskEvidence());
        assertEquals(RiskLevel.LOW, response.getRiskEvidence().getOverallRiskLevel());

        assertNotNull(response.getHealthScreeningEvidence());
        assertEquals("NORMAL", response.getHealthScreeningEvidence().getScreeningStatus());

        assertEquals(1, response.getFeedPlans().size());
        assertEquals("Balanced Lactation Diet", response.getFeedPlans().get(0).getPlanName());

        assertEquals(1, response.getAdvisories().size());
        assertEquals("Fiber Adequacy Check", response.getAdvisories().get(0).getTitle());

        assertNotNull(response.getHistoricalSummary());
        assertEquals(1L, response.getHistoricalSummary().getTotalTestResults());
        assertEquals("HISTORICAL_ANALYTICS", response.getHistoricalSummary().getEvidenceSource());

        assertNotNull(response.getDisclaimer());
        assertTrue(response.getDisclaimer().contains("Veterinarian"));
        assertTrue(response.getDisclaimer().contains("Veterinary Nutritionist"));
    }

    @Test
    @DisplayName("Returns safe empty/null states and does not fabricate data when records are missing")
    void testGetEvidenceForAnimal_SparseEvidence_NoFabrication() {
        when(animalRepository.findById(10L)).thenReturn(Optional.of(animalA));
        when(feedSampleRepository.findByAnimalId(10L)).thenReturn(Collections.emptyList());
        when(silageSampleRepository.findByAnimalId(10L)).thenReturn(Collections.emptyList());
        when(testResultRepository.findByAnimalIdOrderByTestDateAsc(10L)).thenReturn(Collections.emptyList());
        when(feedPlanRepository.findByAnimalIdOrderByCreatedAtDesc(10L)).thenReturn(Collections.emptyList());
        when(advisoryRepository.findByAnimalId(10L)).thenReturn(Collections.emptyList());

        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForAnimal(10L);

        assertNotNull(response);
        assertNotNull(response.getAnimal());
        assertTrue(response.getFeedEvidence().isEmpty());
        assertTrue(response.getSilageEvidence().isEmpty());
        assertTrue(response.getTestEvidence().isEmpty());
        assertNull(response.getQualityEvidence());
        assertNull(response.getRiskEvidence());
        assertNotNull(response.getVisualScreeningEvidence());
        assertFalse(response.getVisualScreeningEvidence().getEvidenceAvailable());
        assertEquals("Not Available", response.getVisualScreeningEvidence().getVisualStatus());
        assertTrue(response.getFeedPlans().isEmpty());
        assertTrue(response.getAdvisories().isEmpty());
        assertNotNull(response.getHistoricalSummary());
        assertEquals(0L, response.getHistoricalSummary().getTotalTestResults());
    }

    @Test
    @DisplayName("Farmer cannot access evidence for another farmer's animal (403 Forbidden)")
    void testGetEvidenceForAnimal_CrossOwnerFarmer_Throws403() {
        when(animalRepository.findById(20L)).thenReturn(Optional.of(animalB));
        securityUtils.setCurrentUser(farmerA); // Farmer A tries to access Farmer B's animal

        assertThrows(ResourceOwnershipException.class, () ->
                evidenceSummaryService.getEvidenceForAnimal(20L));
    }

    @Test
    @DisplayName("Expert assigned to consultation for this animal is authorized (200 OK)")
    void testGetEvidenceForAnimal_AssignedExpert_Success() {
        when(animalRepository.findById(10L)).thenReturn(Optional.of(animalA));
        when(expertRepository.findByUserId(expertUserA.getId())).thenReturn(Optional.of(expertA));
        when(consultationRepository.findByAnimalId(10L)).thenReturn(List.of(consultationA));

        securityUtils.setCurrentUser(expertUserA);

        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForAnimal(10L);
        assertNotNull(response);
        assertEquals("COW-001", response.getAnimal().getAnimalTag());
    }

    @Test
    @DisplayName("Unassigned expert cannot access evidence for an unlinked animal (403 Forbidden)")
    void testGetEvidenceForAnimal_UnassignedExpert_Throws403() {
        when(animalRepository.findById(10L)).thenReturn(Optional.of(animalA));
        when(expertRepository.findByUserId(expertUserB.getId())).thenReturn(Optional.of(expertB));
        when(consultationRepository.findByAnimalId(10L)).thenReturn(List.of(consultationA)); // assigned to expertA, not expertB

        securityUtils.setCurrentUser(expertUserB);

        assertThrows(ResourceOwnershipException.class, () ->
                evidenceSummaryService.getEvidenceForAnimal(10L));
    }

    @Test
    @DisplayName("Non-existent animal throws ResourceNotFoundException (404)")
    void testGetEvidenceForAnimal_NotFound_Throws404() {
        when(animalRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                evidenceSummaryService.getEvidenceForAnimal(999L));
    }

    @Test
    @DisplayName("Consultation evidence includes full animal, feed, test, and expert response context")
    void testGetEvidenceForConsultation_AssignedExpert_Success() {
        when(consultationRepository.findById(801L)).thenReturn(Optional.of(consultationA));
        when(expertRepository.findByUserId(expertUserA.getId())).thenReturn(Optional.of(expertA));
        when(feedSampleRepository.findByAnimalId(10L)).thenReturn(List.of(feedA));
        when(testResultRepository.findByAnimalIdOrderByTestDateAsc(10L)).thenReturn(List.of(testResultA));

        securityUtils.setCurrentUser(expertUserA);

        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForConsultation(801L);

        assertNotNull(response);
        assertNotNull(response.getConsultation());
        assertEquals(801L, response.getConsultation().getId());
        assertEquals("Lactation feed evaluation", response.getConsultation().getSubject());
        assertEquals("Protein levels are adequate. Maintain mineral supplementation.", response.getConsultation().getExpertRecommendation());
        assertEquals("EXPERT_RESPONSE", response.getConsultation().getEvidenceSource());
        assertNotNull(response.getAnimal());
        assertEquals("COW-001", response.getAnimal().getAnimalTag());
    }

    @Test
    @DisplayName("Unassigned expert cannot access consultation evidence (403 Forbidden)")
    void testGetEvidenceForConsultation_UnassignedExpert_Throws403() {
        when(consultationRepository.findById(801L)).thenReturn(Optional.of(consultationA));
        when(expertRepository.findByUserId(expertUserB.getId())).thenReturn(Optional.of(expertB));

        securityUtils.setCurrentUser(expertUserB); // expertB is not the assigned expert

        assertThrows(ResourceOwnershipException.class, () ->
                evidenceSummaryService.getEvidenceForConsultation(801L));
    }

    @Test
    @DisplayName("Cross-owner farmer cannot access another farmer's consultation evidence (403 Forbidden)")
    void testGetEvidenceForConsultation_CrossOwnerFarmer_Throws403() {
        when(consultationRepository.findById(801L)).thenReturn(Optional.of(consultationA));

        securityUtils.setCurrentUser(farmerB); // farmerB does not own consultationA

        assertThrows(ResourceOwnershipException.class, () ->
                evidenceSummaryService.getEvidenceForConsultation(801L));
    }

    @Test
    @DisplayName("Sample-only consultation without animal aggregates sample evidence cleanly")
    void testGetEvidenceForConsultation_SampleOnly_Success() {
        Consultation sampleOnlyConsult = new Consultation();
        sampleOnlyConsult.setId(802L);
        sampleOnlyConsult.setSubject("Feed test inquiry");
        sampleOnlyConsult.setStatus(ConsultationStatus.RESPONDED);
        sampleOnlyConsult.setFarmer(farmerA);
        sampleOnlyConsult.setExpert(expertA);
        sampleOnlyConsult.setFeedSample(feedA);
        sampleOnlyConsult.setAnimal(null);

        when(consultationRepository.findById(802L)).thenReturn(Optional.of(sampleOnlyConsult));
        when(expertRepository.findByUserId(expertUserA.getId())).thenReturn(Optional.of(expertA));
        when(testResultRepository.findByFeedSampleIdOrderByTestDateAsc(100L)).thenReturn(List.of(testResultA));

        securityUtils.setCurrentUser(expertUserA);

        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForConsultation(802L);

        assertNotNull(response);
        assertNull(response.getAnimal());
        assertNotNull(response.getConsultation());
        assertEquals(1, response.getFeedEvidence().size());
        assertEquals("FS-001", response.getFeedEvidence().get(0).getSampleCode());
        assertEquals(1, response.getTestEvidence().size());
        assertNull(response.getHealthScreeningEvidence());
    }

    @Test
    @DisplayName("Preserves visual screening source transparency: ML when available, Deterministic fallback when not")
    void testVisualScreeningSourceTransparency() {
        TestResult imageTest = new TestResult();
        imageTest.setId(502L);
        imageTest.setFeedSample(feedA);
        imageTest.setAnalysisSource(AnalysisSource.IMAGE);
        imageTest.setMouldDetected(true);
        imageTest.setSpoilageDetected(false);
        imageTest.setTestDate(LocalDate.now());

        when(animalRepository.findById(10L)).thenReturn(Optional.of(animalA));
        when(feedSampleRepository.findByAnimalId(10L)).thenReturn(List.of(feedA));
        when(testResultRepository.findByAnimalIdOrderByTestDateAsc(10L)).thenReturn(List.of(imageTest));

        // Case 1: AI service with model available
        aiServiceClient.setStubInfo(AiServiceInfoResponse.builder()
                .version("0.2.0")
                .analysisAvailable(true)
                .build());

        EvidenceSummaryResponse respML = evidenceSummaryService.getEvidenceForAnimal(10L);
        assertNotNull(respML.getVisualScreeningEvidence());
        assertEquals("ML_VISUAL_SCREENING", respML.getVisualScreeningEvidence().getAnalysisSource());
        assertEquals("0.2.0", respML.getVisualScreeningEvidence().getModelVersion());
        assertTrue(respML.getVisualScreeningEvidence().getMouldDetected());
        assertEquals("ABNORMAL", respML.getVisualScreeningEvidence().getVisualStatus());

        // Case 2: AI service model NOT available -> fallback must NOT be labeled as ML
        aiServiceClient.setStubInfo(AiServiceInfoResponse.builder()
                .version(null)
                .analysisAvailable(false)
                .build());

        EvidenceSummaryResponse respDet = evidenceSummaryService.getEvidenceForAnimal(10L);
        assertNotNull(respDet.getVisualScreeningEvidence());
        assertEquals("DETERMINISTIC_VISUAL_SCREENING", respDet.getVisualScreeningEvidence().getAnalysisSource());
    }
}
