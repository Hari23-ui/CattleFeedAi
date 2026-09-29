package com.cattlefeedai.api;

import com.cattlefeedai.api.config.StorageMonitoringConfig;
import com.cattlefeedai.api.dto.SensorReadingRequest;
import com.cattlefeedai.api.dto.SensorReadingResponse;
import com.cattlefeedai.api.dto.StorageMonitoringSummaryDto;
import com.cattlefeedai.api.dto.StorageUnitRequest;
import com.cattlefeedai.api.dto.StorageUnitResponse;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.SensorReading;
import com.cattlefeedai.api.entity.StorageUnit;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.entity.enums.SensorSource;
import com.cattlefeedai.api.entity.enums.StorageType;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.repository.SensorReadingRepository;
import com.cattlefeedai.api.repository.StorageUnitRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.AlertService;
import com.cattlefeedai.api.service.StorageMonitoringService;
import com.cattlefeedai.api.service.StorageUnitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class StorageUnitServiceUnitTest {

    private StorageUnitRepository storageUnitRepository;
    private SensorReadingRepository sensorReadingRepository;
    private FarmRepository farmRepository;
    private AlertRepository alertRepository;
    private StorageMonitoringService storageMonitoringService;
    private TestSecurityUtils securityUtils;
    private StorageUnitService storageUnitService;

    private User farmerA;
    private User farmerB;
    private Farm farmA;
    private StorageUnit storageUnitA;

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
        storageUnitRepository = Mockito.mock(StorageUnitRepository.class);
        sensorReadingRepository = Mockito.mock(SensorReadingRepository.class);
        farmRepository = Mockito.mock(FarmRepository.class);
        alertRepository = Mockito.mock(AlertRepository.class);

        farmerA = new User();
        farmerA.setId(101L);
        farmerA.setEmail("farmerA@test.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(102L);
        farmerB.setEmail("farmerB@test.com");
        farmerB.setRole(Role.FARMER);

        farmA = new Farm();
        farmA.setId(1L);
        farmA.setFarmName("Valley Farm");
        farmA.setOwner(farmerA);

        storageUnitA = new StorageUnit();
        storageUnitA.setId(10L);
        storageUnitA.setName("Maize Silage Bunker 01");
        storageUnitA.setStorageType(StorageType.SILAGE_STORAGE);
        storageUnitA.setLocation("North Field Sector 2");
        storageUnitA.setCapacity("50 Tons");
        storageUnitA.setDeviceId("ESP32-STORAGE-001");
        storageUnitA.setFarm(farmA);

        securityUtils = new TestSecurityUtils(farmerA);

        AlertService alertService = new AlertService(alertRepository, securityUtils);
        storageMonitoringService = new StorageMonitoringService(new StorageMonitoringConfig(), alertService);

        storageUnitService = new StorageUnitService(
                storageUnitRepository,
                sensorReadingRepository,
                farmRepository,
                alertRepository,
                storageMonitoringService,
                securityUtils
        );
    }

    @Test
    @DisplayName("Create Storage Unit: Successfully creates storage unit under owned farm")
    void testCreateStorageUnit_Success() {
        StorageUnitRequest request = StorageUnitRequest.builder()
                .farmId(1L)
                .name("New Bunker")
                .storageType(StorageType.SILAGE_STORAGE)
                .location("North Sector")
                .capacity("30 Tons")
                .deviceId("ESP32-99")
                .build();

        when(farmRepository.findById(1L)).thenReturn(Optional.of(farmA));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(i -> {
            StorageUnit su = i.getArgument(0);
            su.setId(20L);
            return su;
        });

        StorageUnitResponse response = storageUnitService.createStorageUnit(request);

        assertNotNull(response);
        assertEquals(20L, response.getId());
        assertEquals("New Bunker", response.getName());
        verify(storageUnitRepository).save(any(StorageUnit.class));
    }

    @Test
    @DisplayName("Create Storage Unit: Throws 403 when farmer does not own the farm")
    void testCreateStorageUnit_CrossOwner_Throws403() {
        Farm farmB = new Farm();
        farmB.setId(2L);
        farmB.setFarmName("Other Farm");
        farmB.setOwner(farmerB);

        StorageUnitRequest request = StorageUnitRequest.builder()
                .farmId(2L)
                .name("Unauthorized Bunker")
                .storageType(StorageType.FEED_STORAGE)
                .build();

        when(farmRepository.findById(2L)).thenReturn(Optional.of(farmB));

        assertThrows(ResourceOwnershipException.class, () -> {
            storageUnitService.createStorageUnit(request);
        });
        verify(storageUnitRepository, never()).save(any());
    }

    @Test
    @DisplayName("List Storage Units: Returns only storage units belonging to authenticated farmer")
    void testGetAllStorageUnits_FarmerIsolation() {
        when(storageUnitRepository.findByFarmOwnerId(101L)).thenReturn(List.of(storageUnitA));

        List<StorageUnitResponse> responses = storageUnitService.getAllStorageUnits(null);

        assertEquals(1, responses.size());
        assertEquals("Maize Silage Bunker 01", responses.get(0).getName());
        verify(storageUnitRepository).findByFarmOwnerId(101L);
    }

    @Test
    @DisplayName("Get Storage Unit by ID: Successfully returns unit for owner")
    void testGetStorageUnitById_Success() {
        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(storageUnitA));

        StorageUnitResponse response = storageUnitService.getStorageUnitById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Maize Silage Bunker 01", response.getName());
    }

    @Test
    @DisplayName("Get Storage Unit by ID: Throws 403 when farmer attempts cross-owner access")
    void testGetStorageUnitById_CrossOwner_Throws403() {
        Farm farmB = new Farm();
        farmB.setId(2L);
        farmB.setFarmName("Other Farm");
        farmB.setOwner(farmerB);

        StorageUnit unitB = new StorageUnit();
        unitB.setId(11L);
        unitB.setFarm(farmB);

        when(storageUnitRepository.findById(11L)).thenReturn(Optional.of(unitB));

        assertThrows(ResourceOwnershipException.class, () -> {
            storageUnitService.getStorageUnitById(11L);
        });
    }

    @Test
    @DisplayName("Get Storage Unit by ID: Throws 404 when unit does not exist")
    void testGetStorageUnitById_NotFound_Throws404() {
        when(storageUnitRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            storageUnitService.getStorageUnitById(999L);
        });
    }

    @Test
    @DisplayName("Submit Sensor Reading: Persists reading and triggers monitoring evaluation")
    void testRecordSensorReading_Success() {
        SensorReadingRequest request = SensorReadingRequest.builder()
                .deviceId("ESP32-STORAGE-001")
                .temperature(new BigDecimal("28.4"))
                .ph(new BigDecimal("4.2"))
                .humidity(new BigDecimal("65.0"))
                .build();

        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(storageUnitA));
        when(sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(10L))
                .thenReturn(Optional.empty());
        when(sensorReadingRepository.save(any(SensorReading.class))).thenAnswer(i -> {
            SensorReading r = i.getArgument(0);
            r.setId(301L);
            return r;
        });

        SensorReadingResponse response = storageUnitService.recordSensorReading(10L, request);

        assertNotNull(response);
        assertEquals(301L, response.getId());
        assertEquals(new BigDecimal("28.4"), response.getTemperature());
        assertEquals(new BigDecimal("4.2"), response.getPh());
        assertEquals(SensorSource.IOT, response.getSource());
        verify(sensorReadingRepository).save(any(SensorReading.class));
    }

    @Test
    @DisplayName("Submit Sensor Reading: Throws 403 on cross-owner attempt")
    void testRecordSensorReading_CrossOwner_Throws403() {
        Farm farmB = new Farm();
        farmB.setId(2L);
        farmB.setFarmName("Other Farm");
        farmB.setOwner(farmerB);

        StorageUnit unitB = new StorageUnit();
        unitB.setId(11L);
        unitB.setFarm(farmB);

        when(storageUnitRepository.findById(11L)).thenReturn(Optional.of(unitB));

        SensorReadingRequest request = SensorReadingRequest.builder()
                .temperature(new BigDecimal("25.0"))
                .build();

        assertThrows(ResourceOwnershipException.class, () -> {
            storageUnitService.recordSensorReading(11L, request);
        });
        verify(sensorReadingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sensor History: Retrieves chronological telemetry list")
    void testGetSensorReadings_Success() {
        SensorReading r1 = new SensorReading();
        r1.setId(1L);
        r1.setTemperature(new BigDecimal("26.0"));
        r1.setPh(new BigDecimal("4.1"));
        r1.setReadingTime(LocalDateTime.now().minusHours(2));

        SensorReading r2 = new SensorReading();
        r2.setId(2L);
        r2.setTemperature(new BigDecimal("26.5"));
        r2.setPh(new BigDecimal("4.2"));
        r2.setReadingTime(LocalDateTime.now().minusHours(1));

        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(storageUnitA));
        when(sensorReadingRepository.findByStorageUnitIdOrderByReadingTimeDesc(10L))
                .thenReturn(List.of(r2, r1));

        List<SensorReadingResponse> history = storageUnitService.getSensorReadings(10L);

        assertEquals(2, history.size());
        assertEquals(new BigDecimal("26.5"), history.get(0).getTemperature());
    }

    @Test
    @DisplayName("Latest Reading: Retrieves single latest reading or throws 404 if empty")
    void testGetLatestSensorReading() {
        SensorReading r = new SensorReading();
        r.setId(5L);
        r.setTemperature(new BigDecimal("27.0"));
        r.setReadingTime(LocalDateTime.now());

        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(storageUnitA));
        when(sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(10L))
                .thenReturn(Optional.of(r));

        SensorReadingResponse latest = storageUnitService.getLatestSensorReading(10L);
        assertNotNull(latest);
        assertEquals(5L, latest.getId());

        when(sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(10L))
                .thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> {
            storageUnitService.getLatestSensorReading(10L);
        });
    }

    @Test
    @DisplayName("Monitoring Summary: Computes aggregated metrics for dashboard card")
    void testGetStorageMonitoringSummary() {
        when(storageUnitRepository.findByFarmOwnerId(101L)).thenReturn(List.of(storageUnitA));
        when(sensorReadingRepository.findFirstByStorageUnitIdOrderByReadingTimeDesc(10L)).thenReturn(Optional.empty());
        when(alertRepository.findByUserIdAndIsReadFalse(101L)).thenReturn(Collections.emptyList());

        StorageMonitoringSummaryDto summary = storageUnitService.getStorageMonitoringSummary();

        assertNotNull(summary);
        assertEquals(1, summary.getTotalStorageUnits());
        assertEquals(1, summary.getMonitoringUnits());
    }
}
