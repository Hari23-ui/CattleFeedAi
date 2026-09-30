package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.FeedPlanRequest;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.*;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class FeedPlanIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private FeedSampleRepository feedSampleRepository;

    @Autowired
    private FeedPlanRepository feedPlanRepository;

    @Autowired
    private JwtService jwtService;

    private User farmerA;
    private User farmerB;
    private Farm farmA;
    private Farm farmB;
    private Animal animalA;
    private Animal animalB;
    private FeedSample feedA;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setup() {
        farmerA = userRepository.findByEmail("farmerA_fp_test@m11.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("farmerA_fp");
                    u.setEmail("farmerA_fp_test@m11.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        farmerB = userRepository.findByEmail("farmerB_fp_test@m11.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("farmerB_fp");
                    u.setEmail("farmerB_fp_test@m11.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        tokenA = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        farmerA.getEmail(),
                        farmerA.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                )
        );

        tokenB = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        farmerB.getEmail(),
                        farmerB.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                )
        );

        farmA = new Farm();
        farmA.setFarmName("Alpha Farm M11");
        farmA.setLocation("Zone 1");
        farmA.setOwner(farmerA);
        farmA = farmRepository.save(farmA);

        farmB = new Farm();
        farmB.setFarmName("Beta Farm M11");
        farmB.setLocation("Zone 2");
        farmB.setOwner(farmerB);
        farmB = farmRepository.save(farmB);

        animalA = new Animal();
        animalA.setAnimalTag("TAG-M11-A");
        animalA.setName("M11 Cow Alpha");
        animalA.setBreed("Jersey");
        animalA.setGender(Gender.FEMALE);
        animalA.setFarm(farmA);
        animalA.setLactationStage(LactationStage.MID);
        animalA = animalRepository.save(animalA);

        animalB = new Animal();
        animalB.setAnimalTag("TAG-M11-B");
        animalB.setName("M11 Cow Beta");
        animalB.setBreed("Holstein");
        animalB.setGender(Gender.FEMALE);
        animalB.setFarm(farmB);
        animalB.setLactationStage(LactationStage.EARLY);
        animalB = animalRepository.save(animalB);

        feedA = new FeedSample();
        feedA.setSampleCode("FS-M11-" + System.currentTimeMillis());
        feedA.setFeedType(FeedType.CATTLE_FEED_PELLET);
        feedA.setSampleDate(LocalDate.now());
        feedA.setFarm(farmA);
        feedA.setAnimal(animalA);
        feedA = feedSampleRepository.save(feedA);
    }

    @AfterEach
    void tearDown() {
        if (feedA != null && feedA.getId() != null) {
            feedPlanRepository.findAll().stream()
                    .filter(fp -> fp.getFeedSample() != null && fp.getFeedSample().getId().equals(feedA.getId()))
                    .forEach(feedPlanRepository::delete);
            feedSampleRepository.delete(feedA);
        }
        if (animalA != null && animalA.getId() != null) {
            feedPlanRepository.findAll().stream()
                    .filter(fp -> fp.getAnimal() != null && fp.getAnimal().getId().equals(animalA.getId()))
                    .forEach(feedPlanRepository::delete);
            animalRepository.delete(animalA);
        }
        if (animalB != null && animalB.getId() != null) {
            feedPlanRepository.findAll().stream()
                    .filter(fp -> fp.getAnimal() != null && fp.getAnimal().getId().equals(animalB.getId()))
                    .forEach(feedPlanRepository::delete);
            animalRepository.delete(animalB);
        }
        if (farmA != null && farmA.getId() != null) {
            farmRepository.delete(farmA);
        }
        if (farmB != null && farmB.getId() != null) {
            farmRepository.delete(farmB);
        }
        userRepository.findByEmail("farmerA_fp_test@m11.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("farmerB_fp_test@m11.com").ifPresent(userRepository::delete);
    }

    @Test
    @DisplayName("Unauthenticated access to /api/feed-plans returns 401")
    void test01_UnauthenticatedAccess_Returns401() throws Exception {
        mockMvc.perform(get("/api/feed-plans"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Create FeedPlan returns 201 Created and persists in database")
    void test02_CreateFeedPlan_Success() throws Exception {
        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Integration Test Plan Alpha")
                .description("Test Description")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 10, 31))
                .status("ACTIVE")
                .plannedQuantity(5.0)
                .frequency("DAILY")
                .animalId(animalA.getId())
                .feedSampleId(feedA.getId())
                .build();

        mockMvc.perform(post("/api/feed-plans")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.planName", is("Integration Test Plan Alpha")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.plannedQuantity", is(5.0)))
                .andExpect(jsonPath("$.animal.animalTag", is("TAG-M11-A")))
                .andExpect(jsonPath("$.disclaimer").exists());
    }

    @Test
    @DisplayName("Create FeedPlan with another farmer's animal returns 403 Forbidden")
    void test03_CreateFeedPlan_CrossOwnerAnimal_Returns403() throws Exception {
        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Unauthorized Plan")
                .startDate(LocalDate.of(2026, 10, 1))
                .animalId(animalB.getId()) // Animal B belongs to Farm B / Farmer B
                .build();

        mockMvc.perform(post("/api/feed-plans")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Create FeedPlan with non-existent animal returns 404 Not Found")
    void test04_CreateFeedPlan_NonExistentAnimal_Returns404() throws Exception {
        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Missing Animal Plan")
                .startDate(LocalDate.of(2026, 10, 1))
                .animalId(999999L)
                .build();

        mockMvc.perform(post("/api/feed-plans")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Create FeedPlan with end date before start date returns 400 Bad Request")
    void test05_CreateFeedPlan_InvalidDates_Returns400() throws Exception {
        FeedPlanRequest req = FeedPlanRequest.builder()
                .planName("Invalid Dates Plan")
                .startDate(LocalDate.of(2026, 10, 30))
                .endDate(LocalDate.of(2026, 10, 1))
                .animalId(animalA.getId())
                .build();

        mockMvc.perform(post("/api/feed-plans")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("List FeedPlans returns only current farmer's plans (no leakage)")
    void test06_ListFeedPlans_FarmerIsolation() throws Exception {
        FeedPlan planA = new FeedPlan();
        planA.setPlanName("Alpha Farmer Plan");
        planA.setStartDate(LocalDate.of(2026, 10, 1));
        planA.setStatus("ACTIVE");
        planA.setAnimal(animalA);
        feedPlanRepository.save(planA);

        FeedPlan planB = new FeedPlan();
        planB.setPlanName("Beta Farmer Plan");
        planB.setStartDate(LocalDate.of(2026, 10, 1));
        planB.setStatus("ACTIVE");
        planB.setAnimal(animalB);
        feedPlanRepository.save(planB);

        // Farmer A requests /api/feed-plans
        mockMvc.perform(get("/api/feed-plans")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].planName", is("Alpha Farmer Plan")));

        // Farmer B requests /api/feed-plans
        mockMvc.perform(get("/api/feed-plans")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].planName", is("Beta Farmer Plan")));
    }

    @Test
    @DisplayName("Get FeedPlan by ID returns 200 for owner and 403 for cross-owner")
    void test07_GetFeedPlanById_Owner200_CrossOwner403() throws Exception {
        FeedPlan planA = new FeedPlan();
        planA.setPlanName("Alpha Detail Plan");
        planA.setStartDate(LocalDate.of(2026, 10, 1));
        planA.setStatus("ACTIVE");
        planA.setAnimal(animalA);
        FeedPlan saved = feedPlanRepository.save(planA);

        // Farmer A gets own plan
        mockMvc.perform(get("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saved.getId().intValue())))
                .andExpect(jsonPath("$.planName", is("Alpha Detail Plan")));

        // Farmer B gets Farmer A's plan -> 403 Forbidden
        mockMvc.perform(get("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Update and Delete FeedPlan enforce ownership")
    void test08_UpdateAndDeleteFeedPlan_EnforcesOwnership() throws Exception {
        FeedPlan plan = new FeedPlan();
        plan.setPlanName("Original Plan");
        plan.setStartDate(LocalDate.of(2026, 10, 1));
        plan.setStatus("ACTIVE");
        plan.setAnimal(animalA);
        FeedPlan saved = feedPlanRepository.save(plan);

        FeedPlanRequest updateReq = FeedPlanRequest.builder()
                .planName("Updated Plan Name")
                .startDate(LocalDate.of(2026, 10, 1))
                .endDate(LocalDate.of(2026, 11, 1))
                .status("COMPLETED")
                .animalId(animalA.getId())
                .build();

        // Cross-owner update attempt -> 403
        mockMvc.perform(put("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // Valid owner update -> 200
        mockMvc.perform(put("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planName", is("Updated Plan Name")))
                .andExpect(jsonPath("$.status", is("COMPLETED")));

        // Cross-owner delete attempt -> 403
        mockMvc.perform(delete("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        // Valid owner delete -> 204
        mockMvc.perform(delete("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        // Verify gone -> 404
        mockMvc.perform(get("/api/feed-plans/" + saved.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }
}
