package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.consultation.ConsultationRequest;
import com.cattlefeedai.api.dto.consultation.ConsultationResponse;
import com.cattlefeedai.api.dto.consultation.ExpertRecommendationRequest;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.*;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.ConsultationService;
import org.junit.jupiter.api.BeforeEach;
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

public class ConsultationServiceUnitTest {

    private ConsultationRepository consultationRepository;
    private ExpertRepository expertRepository;
    private AnimalRepository animalRepository;
    private FeedSampleRepository feedSampleRepository;
    private SilageSampleRepository silageSampleRepository;
    private TestResultRepository testResultRepository;
    private SampleImageRepository sampleImageRepository;
    private HealthRiskRepository healthRiskRepository;
    private AdvisoryRepository advisoryRepository;
    private TestSecurityUtils securityUtils;
    private ConsultationService consultationService;

    private User farmerA;
    private User farmerB;
    private User expertUser;
    private Expert expertProfile;
    private Farm farmA;

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
        consultationRepository = Mockito.mock(ConsultationRepository.class);
        expertRepository = Mockito.mock(ExpertRepository.class);
        animalRepository = Mockito.mock(AnimalRepository.class);
        feedSampleRepository = Mockito.mock(FeedSampleRepository.class);
        silageSampleRepository = Mockito.mock(SilageSampleRepository.class);
        testResultRepository = Mockito.mock(TestResultRepository.class);
        sampleImageRepository = Mockito.mock(SampleImageRepository.class);
        healthRiskRepository = Mockito.mock(HealthRiskRepository.class);
        advisoryRepository = Mockito.mock(AdvisoryRepository.class);

        farmerA = new User();
        farmerA.setId(10L);
        farmerA.setUsername("FarmerJohn");
        farmerA.setEmail("farmer.john@example.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(20L);
        farmerB.setUsername("FarmerJane");
        farmerB.setEmail("farmer.jane@example.com");
        farmerB.setRole(Role.FARMER);

        expertUser = new User();
        expertUser.setId(30L);
        expertUser.setUsername("DrSmith");
        expertUser.setEmail("dr.smith@example.com");
        expertUser.setRole(Role.EXPERT);

        expertProfile = new Expert();
        expertProfile.setId(100L);
        expertProfile.setUser(expertUser);
        expertProfile.setSpecialization(Specialization.VETERINARY);
        expertProfile.setQualification("DVM, Veterinary Nutrition Specialist");
        expertProfile.setExperienceYears(8);
        expertProfile.setLicenseNumber("VET-7788");

        farmA = new Farm();
        farmA.setId(5L);
        farmA.setFarmName("Green Valley Farm");
        farmA.setOwner(farmerA);

        securityUtils = new TestSecurityUtils(farmerA);

        consultationService = new ConsultationService(
                consultationRepository,
                expertRepository,
                animalRepository,
                feedSampleRepository,
                silageSampleRepository,
                testResultRepository,
                sampleImageRepository,
                healthRiskRepository,
                advisoryRepository,
                securityUtils
        );

        when(expertRepository.findByUserId(30L)).thenReturn(Optional.of(expertProfile));
    }

    // 1. Farmer creates consultation
    @Test
    void test1_farmerCreatesConsultation() {
        ConsultationRequest req = ConsultationRequest.builder()
                .subject("Feed intake drop")
                .question("Animal tag COW-101 has reduced appetite. Please advise.")
                .additionalContext("Recent weather has been humid.")
                .build();

        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> {
            Consultation c = inv.getArgument(0);
            c.setId(1L);
            c.setCreatedAt(LocalDateTime.now());
            c.setUpdatedAt(LocalDateTime.now());
            return c;
        });

