package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.FeedPlanRequest;
import com.cattlefeedai.api.dto.FeedPlanResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.*;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.FeedPlanService;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FeedPlanServiceUnitTest {

    private FeedPlanRepository feedPlanRepository;
    private AnimalRepository animalRepository;
    private FeedSampleRepository feedSampleRepository;
    private SilageSampleRepository silageSampleRepository;
    private TestResultRepository testResultRepository;
    private TestQualityAssessmentService qualityAssessmentService;
    private TestRiskAssessmentService riskAssessmentService;
    private AdvisoryRepository advisoryRepository;
    private TestSecurityUtils securityUtils;

    private FeedPlanService feedPlanService;

    private User farmerA;
    private User farmerB;
    private Farm farmA;
    private Farm farmB;
    private Animal animalA;
    private Animal animalB;
    private FeedSample feedA;
    private FeedSample feedB;
    private SilageSample silageA;
    private FeedPlan planA;

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
        feedPlanRepository = mock(FeedPlanRepository.class);
        animalRepository = mock(AnimalRepository.class);
        feedSampleRepository = mock(FeedSampleRepository.class);
        silageSampleRepository = mock(SilageSampleRepository.class);
        testResultRepository = mock(TestResultRepository.class);
        qualityAssessmentService = new TestQualityAssessmentService();
        riskAssessmentService = new TestRiskAssessmentService();
        advisoryRepository = mock(AdvisoryRepository.class);

        farmerA = new User();
        farmerA.setId(101L);
        farmerA.setEmail("farmerA@example.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(102L);
        farmerB.setEmail("farmerB@example.com");
        farmerB.setRole(Role.FARMER);

        farmA = new Farm();
        farmA.setId(201L);
        farmA.setFarmName("Green Acres");
        farmA.setOwner(farmerA);

        farmB = new Farm();
        farmB.setId(202L);
        farmB.setFarmName("Valley View");
        farmB.setOwner(farmerB);

        animalA = new Animal();
        animalA.setId(301L);
        animalA.setAnimalTag("COW-001");
        animalA.setName("Bessie");
        animalA.setBreed("Holstein");
        animalA.setFarm(farmA);
        animalA.setLactationStage(LactationStage.EARLY);

        animalB = new Animal();
        animalB.setId(302L);
        animalB.setAnimalTag("COW-002");
        animalB.setName("Daisy");
        animalB.setFarm(farmB);

        feedA = new FeedSample();
        feedA.setId(401L);
        feedA.setSampleCode("FS-001");
        feedA.setFarm(farmA);
        feedA.setFeedType(FeedType.CATTLE_FEED_PELLET);

        feedB = new FeedSample();
        feedB.setId(402L);
        feedB.setSampleCode("FS-002");
        feedB.setFarm(farmB);
        feedB.setFeedType(FeedType.GREEN_FODDER);

        silageA = new SilageSample();
        silageA.setId(501L);
        silageA.setSampleCode("SS-001");
        silageA.setFarm(farmA);
        silageA.setSilageType(SilageType.MAIZE);

        planA = new FeedPlan();
        planA.setId(1L);
        planA.setPlanName("High Lactation Diet");
        planA.setDescription("Optimized lactation mix");
        planA.setStartDate(LocalDate.of(2026, 10, 1));
        planA.setEndDate(LocalDate.of(2026, 10, 31));
        planA.setStatus("ACTIVE");
        planA.setPlannedQuantity(5.5);
        planA.setFrequency("TWICE_DAILY");
        planA.setAnimal(animalA);
        planA.setFeedSample(feedA);
        planA.setSilageSample(silageA);
        planA.setCreatedAt(LocalDateTime.now());
        planA.setUpdatedAt(LocalDateTime.now());

        securityUtils = new TestSecurityUtils(farmerA);

        feedPlanService = new FeedPlanService(
                feedPlanRepository,
                animalRepository,
                feedSampleRepository,
                silageSampleRepository,
                testResultRepository,
                qualityAssessmentService,
                riskAssessmentService,
                advisoryRepository,
                securityUtils
        );
    }

    @Test
    @DisplayName("Create FeedPlan succeeds for owned animal and samples")
    void test01_CreateFeedPlan_Success() {
        when(animalRepository.findById(301L)).thenReturn(Optional.of(animalA));
        when(feedSampleRepository.findById(401L)).thenReturn(Optional.of(feedA));
        when(silageSampleRepository.findById(501L)).thenReturn(Optional.of(silageA));
        when(feedPlanRepository.save(any(FeedPlan.class))).thenAnswer(invocation -> {
            FeedPlan p = invocation.getArgument(0);
            p.setId(10L);
            p.setCreatedAt(LocalDateTime.now());
            p.setUpdatedAt(LocalDateTime.now());
            return p;
        });

        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Fresh Lactation Mix")
                .description("Morning and evening feeding")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 10, 20))
                .status("ACTIVE")
                .plannedQuantity(4.0)
                .frequency("TWICE_DAILY")
                .animalId(301L)
                .feedSampleId(401L)
                .silageSampleId(501L)
                .build();

        FeedPlanResponse resp = feedPlanService.createFeedPlan(req);

        assertNotNull(resp);
        assertEquals(10L, resp.getId());
        assertEquals("Fresh Lactation Mix", resp.getPlanName());
        assertEquals("ACTIVE", resp.getStatus());
        assertEquals(4.0, resp.getPlannedQuantity());
        assertEquals("COW-001", resp.getAnimal().getAnimalTag());
        assertEquals("FS-001", resp.getFeedSample().getSampleCode());
        assertEquals("SS-001", resp.getSilageSample().getSampleCode());
        assertNotNull(resp.getDisclaimer());
        assertTrue(resp.getDisclaimer().contains("Veterinarian"));
        verify(feedPlanRepository, times(1)).save(any(FeedPlan.class));
    }

    @Test
    @DisplayName("Create FeedPlan fails 403 when animal belongs to another farmer")
    void test02_CreateFeedPlan_CrossOwnerAnimal_Throws403() {
        when(animalRepository.findById(302L)).thenReturn(Optional.of(animalB));

        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Unauthorized Plan")
                .startDate(LocalDate.of(2026, 10, 1))
                .animalId(302L)
                .build();

        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            feedPlanService.createFeedPlan(req);
        });
        assertTrue(ex.getMessage().contains("do not have permission"));
        verify(feedPlanRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create FeedPlan fails 403 when feed sample belongs to another farmer")
    void test03_CreateFeedPlan_CrossOwnerFeedSample_Throws403() {
        when(animalRepository.findById(301L)).thenReturn(Optional.of(animalA));
        when(feedSampleRepository.findById(402L)).thenReturn(Optional.of(feedB));

        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Plan With Foreign Feed")
                .startDate(LocalDate.of(2026, 10, 1))
                .animalId(301L)
                .feedSampleId(402L)
                .build();

        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            feedPlanService.createFeedPlan(req);
        });
        assertTrue(ex.getMessage().contains("do not own this feed sample"));
        verify(feedPlanRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create FeedPlan fails 404 when animal does not exist")
    void test04_CreateFeedPlan_MissingAnimal_Throws404() {
        when(animalRepository.findById(999L)).thenReturn(Optional.empty());

        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Plan Missing Animal")
                .startDate(LocalDate.of(2026, 10, 1))
                .animalId(999L)
                .build();

        assertThrows(ResourceNotFoundException.class, () -> {
            feedPlanService.createFeedPlan(req);
        });
    }

    @Test
    @DisplayName("Create FeedPlan fails 400 when end date is before start date")
    void test05_CreateFeedPlan_EndDateBeforeStartDate_Throws400() {
        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Invalid Dates Plan")
                .startDate(LocalDate.of(2026, 10, 10))
                .endDate(LocalDate.of(2026, 10, 5))
                .animalId(301L)
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            feedPlanService.createFeedPlan(req);
        });
        assertTrue(ex.getMessage().contains("End date cannot be before start date"));
    }

    @Test
    @DisplayName("Get FeedPlans returns only current farmer's plans")
    void test06_GetFeedPlans_ReturnsFarmerPlans() {
        when(feedPlanRepository.findByAnimalFarmOwnerIdOrderByCreatedAtDesc(101L))
                .thenReturn(List.of(planA));

        List<FeedPlanResponse> list = feedPlanService.getFeedPlans();

        assertEquals(1, list.size());
        assertEquals("High Lactation Diet", list.get(0).getPlanName());
        verify(feedPlanRepository, times(1)).findByAnimalFarmOwnerIdOrderByCreatedAtDesc(101L);
    }

    @Test
    @DisplayName("Get FeedPlan by ID succeeds for owner")
    void test07_GetFeedPlanById_Success() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));

        FeedPlanResponse resp = feedPlanService.getFeedPlanById(1L);

        assertNotNull(resp);
        assertEquals(1L, resp.getId());
        assertEquals("High Lactation Diet", resp.getPlanName());
    }

    @Test
    @DisplayName("Get FeedPlan by ID throws 403 when accessed by cross-owner")
    void test08_GetFeedPlanById_CrossOwner_Throws403() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));

        securityUtils.setCurrentUser(farmerB);

        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            feedPlanService.getFeedPlanById(1L);
        });
        assertTrue(ex.getMessage().contains("do not have permission"));
    }

    @Test
    @DisplayName("Get FeedPlan by ID throws 404 when plan not found")
    void test09_GetFeedPlanById_NotFound_Throws404() {
        when(feedPlanRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            feedPlanService.getFeedPlanById(999L);
        });
    }

    @Test
    @DisplayName("Update FeedPlan updates fields and enforces ownership")
    void test10_UpdateFeedPlan_Success() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));
        when(feedPlanRepository.save(any(FeedPlan.class))).thenAnswer(i -> i.getArgument(0));

        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Updated Maintenance Diet")
                .description("Updated notes")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 11, 1))
                .status("COMPLETED")
                .plannedQuantity(6.0)
                .frequency("ONCE_DAILY")
                .animalId(301L)
                .build();

        FeedPlanResponse resp = feedPlanService.updateFeedPlan(1L, req);

        assertNotNull(resp);
        assertEquals("Updated Maintenance Diet", resp.getPlanName());
        assertEquals("COMPLETED", resp.getStatus());
        assertEquals(6.0, resp.getPlannedQuantity());
        verify(feedPlanRepository, times(1)).save(planA);
    }

    @Test
    @DisplayName("Update FeedPlan throws 403 for cross-owner")
    void test11_UpdateFeedPlan_CrossOwner_Throws403() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));
        securityUtils.setCurrentUser(farmerB);

        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Malicious Update")
                .startDate(LocalDate.of(2026, 10, 1))
                .animalId(301L)
                .build();

        assertThrows(ResourceOwnershipException.class, () -> {
            feedPlanService.updateFeedPlan(1L, req);
        });
        verify(feedPlanRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete FeedPlan deletes owned plan")
    void test12_DeleteFeedPlan_Success() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));

        feedPlanService.deleteFeedPlan(1L);

        verify(feedPlanRepository, times(1)).delete(planA);
    }

    @Test
    @DisplayName("Delete FeedPlan throws 403 for cross-owner")
    void test13_DeleteFeedPlan_CrossOwner_Throws403() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));
        securityUtils.setCurrentUser(farmerB);

        assertThrows(ResourceOwnershipException.class, () -> {
            feedPlanService.deleteFeedPlan(1L);
        });
        verify(feedPlanRepository, never()).delete(any());
    }

    @Test
    @DisplayName("FeedPlan context gathering integrates quality, risk, and advisories when present")
    void test14_FeedPlanContext_WithAuthoritativeAssessments() {
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));

        TestResult tr = new TestResult();
        tr.setId(601L);
        tr.setTestDate(LocalDate.of(2026, 9, 20));
        tr.setAnalysisSource(AnalysisSource.LAB);
        tr.setMoisture(new BigDecimal("12.5"));
        tr.setCrudeProtein(new BigDecimal("18.0"));

        when(testResultRepository.findByFeedSampleIdOrderByTestDateDesc(401L))
                .thenReturn(List.of(tr));

        QualityAssessmentResponse qa = QualityAssessmentResponse.builder()
                .testResultId(601L)
                .qualityStatus(QualityStatus.GOOD)
                .build();
        qualityAssessmentService.setStubResponse(qa);

        RiskAssessmentResponse ra = RiskAssessmentResponse.builder()
                .testResultId(601L)
                .overallRiskLevel(RiskLevel.LOW)
                .allRisks(List.of(RiskIndicatorDto.builder()
                        .riskTitle("Low Moisture Drift")
                        .severity(Severity.INFO)
                        .build()))
                .build();
        riskAssessmentService.setStubResponse(ra);

        Advisory adv = new Advisory();
        adv.setId(701L);
        adv.setTitle("Optimize Early Lactation Diet");
        adv.setMessage("Maintain dry matter intake");
        adv.setPriority(Priority.MEDIUM);
        adv.setAdvisoryType(AdvisoryType.NUTRITION);
        adv.setIsRead(false);
        adv.setCreatedAt(LocalDateTime.now());
        when(advisoryRepository.findByAnimalId(301L)).thenReturn(List.of(adv));

        FeedPlanResponse resp = feedPlanService.getFeedPlanById(1L);

        assertNotNull(resp);
        assertEquals("GOOD", resp.getQualityStatus());
        assertEquals("LOW", resp.getRiskLevel());
        assertEquals(1, resp.getRiskIndicators().size());
        assertEquals("Low Moisture Drift", resp.getRiskIndicators().get(0).getRiskTitle());
        assertEquals(1, resp.getRecentAdvisories().size());
        assertEquals("Optimize Early Lactation Diet", resp.getRecentAdvisories().get(0).getTitle());
        assertNotNull(resp.getLatestTestResult());
        assertEquals(601L, resp.getLatestTestResult().getId());
    }

    @Test
    @DisplayName("FeedPlan context defaults to Not Available when no test results exist")
    void test15_FeedPlanContext_NoTestResults_ReturnsNotAvailable() {
        planA.setFeedSample(null);
        planA.setSilageSample(null);
        when(feedPlanRepository.findById(1L)).thenReturn(Optional.of(planA));
        when(advisoryRepository.findByAnimalId(301L)).thenReturn(Collections.emptyList());

        FeedPlanResponse resp = feedPlanService.getFeedPlanById(1L);

        assertNotNull(resp);
        assertEquals("Not Available", resp.getQualityStatus());
        assertEquals("Not Available", resp.getRiskLevel());
        assertNull(resp.getLatestTestResult());
        assertTrue(resp.getRiskIndicators().isEmpty());
        assertTrue(resp.getRecentAdvisories().isEmpty());
    }
}
