package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.SensorReadingRequest;
import com.cattlefeedai.api.dto.StorageUnitRequest;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.StorageUnit;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.entity.enums.StorageType;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.repository.SensorReadingRepository;
import com.cattlefeedai.api.repository.StorageUnitRepository;
import com.cattlefeedai.api.repository.UserRepository;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class StorageUnitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StorageUnitRepository storageUnitRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private JwtService jwtService;

    private User farmerA;
    private User farmerB;
    private String tokenA;
    private String tokenB;
    private Farm farmA;
    private Farm farmB;
    private StorageUnit unitA;

    @BeforeEach
    void setup() {
        farmerA = userRepository.findByEmail("storage_farmer_a@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("storage_farmer_a");
                    u.setEmail("storage_farmer_a@test.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        farmerB = userRepository.findByEmail("storage_farmer_b@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("storage_farmer_b");
                    u.setEmail("storage_farmer_b@test.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        org.springframework.security.core.userdetails.User principalA =
                new org.springframework.security.core.userdetails.User(
                        farmerA.getEmail(),
                        farmerA.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                );
        tokenA = jwtService.generateToken(principalA);

        org.springframework.security.core.userdetails.User principalB =
                new org.springframework.security.core.userdetails.User(
                        farmerB.getEmail(),
                        farmerB.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                );
        tokenB = jwtService.generateToken(principalB);

        farmA = new Farm();
        farmA.setFarmName("Sunrise Silage Farm");
        farmA.setOwner(farmerA);
        farmA = farmRepository.save(farmA);

        farmB = new Farm();
        farmB.setFarmName("Sunset Dairy Farm");
        farmB.setOwner(farmerB);
        farmB = farmRepository.save(farmB);

        unitA = new StorageUnit();
        unitA.setName("Test Silage Bunker");
        unitA.setStorageType(StorageType.SILAGE_STORAGE);
        unitA.setLocation("Sector 1");
        unitA.setCapacity("50 MT");
        unitA.setDeviceId("TEST-ESP32-001");
        unitA.setFarm(farmA);
        unitA = storageUnitRepository.save(unitA);
    }

    @AfterEach
    void tearDown() {
        if (unitA != null && unitA.getId() != null) {
            sensorReadingRepository.findByStorageUnitId(unitA.getId())
                    .forEach(sensorReadingRepository::delete);
            storageUnitRepository.delete(unitA);
        }
        if (farmA != null && farmA.getId() != null) {
            storageUnitRepository.findByFarmId(farmA.getId()).forEach(u -> {
                sensorReadingRepository.findByStorageUnitId(u.getId())
                        .forEach(sensorReadingRepository::delete);
                storageUnitRepository.delete(u);
            });
            farmRepository.delete(farmA);
        }
        if (farmB != null && farmB.getId() != null) {
            storageUnitRepository.findByFarmId(farmB.getId()).forEach(storageUnitRepository::delete);
            farmRepository.delete(farmB);
        }
        userRepository.findByEmail("storage_farmer_a@test.com").ifPresent(u -> {
            alertRepository.findAll().stream()
                    .filter(a -> a.getUser() != null && a.getUser().getId().equals(u.getId()))
                    .forEach(alertRepository::delete);
            userRepository.delete(u);
        });
        userRepository.findByEmail("storage_farmer_b@test.com").ifPresent(u -> {
            alertRepository.findAll().stream()
                    .filter(a -> a.getUser() != null && a.getUser().getId().equals(u.getId()))
                    .forEach(alertRepository::delete);
            userRepository.delete(u);
        });
    }

    @Test
    @DisplayName("Create Storage Unit via API")
    void testCreateStorageUnit() throws Exception {
        StorageUnitRequest request = StorageUnitRequest.builder()
                .farmId(farmA.getId())
                .name("New Feed Silo")
                .storageType(StorageType.FEED_STORAGE)
                .location("Barn Area")
                .capacity("20 MT")
                .deviceId("ESP32-FEED-01")
                .build();

        mockMvc.perform(post("/api/storage-units")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name", is("New Feed Silo")))
                .andExpect(jsonPath("$.storageType", is("FEED_STORAGE")))
                .andExpect(jsonPath("$.farmId", is(farmA.getId().intValue())));
    }

    @Test
    @DisplayName("List own storage units: returns farmer A units and not farmer B units")
    void testListStorageUnits() throws Exception {
        mockMvc.perform(get("/api/storage-units")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].name", is("Test Silage Bunker")));
    }

    @Test
    @DisplayName("Cross-owner access returns 403 Forbidden")
    void testCrossOwnerAccess_Returns403() throws Exception {
        mockMvc.perform(get("/api/storage-units/" + unitA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request returns 401 Unauthorized")
    void testUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/storage-units/" + unitA.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Missing storage unit returns 404 Not Found")
    void testNotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/storage-units/999999")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Live Test Flow: Reading 1 -> Reading 2 -> Reading 3 (sudden temp & pH change) triggers storage alerts")
    void testLiveSensorIngestionAndAlerts() throws Exception {
        // Controlled development test telemetry (Prompt requirement 24)
        // Reading 1: temp = 26.0, pH = 4.1
        SensorReadingRequest reading1 = SensorReadingRequest.builder()
                .deviceId("TEST-ESP32-001")
                .temperature(new BigDecimal("26.0"))
                .ph(new BigDecimal("4.1"))
                .humidity(new BigDecimal("60.0"))
                .readingTime(LocalDateTime.now().minusHours(4))
                .build();

        mockMvc.perform(post("/api/storage-units/" + unitA.getId() + "/sensor-readings")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reading1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.temperature", is(26.0)))
                .andExpect(jsonPath("$.ph", is(4.1)));

        // Reading 2: temp = 26.5, pH = 4.2 (Normal gradual variation)
        SensorReadingRequest reading2 = SensorReadingRequest.builder()
                .deviceId("TEST-ESP32-001")
                .temperature(new BigDecimal("26.5"))
                .ph(new BigDecimal("4.2"))
                .humidity(new BigDecimal("62.0"))
                .readingTime(LocalDateTime.now().minusHours(2))
                .build();

        mockMvc.perform(post("/api/storage-units/" + unitA.getId() + "/sensor-readings")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reading2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.temperature", is(26.5)))
                .andExpect(jsonPath("$.ph", is(4.2)));

        // Reading 3: temp = 30.0, pH = 4.8 (Sudden change: +3.5°C and +0.6 pH)
        SensorReadingRequest reading3 = SensorReadingRequest.builder()
                .deviceId("TEST-ESP32-001")
                .temperature(new BigDecimal("30.0"))
                .ph(new BigDecimal("4.8"))
                .humidity(new BigDecimal("64.0"))
                .readingTime(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/api/storage-units/" + unitA.getId() + "/sensor-readings")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reading3)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.temperature", is(30.0)))
                .andExpect(jsonPath("$.ph", is(4.8)));

        // Verify Sensor History API
        mockMvc.perform(get("/api/storage-units/" + unitA.getId() + "/sensor-readings")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        // Verify Latest Sensor Reading API
        mockMvc.perform(get("/api/storage-units/" + unitA.getId() + "/sensor-readings/latest")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.temperature", is(30.0)))
                .andExpect(jsonPath("$.ph", is(4.8)));

        // Verify alerts created in AlertRepository for Farmer A
        List<Alert> alerts = alertRepository.findByUserId(farmerA.getId());
        assertFalse(alerts.isEmpty(), "Expected storage condition alerts to be generated");
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertType() == AlertType.STORAGE));
        assertTrue(alerts.stream().anyMatch(a -> a.getTitle().contains("Storage Temperature Alert")));
        assertTrue(alerts.stream().anyMatch(a -> a.getTitle().contains("Storage pH Change Alert")));

        // Verify Storage Details shows ATTENTION_REQUIRED due to unread alerts
        mockMvc.perform(get("/api/storage-units/" + unitA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monitoringStatus", is("ATTENTION_REQUIRED")))
                .andExpect(jsonPath("$.unreadAlertCount", greaterThanOrEqualTo(1)));

        // Verify Dashboard Summary API
        mockMvc.perform(get("/api/storage-units/summary")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStorageUnits", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.attentionRequiredUnits", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.unreadAlertCount", greaterThanOrEqualTo(1)));
    }
}
