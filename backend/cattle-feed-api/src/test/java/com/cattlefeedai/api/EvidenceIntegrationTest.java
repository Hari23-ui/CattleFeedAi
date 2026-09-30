package com.cattlefeedai.api;

import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.*;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class EvidenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private FeedSampleRepository feedSampleRepository;

    @Autowired
    private TestResultRepository testResultRepository;

    @Autowired
    private FeedPlanRepository feedPlanRepository;

    @Autowired
    private AdvisoryRepository advisoryRepository;

    @Autowired
    private ExpertRepository expertRepository;

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private JwtService jwtService;

    private User farmerA;
    private User farmerB;
    private User expertUserA;
    private User expertUserB;
    private Expert expertA;
    private Expert expertB;

    private Farm farmA;
    private Farm farmB;
    private Animal animalA;
    private FeedSample feedA;
    private TestResult testResultA;
    private FeedPlan feedPlanA;
    private Advisory advisoryA;
    private Consultation consultationA;

    private String tokenFarmerA;
    private String tokenFarmerB;
    private String tokenExpertA;
    private String tokenExpertB;

    @BeforeEach
    void setup() {
        farmerA = userRepository.findByEmail("farmerA_m12@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("farmerA_m12");
                    u.setEmail("farmerA_m12@test.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        farmerB = userRepository.findByEmail("farmerB_m12@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("farmerB_m12");
                    u.setEmail("farmerB_m12@test.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        expertUserA = userRepository.findByEmail("dr_smith_m12@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("dr_smith_m12");
                    u.setEmail("dr_smith_m12@test.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.EXPERT);
                    return userRepository.save(u);
                });

        expertA = expertRepository.findByUserId(expertUserA.getId())
                .orElseGet(() -> {
                    Expert e = new Expert();
                    e.setUser(expertUserA);
                    e.setSpecialization(Specialization.ANIMAL_NUTRITION);
                    e.setQualification("PhD Veterinary Nutrition");
                    e.setExperienceYears(12);
                    e.setLicenseNumber("VN-12001");
                    return expertRepository.save(e);
                });

        expertUserB = userRepository.findByEmail("dr_jones_m12@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("dr_jones_m12");
                    u.setEmail("dr_jones_m12@test.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.EXPERT);
                    return userRepository.save(u);
                });

        expertB = expertRepository.findByUserId(expertUserB.getId())
                .orElseGet(() -> {
                    Expert e = new Expert();
                    e.setUser(expertUserB);
                    e.setSpecialization(Specialization.VETERINARY);
                    e.setQualification("BVSc & AH");
                    e.setExperienceYears(8);
                    e.setLicenseNumber("VET-8002");
                    return expertRepository.save(e);
                });

        tokenFarmerA = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        farmerA.getEmail(),
                        farmerA.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                )
        );

        tokenFarmerB = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        farmerB.getEmail(),
                        farmerB.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                )
        );

        tokenExpertA = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        expertUserA.getEmail(),
                        expertUserA.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_EXPERT"))
                )
        );

        tokenExpertB = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        expertUserB.getEmail(),
                        expertUserB.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_EXPERT"))
                )
        );

        farmA = new Farm();
        farmA.setFarmName("M12 Green Acres Farm");
        farmA.setLocation("Sector 12");
        farmA.setOwner(farmerA);
        farmA = farmRepository.save(farmA);

        farmB = new Farm();
        farmB.setFarmName("M12 Blue Ridge Farm");
        farmB.setLocation("Sector 14");
        farmB.setOwner(farmerB);
        farmB = farmRepository.save(farmB);

        animalA = new Animal();
        animalA.setAnimalTag("M12-COW-100");
        animalA.setName("M12-Daisy");
        animalA.setBreed("Jersey");
        animalA.setFarm(farmA);
        animalA.setGender(Gender.FEMALE);
        animalA.setLactationStage(LactationStage.MID);
        animalA.setWeight(new BigDecimal("480.0"));
        animalA = animalRepository.save(animalA);

        feedA = new FeedSample();
        feedA.setSampleCode("M12-FS-100");
        feedA.setFeedType(FeedType.CATTLE_FEED_PELLET);
        feedA.setSampleDate(LocalDate.now());
        feedA.setFarm(farmA);
        feedA.setAnimal(animalA);
        feedA = feedSampleRepository.save(feedA);

        testResultA = new TestResult();
        testResultA.setFeedSample(feedA);
        testResultA.setTestDate(LocalDate.now());
        testResultA.setAnalysisSource(AnalysisSource.LAB);
        testResultA.setMoisture(new BigDecimal("12.0"));
        testResultA.setCrudeProtein(new BigDecimal("18.5"));
        testResultA.setFiber(new BigDecimal("21.0"));
        testResultA.setPh(new BigDecimal("6.6"));
        testResultA.setOverallQuality(OverallQuality.GOOD);
        testResultA = testResultRepository.save(testResultA);

        feedPlanA = new FeedPlan();
        feedPlanA.setPlanName("Lactation Optimization Plan");
        feedPlanA.setAnimal(animalA);
        feedPlanA.setFeedSample(feedA);
        feedPlanA.setStartDate(LocalDate.now());
        feedPlanA.setPlannedQuantity(12.0);
        feedPlanA.setStatus("ACTIVE");
        feedPlanA = feedPlanRepository.save(feedPlanA);

        advisoryA = new Advisory();
        advisoryA.setAnimal(animalA);
        advisoryA.setTitle("Adequate Energy Advisory");
        advisoryA.setMessage("Maintain current ration to sustain milk yield.");
        advisoryA.setAdvisoryType(AdvisoryType.NUTRITION);
        advisoryA.setPriority(Priority.LOW);
        advisoryA.setIsRead(false);
        advisoryA = advisoryRepository.save(advisoryA);

        consultationA = new Consultation();
        consultationA.setFarmer(farmerA);
        consultationA.setExpert(expertA);
        consultationA.setAnimal(animalA);
        consultationA.setFeedSample(feedA);
        consultationA.setSubject("M12 Feed Review");
        consultationA.setFarmerMessage("Please evaluate if ration is balanced.");
        consultationA.setRequestDate(LocalDate.now());
        consultationA.setStatus(ConsultationStatus.RESPONDED);
        consultationA.setExpertResponse("Ration is balanced for mid lactation.");
        consultationA.setExpertNotes("Keep observing daily dry matter intake.");
        consultationA = consultationRepository.save(consultationA);
    }

    @AfterEach
    void tearDown() {
        if (consultationA != null && consultationA.getId() != null) {
            consultationRepository.delete(consultationA);
        }
        if (advisoryA != null && advisoryA.getId() != null) {
            advisoryRepository.delete(advisoryA);
        }
        if (feedPlanA != null && feedPlanA.getId() != null) {
            feedPlanRepository.delete(feedPlanA);
        }
        if (testResultA != null && testResultA.getId() != null) {
            testResultRepository.delete(testResultA);
        }
        if (feedA != null && feedA.getId() != null) {
            feedSampleRepository.delete(feedA);
        }
        if (animalA != null && animalA.getId() != null) {
            animalRepository.delete(animalA);
        }
        if (farmA != null && farmA.getId() != null) {
            farmRepository.delete(farmA);
        }
        if (farmB != null && farmB.getId() != null) {
            farmRepository.delete(farmB);
        }
        if (expertA != null && expertA.getId() != null) {
            expertRepository.delete(expertA);
        }
        if (expertB != null && expertB.getId() != null) {
            expertRepository.delete(expertB);
        }
        userRepository.findByEmail("farmerA_m12@test.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("farmerB_m12@test.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("dr_smith_m12@test.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("dr_jones_m12@test.com").ifPresent(userRepository::delete);
    }

    // ── Animal Evidence Endpoint Tests ─────────────────────────

    @Test
    @DisplayName("GET /api/evidence/animals/{id} without token returns 401 Unauthorized")
    void testGetEvidenceForAnimal_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/evidence/animals/" + animalA.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/evidence/animals/{id} by owning farmer returns 200 with full evidence payload")
    void testGetEvidenceForAnimal_OwningFarmer_Returns200() throws Exception {
        mockMvc.perform(get("/api/evidence/animals/" + animalA.getId())
                        .header("Authorization", "Bearer " + tokenFarmerA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.animal.animalTag", is("M12-COW-100")))
                .andExpect(jsonPath("$.feedEvidence", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.feedEvidence[0].sampleCode", is("M12-FS-100")))
                .andExpect(jsonPath("$.testEvidence", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.feedPlans", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.advisories", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.disclaimer", containsString("Veterinarian")));
    }

    @Test
    @DisplayName("GET /api/evidence/animals/{id} by cross-owner farmer returns 403 Forbidden")
    void testGetEvidenceForAnimal_CrossOwnerFarmer_Returns403() throws Exception {
        mockMvc.perform(get("/api/evidence/animals/" + animalA.getId())
                        .header("Authorization", "Bearer " + tokenFarmerB)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/evidence/animals/{id} by assigned expert returns 200 OK")
    void testGetEvidenceForAnimal_AssignedExpert_Returns200() throws Exception {
        mockMvc.perform(get("/api/evidence/animals/" + animalA.getId())
                        .header("Authorization", "Bearer " + tokenExpertA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.animal.animalTag", is("M12-COW-100")));
    }

    @Test
    @DisplayName("GET /api/evidence/animals/{id} by unassigned expert returns 403 Forbidden")
    void testGetEvidenceForAnimal_UnassignedExpert_Returns403() throws Exception {
        mockMvc.perform(get("/api/evidence/animals/" + animalA.getId())
                        .header("Authorization", "Bearer " + tokenExpertB)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/evidence/animals/{id} for non-existent animal returns 404 Not Found")
    void testGetEvidenceForAnimal_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/evidence/animals/999999")
                        .header("Authorization", "Bearer " + tokenFarmerA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    // ── Consultation Evidence Endpoint Tests ───────────────────

    @Test
    @DisplayName("GET /api/evidence/consultations/{id} without token returns 401 Unauthorized")
    void testGetEvidenceForConsultation_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/evidence/consultations/" + consultationA.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/evidence/consultations/{id} by owning farmer returns 200 with consultation details")
    void testGetEvidenceForConsultation_OwningFarmer_Returns200() throws Exception {
        mockMvc.perform(get("/api/evidence/consultations/" + consultationA.getId())
                        .header("Authorization", "Bearer " + tokenFarmerA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consultation.id", is(consultationA.getId().intValue())))
                .andExpect(jsonPath("$.consultation.subject", is("M12 Feed Review")))
                .andExpect(jsonPath("$.consultation.expertRecommendation", is("Ration is balanced for mid lactation.")))
                .andExpect(jsonPath("$.animal.animalTag", is("M12-COW-100")));
    }

    @Test
    @DisplayName("GET /api/evidence/consultations/{id} by cross-owner farmer returns 403 Forbidden")
    void testGetEvidenceForConsultation_CrossOwnerFarmer_Returns403() throws Exception {
        mockMvc.perform(get("/api/evidence/consultations/" + consultationA.getId())
                        .header("Authorization", "Bearer " + tokenFarmerB)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/evidence/consultations/{id} by assigned expert returns 200 OK")
    void testGetEvidenceForConsultation_AssignedExpert_Returns200() throws Exception {
        mockMvc.perform(get("/api/evidence/consultations/" + consultationA.getId())
                        .header("Authorization", "Bearer " + tokenExpertA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consultation.id", is(consultationA.getId().intValue())))
                .andExpect(jsonPath("$.consultation.expertRecommendation", is("Ration is balanced for mid lactation.")));
    }

    @Test
    @DisplayName("GET /api/evidence/consultations/{id} by unassigned expert returns 403 Forbidden")
    void testGetEvidenceForConsultation_UnassignedExpert_Returns403() throws Exception {
        mockMvc.perform(get("/api/evidence/consultations/" + consultationA.getId())
                        .header("Authorization", "Bearer " + tokenExpertB)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/evidence/consultations/{id} for non-existent consultation returns 404 Not Found")
    void testGetEvidenceForConsultation_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/evidence/consultations/999999")
                        .header("Authorization", "Bearer " + tokenFarmerA)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