        ConsultationResponse resp = consultationService.createConsultation(req);
        assertNotNull(resp);
        assertEquals("Feed intake drop", resp.getSubject());
        assertEquals("Animal tag COW-101 has reduced appetite. Please advise.", resp.getQuestion());
        assertEquals(ConsultationStatus.REQUESTED, resp.getStatus());
        assertEquals(10L, resp.getFarmerId());
    }

    // 2. Farmer gets own consultation
    @Test
    void test2_farmerGetsOwnConsultation() {
        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help needed");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerA);
        c.setRequestDate(LocalDate.now());

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        ConsultationResponse resp = consultationService.getConsultationById(1L);
        assertNotNull(resp);
        assertEquals(1L, resp.getId());
        assertEquals("Feed intake drop", resp.getSubject());
    }

    // 3. Farmer lists own consultations
    @Test
    void test3_farmerListsOwnConsultations() {
        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerA);

        when(consultationRepository.findByFarmerIdOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(c));

        List<ConsultationResponse> list = consultationService.getAllConsultations();
        assertEquals(1, list.size());
        assertEquals(1L, list.get(0).getId());
    }

    // 4. Farmer cannot access another farmer consultation
    @Test
    void test4_farmerCannotAccessAnotherFarmerConsultation() {
        Consultation c = new Consultation();
        c.setId(2L);
        c.setSubject("Silage query");
        c.setFarmerMessage("Private question");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerB); // Owned by Farmer B

        when(consultationRepository.findById(2L)).thenReturn(Optional.of(c));

        // Authenticated user is Farmer A
        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            consultationService.getConsultationById(2L);
        });
        assertTrue(ex.getMessage().contains("another farmer"));
    }

    // 5. Expert can access assigned consultation
    @Test
    void test5_expertCanAccessAssignedConsultation() {
        securityUtils.setCurrentUser(expertUser);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.ACCEPTED);
        c.setFarmer(farmerA);
        c.setExpert(expertProfile);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        ConsultationResponse resp = consultationService.getConsultationById(1L);
        assertNotNull(resp);
        assertEquals(1L, resp.getId());
    }

    // 6. Expert accepts consultation
    @Test
    void test6_expertAcceptsConsultation() {
        securityUtils.setCurrentUser(expertUser);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerA);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationResponse resp = consultationService.acceptConsultation(1L);
        assertEquals(ConsultationStatus.ACCEPTED, resp.getStatus());
        assertEquals(100L, resp.getExpertId());
    }

    // 7. Expert moves consultation to IN_REVIEW
    @Test
    void test7_expertMovesConsultationToInReview() {
        securityUtils.setCurrentUser(expertUser);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.ACCEPTED);
        c.setFarmer(farmerA);
        c.setExpert(expertProfile);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationResponse resp = consultationService.startReview(1L);
        assertEquals(ConsultationStatus.IN_REVIEW, resp.getStatus());
    }

    // 8. Expert responds
    @Test
    void test8_expertResponds() {
        securityUtils.setCurrentUser(expertUser);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.IN_REVIEW);
        c.setFarmer(farmerA);
        c.setExpert(expertProfile);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ExpertRecommendationRequest req = ExpertRecommendationRequest.builder()
                .recommendation("Increase dry matter proportion gradually and provide clean water access.")
                .expertNotes("Check rumen fill and monitor daily milk production.")
                .build();

        ConsultationResponse resp = consultationService.respondConsultation(1L, req);
        assertEquals(ConsultationStatus.RESPONDED, resp.getStatus());
        assertEquals("Increase dry matter proportion gradually and provide clean water access.", resp.getExpertRecommendation());
        assertEquals("Check rumen fill and monitor daily milk production.", resp.getExpertNotes());
        assertNotNull(resp.getResponseDate());
    }

    // 9. Farmer sees expert response
    @Test
    void test9_farmerSeesExpertResponse() {
        securityUtils.setCurrentUser(farmerA);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.RESPONDED);
        c.setFarmer(farmerA);
        c.setExpert(expertProfile);
        c.setExpertResponse("Adjust fiber ratio in diet.");
        c.setExpertNotes("Monitor for 48 hours.");
        c.setResponseDate(LocalDate.now());

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        ConsultationResponse resp = consultationService.getConsultationById(1L);
        assertEquals(ConsultationStatus.RESPONDED, resp.getStatus());
        assertEquals("Adjust fiber ratio in diet.", resp.getExpertRecommendation());
        assertEquals("Monitor for 48 hours.", resp.getExpertNotes());
    }

    // 10. Expert completes consultation
    @Test
    void test10_expertCompletesConsultation() {
        securityUtils.setCurrentUser(expertUser);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setFarmerMessage("Help");
        c.setStatus(ConsultationStatus.RESPONDED);
        c.setFarmer(farmerA);
        c.setExpert(expertProfile);
        c.setExpertResponse("Adjust fiber ratio.");

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationResponse resp = consultationService.completeConsultation(1L);
        assertEquals(ConsultationStatus.COMPLETED, resp.getStatus());
        assertNotNull(resp.getCompletedAt());
    }

    // 11. Farmer sees COMPLETED
    @Test
    void test11_farmerSeesCompleted() {
        securityUtils.setCurrentUser(farmerA);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setStatus(ConsultationStatus.COMPLETED);
        c.setFarmer(farmerA);
        c.setExpert(expertProfile);
        c.setExpertResponse("Diet adjusted.");
        c.setCompletedAt(LocalDateTime.now());

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        ConsultationResponse resp = consultationService.getConsultationById(1L);
        assertEquals(ConsultationStatus.COMPLETED, resp.getStatus());
        assertNotNull(resp.getCompletedAt());
    }

    // 12. Farmer cancels eligible consultation
    @Test
    void test12_farmerCancelsEligibleConsultation() {
        securityUtils.setCurrentUser(farmerA);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerA);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationResponse resp = consultationService.cancelConsultation(1L);
        assertEquals(ConsultationStatus.CANCELLED, resp.getStatus());
    }

    // 13. Invalid status transition rejected
    @Test
    void test13_invalidStatusTransitionRejected() {
        securityUtils.setCurrentUser(expertUser);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Feed intake drop");
        c.setStatus(ConsultationStatus.REQUESTED); // In REQUESTED, cannot complete directly
        c.setFarmer(farmerA);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        InvalidRequestException ex = assertThrows(InvalidRequestException.class, () -> {
            consultationService.completeConsultation(1L);
        });
        assertTrue(ex.getMessage().contains("must be responded"));
    }

    // 14. Missing consultation returns 404
    @Test
    void test14_missingConsultationReturns404() {
        when(consultationRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> {
            consultationService.getConsultationById(999L);
        });
        assertTrue(ex.getMessage().contains("not found"));
    }

    // 15. Unauthorized request returns 401
    @Test
    void test15_unauthorizedRequestReturns401() {
        securityUtils.setCurrentUser(null); // Unauthenticated context

        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            consultationService.getAllConsultations();
        });
        assertTrue(ex.getMessage().contains("not authenticated"));
    }

    // 16. Forbidden ownership returns 403
    @Test
    void test16_forbiddenOwnershipReturns403() {
        securityUtils.setCurrentUser(farmerB);

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Private Consultation");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerA); // Owned by Farmer A

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            consultationService.cancelConsultation(1L);
        });
        assertTrue(ex.getMessage().contains("only cancel your own"));
    }

    // 17. Optional animal reference works
    @Test
    void test17_optionalAnimalReferenceWorks() {
        Animal animal = new Animal();
        animal.setId(101L);
        animal.setAnimalTag("COW-101");
        animal.setBreed("Jersey");
        animal.setFarm(farmA);

        when(animalRepository.findById(101L)).thenReturn(Optional.of(animal));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationRequest req = ConsultationRequest.builder()
                .subject("Animal inquiry")
                .question("Check nutrition for COW-101")
                .animalId(101L)
                .build();

        ConsultationResponse resp = consultationService.createConsultation(req);
        assertEquals(101L, resp.getAnimalId());
        assertEquals("COW-101", resp.getAnimalTag());
    }

    // 18. Optional feed reference works
    @Test
    void test18_optionalFeedReferenceWorks() {
        FeedSample feed = new FeedSample();
        feed.setId(201L);
        feed.setSampleCode("FEED-201");
        feed.setFeedType(FeedType.CATTLE_FEED_PELLET);
        feed.setFarm(farmA);

        when(feedSampleRepository.findById(201L)).thenReturn(Optional.of(feed));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationRequest req = ConsultationRequest.builder()
                .subject("Feed quality concern")
                .question("Pellet batch check")
                .feedSampleId(201L)
                .build();

        ConsultationResponse resp = consultationService.createConsultation(req);
        assertEquals(201L, resp.getFeedSampleId());
        assertEquals("FEED-201", resp.getFeedSampleCode());
    }

    // 19. Optional silage reference works
    @Test
    void test19_optionalSilageReferenceWorks() {
        SilageSample silage = new SilageSample();
        silage.setId(301L);
        silage.setSampleCode("SILAGE-301");
        silage.setSilageType(SilageType.MAIZE);
        silage.setFarm(farmA);

        when(silageSampleRepository.findById(301L)).thenReturn(Optional.of(silage));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationRequest req = ConsultationRequest.builder()
                .subject("Silage check")
                .question("Moisture concern")
                .silageSampleId(301L)
                .build();

        ConsultationResponse resp = consultationService.createConsultation(req);
        assertEquals(301L, resp.getSilageSampleId());
        assertEquals("SILAGE-301", resp.getSilageSampleCode());
    }

    // 20. No fake information returned
    @Test
    void test20_noFakeInformationReturned() {
        Animal a = new Animal();
        a.setId(102L);
        a.setAnimalTag("COW-102");
        a.setFarm(farmA);
        // Breed, name, gender, DOB, etc are NULL

        Consultation c = new Consultation();
        c.setId(1L);
        c.setSubject("Blank animal");
        c.setFarmerMessage("Empty fields test");
        c.setStatus(ConsultationStatus.REQUESTED);
        c.setFarmer(farmerA);
        c.setAnimal(a);

        when(consultationRepository.findById(1L)).thenReturn(Optional.of(c));

        ConsultationResponse resp = consultationService.getConsultationById(1L);
        assertNotNull(resp.getAnimal());
        // Unspecified values must be "Not Available" and NOT fabricated
        assertEquals("Not Available", resp.getAnimal().getBreed());
        assertEquals("Not Available", resp.getAnimal().getName());
        assertEquals("Not Available", resp.getAnimal().getGender());
        assertEquals("Not Available", resp.getAnimal().getAge());
        assertEquals("Not Available", resp.getAnimal().getLactationStage());
    }
}
