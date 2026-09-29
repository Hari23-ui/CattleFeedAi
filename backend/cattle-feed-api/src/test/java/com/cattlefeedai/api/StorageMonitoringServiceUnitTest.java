package com.cattlefeedai.api;

import com.cattlefeedai.api.config.StorageMonitoringConfig;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.SensorReading;
import com.cattlefeedai.api.entity.StorageUnit;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.MonitoringStatus;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.AlertService;
import com.cattlefeedai.api.service.StorageMonitoringService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class StorageMonitoringServiceUnitTest {

    private StorageMonitoringConfig config;
    private AlertRepository alertRepository;
    private AlertService alertService;
    private StorageMonitoringService monitoringService;

    private User owner;
    private Farm farm;
    private StorageUnit storageUnit;

    static class TestSecurityUtils extends SecurityUtils {
        private User currentUser;

        public TestSecurityUtils(User user) {
            super(null);
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
        config = new StorageMonitoringConfig();
        alertRepository = Mockito.mock(AlertRepository.class);

        owner = new User();
        owner.setId(101L);
        owner.setEmail("farmer@test.com");
        owner.setRole(Role.FARMER);

        TestSecurityUtils securityUtils = new TestSecurityUtils(owner);
        alertService = new AlertService(alertRepository, securityUtils);
        monitoringService = new StorageMonitoringService(config, alertService);

        farm = new Farm();
        farm.setId(1L);
        farm.setFarmName("Green Valley Farm");
        farm.setOwner(owner);

        storageUnit = new StorageUnit();
        storageUnit.setId(10L);
        storageUnit.setName("Maize Silage Bunker 01");
        storageUnit.setDeviceId("ESP32-STORAGE-001");
        storageUnit.setFarm(farm);

        when(alertRepository.save(any(Alert.class))).thenAnswer(i -> {
            Alert a = i.getArgument(0);
            if (a.getId() == null) {
                a.setId(501L);
            }
            return a;
        });
    }

    @Test
    @DisplayName("Temperature Sudden Change: Generates warning alert when change >= 3.0°C")
    void testSuddenTemperatureChange_GeneratesAlert() {
        SensorReading prev = new SensorReading();
        prev.setTemperature(new BigDecimal("26.5"));
        prev.setReadingTime(LocalDateTime.now().minusHours(2));

        SensorReading current = new SensorReading();
        current.setTemperature(new BigDecimal("30.1")); // change +3.6°C
        current.setReadingTime(LocalDateTime.now());

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                eq(101L), eq("STORAGE_UNIT"), eq(10L), any()
        )).thenReturn(false);

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, prev);

        assertFalse(alerts.isEmpty());
        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(AlertType.STORAGE, created.getAlertType());
        assertEquals(Severity.WARNING, created.getSeverity());
        assertTrue(created.getTitle().contains("Storage Temperature Alert"));
        assertTrue(created.getMessage().contains("Temperature change detected"));
        assertTrue(created.getMessage().contains("+3.6"));
        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    @DisplayName("Temperature Upper Bound: Generates high severity alert when temperature > 35°C")
    void testTemperatureUpperBound_GeneratesHighAlert() {
        SensorReading current = new SensorReading();
        current.setTemperature(new BigDecimal("38.5")); // exceeds 35°C
        current.setReadingTime(LocalDateTime.now());

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                eq(101L), eq("STORAGE_UNIT"), eq(10L), any()
        )).thenReturn(false);

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, null);

        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(AlertType.STORAGE, created.getAlertType());
        assertEquals(Severity.HIGH, created.getSeverity());
        assertTrue(created.getTitle().contains("Abnormal Temperature Alert"));
        assertTrue(created.getMessage().contains("Potential storage condition concern"));
    }

    @Test
    @DisplayName("pH Sudden Change: Generates warning alert when pH change >= 0.5")
    void testSuddenPhChange_GeneratesAlert() {
        SensorReading prev = new SensorReading();
        prev.setPh(new BigDecimal("4.1"));
        prev.setReadingTime(LocalDateTime.now().minusHours(3));

        SensorReading current = new SensorReading();
        current.setPh(new BigDecimal("4.8")); // change +0.7
        current.setReadingTime(LocalDateTime.now());

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                eq(101L), eq("STORAGE_UNIT"), eq(10L), any()
        )).thenReturn(false);

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, prev);

        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(AlertType.STORAGE, created.getAlertType());
        assertEquals(Severity.WARNING, created.getSeverity());
        assertTrue(created.getTitle().contains("Storage pH Change Alert"));
        assertTrue(created.getMessage().contains("pH change detected"));
        assertTrue(created.getMessage().contains("+0.7"));
    }

    @Test
    @DisplayName("pH Upper Bound: Generates high severity alert when pH > 5.5")
    void testPhUpperBound_GeneratesAlert() {
        SensorReading current = new SensorReading();
        current.setPh(new BigDecimal("6.2"));
        current.setReadingTime(LocalDateTime.now());

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                eq(101L), eq("STORAGE_UNIT"), eq(10L), any()
        )).thenReturn(false);

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, null);

        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(Severity.HIGH, created.getSeverity());
        assertTrue(created.getTitle().contains("Abnormal pH Alert"));
    }

    @Test
    @DisplayName("Alert Deduplication: Avoids duplicate alert if identical alert exists")
    void testAlertDeduplication() {
        SensorReading current = new SensorReading();
        current.setTemperature(new BigDecimal("39.0"));

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                eq(101L), eq("STORAGE_UNIT"), eq(10L), any()
        )).thenReturn(true);

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, null);

        assertTrue(alerts.isEmpty());
        verify(alertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Normal Condition: Does NOT trigger alert when readings are within stable limits")
    void testNormalCondition_NoAlertsCreated() {
        SensorReading prev = new SensorReading();
        prev.setTemperature(new BigDecimal("26.0"));
        prev.setPh(new BigDecimal("4.1"));

        SensorReading current = new SensorReading();
        current.setTemperature(new BigDecimal("26.5")); // change +0.5°C (below 3.0°C threshold)
        current.setPh(new BigDecimal("4.2")); // change +0.1 (below 0.5 threshold)

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, prev);

        assertTrue(alerts.isEmpty());
        verify(alertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Missing / Null Sensor Data: Does not throw exception and handles null gracefully")
    void testNullMeasurements_HandledGracefully() {
        SensorReading current = new SensorReading();
        current.setTemperature(null);
        current.setPh(null);
        current.setHumidity(null);

        List<Alert> alerts = monitoringService.evaluateReading(storageUnit, current, null);

        assertTrue(alerts.isEmpty());
        verify(alertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Monitoring Status: Returns ATTENTION_REQUIRED if unread alerts exist or values out of bounds")
    void testDetermineStatus_AttentionRequired() {
        SensorReading reading = new SensorReading();
        reading.setTemperature(new BigDecimal("30.0"));
        reading.setPh(new BigDecimal("4.2"));
        reading.setReadingTime(LocalDateTime.now());

        MonitoringStatus status = monitoringService.determineStatus(storageUnit, reading, 1L);
        assertEquals(MonitoringStatus.ATTENTION_REQUIRED, status);
    }

    @Test
    @DisplayName("Monitoring Status: Returns NORMAL when fresh reading is within thresholds and no unread alerts")
    void testDetermineStatus_Normal() {
        SensorReading reading = new SensorReading();
        reading.setTemperature(new BigDecimal("25.0"));
        reading.setPh(new BigDecimal("4.2"));
        reading.setReadingTime(LocalDateTime.now());

        MonitoringStatus status = monitoringService.determineStatus(storageUnit, reading, 0L);
        assertEquals(MonitoringStatus.NORMAL, status);
    }

    @Test
    @DisplayName("Monitoring Status: Returns NO_RECENT_DATA when reading is older than 24 hours")
    void testDetermineStatus_NoRecentData() {
        SensorReading reading = new SensorReading();
        reading.setTemperature(new BigDecimal("25.0"));
        reading.setPh(new BigDecimal("4.2"));
        reading.setReadingTime(LocalDateTime.now().minusHours(30)); // 30h ago

        MonitoringStatus status = monitoringService.determineStatus(storageUnit, reading, 0L);
        assertEquals(MonitoringStatus.NO_RECENT_DATA, status);
    }

    @Test
    @DisplayName("Sensor Offline Check: Generates infrastructure alert when sensor inactive > 24 hours")
    void testCheckAndAlertOffline_GeneratesAlert() {
        SensorReading reading = new SensorReading();
        reading.setReadingTime(LocalDateTime.now().minusHours(28));

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                eq(101L), eq("STORAGE_UNIT"), eq(10L), any()
        )).thenReturn(false);

        Alert alert = monitoringService.checkAndAlertOffline(storageUnit, reading);

        assertNotNull(alert);
        assertEquals(AlertType.STORAGE, alert.getAlertType());
        assertTrue(alert.getTitle().contains("Storage Sensor Offline"));
        assertTrue(alert.getMessage().contains("Check device connectivity"));
        verify(alertRepository).save(any(Alert.class));
    }
}
