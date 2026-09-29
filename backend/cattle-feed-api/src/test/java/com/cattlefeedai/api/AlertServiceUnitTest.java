package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.AlertResponse;
import com.cattlefeedai.api.dto.UnreadCountResponse;
import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Priority;
import com.cattlefeedai.api.entity.enums.QualityStatus;
import com.cattlefeedai.api.entity.enums.RiskLevel;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.AlertService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AlertServiceUnitTest {

    private AlertRepository alertRepository;
    private TestSecurityUtils securityUtils;
    private AlertService alertService;

    private User farmerA;
    private User farmerB;
    private User adminUser;

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
        alertRepository = Mockito.mock(AlertRepository.class);

        farmerA = new User();
        farmerA.setId(101L);
        farmerA.setEmail("farmerA@test.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(102L);
        farmerB.setEmail("farmerB@test.com");
        farmerB.setRole(Role.FARMER);

        adminUser = new User();
        adminUser.setId(999L);
        adminUser.setEmail("admin@test.com");
        adminUser.setRole(Role.ADMIN);

        securityUtils = new TestSecurityUtils(farmerA);
        alertService = new AlertService(alertRepository, securityUtils);
    }

    @Test
    @DisplayName("List alerts: Returns alerts for authenticated farmer ordered by createdAt desc")
    void testGetAlerts_ReturnsFarmerAlerts() {
        securityUtils.setCurrentUser(farmerA);

        Alert alert1 = new Alert(1L, "Alert 1", "Msg 1", AlertType.FEED_QUALITY, Severity.WARNING, false, LocalDateTime.now(), farmerA, null, null);
        Alert alert2 = new Alert(2L, "Alert 2", "Msg 2", AlertType.HEALTH_RISK, Severity.HIGH, true, LocalDateTime.now().minusHours(1), farmerA, null, null);

        when(alertRepository.findByUserIdOrderByCreatedAtDesc(101L)).thenReturn(List.of(alert1, alert2));

        List<AlertResponse> result = alertService.getAlerts();

        assertEquals(2, result.size());
        assertEquals("Alert 1", result.get(0).getTitle());
        assertEquals("Alert 2", result.get(1).getTitle());
        verify(alertRepository).findByUserIdOrderByCreatedAtDesc(101L);
    }

    @Test
    @DisplayName("Get alert by ID: Successfully retrieves alert when owner matches")
    void testGetAlertById_Success() {
        securityUtils.setCurrentUser(farmerA);

        Alert alert = new Alert(1L, "Alert 1", "Msg 1", AlertType.FEED_QUALITY, Severity.CRITICAL, false, LocalDateTime.now(), farmerA, "TEST_RESULT", 10L);
        when(alertRepository.findById(1L)).thenReturn(Optional.of(alert));

        AlertResponse response = alertService.getAlertById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Alert 1", response.getTitle());
        assertEquals(Severity.CRITICAL, response.getSeverity());
        assertEquals("TEST_RESULT", response.getRelatedEntityType());
        assertEquals(10L, response.getRelatedEntityId());
    }

    @Test
    @DisplayName("Get alert by ID: Throws 403 when farmer tries to access another farmer's alert")
    void testGetAlertById_CrossOwnerAccess_Throws403() {
        securityUtils.setCurrentUser(farmerA);

        // Alert belongs to Farmer B
        Alert alertOfFarmerB = new Alert(2L, "Farmer B's Alert", "Secret", AlertType.FEED_QUALITY, Severity.HIGH, false, LocalDateTime.now(), farmerB, null, null);
        when(alertRepository.findById(2L)).thenReturn(Optional.of(alertOfFarmerB));

        ResourceOwnershipException ex = assertThrows(ResourceOwnershipException.class, () -> {
            alertService.getAlertById(2L);
        });

        assertTrue(ex.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Get alert by ID: Throws 404 when alert does not exist")
    void testGetAlertById_NotFound_Throws404() {
        securityUtils.setCurrentUser(farmerA);
        when(alertRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            alertService.getAlertById(999L);
        });
    }

    @Test
    @DisplayName("Unread count: Returns exact unread count for current farmer")
    void testGetUnreadCount() {
        securityUtils.setCurrentUser(farmerA);
        when(alertRepository.countByUserIdAndIsReadFalse(101L)).thenReturn(3L);

        UnreadCountResponse response = alertService.getUnreadCount();

        assertEquals(3L, response.getUnreadCount());
        assertEquals(3L, response.getCount());
        verify(alertRepository).countByUserIdAndIsReadFalse(101L);
    }

    @Test
    @DisplayName("Mark as read: Successfully updates read status when owner matches")
    void testMarkAsRead_Success() {
        securityUtils.setCurrentUser(farmerA);

        Alert alert = new Alert(1L, "Alert 1", "Msg 1", AlertType.FEED_QUALITY, Severity.WARNING, false, LocalDateTime.now(), farmerA, null, null);
        when(alertRepository.findById(1L)).thenReturn(Optional.of(alert));
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AlertResponse response = alertService.markAsRead(1L);

        assertTrue(response.getIsRead());
        verify(alertRepository).save(alert);
    }

    @Test
    @DisplayName("Mark as read: Throws 403 when updating another farmer's alert")
    void testMarkAsRead_CrossOwner_Throws403() {
        securityUtils.setCurrentUser(farmerA);

        Alert alertOfFarmerB = new Alert(2L, "Alert", "Msg", AlertType.STORAGE, Severity.HIGH, false, LocalDateTime.now(), farmerB, null, null);
        when(alertRepository.findById(2L)).thenReturn(Optional.of(alertOfFarmerB));

        assertThrows(ResourceOwnershipException.class, () -> {
            alertService.markAsRead(2L);
        });
        verify(alertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Mark all as read: Executes batch update for authenticated farmer only")
    void testMarkAllAsRead() {
        securityUtils.setCurrentUser(farmerA);
        when(alertRepository.markAllAsReadForUser(101L)).thenReturn(5);

        int updated = alertService.markAllAsRead();

        assertEquals(5, updated);
        verify(alertRepository).markAllAsReadForUser(101L);
    }

    @Test
    @DisplayName("Alert Generation: Consumes UNSAFE quality assessment and produces CRITICAL alert")
    void testProcessAssessmentAlerts_UnsafeQuality() {
        Farm farm = new Farm();
        farm.setId(10L);
        farm.setOwner(farmerA);

        QualityAssessmentResponse quality = QualityAssessmentResponse.builder()
                .testResultId(55L)
                .sampleCode("SMP-UNSAFE-01")
                .qualityStatus(QualityStatus.UNSAFE)
                .explanation("Critical aflatoxin contamination: 65.0 ppb exceeds safety limits")
                .sampleType("FEED")
                .build();

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(any(), any(), any(), any()))
                .thenReturn(false);

        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> {
            Alert a = invocation.getArgument(0);
            a.setId(201L);
            return a;
        });

        List<Alert> alerts = alertService.processAssessmentAlerts(farm, quality, null, null, 55L);

        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(farmerA, created.getUser());
        assertEquals(Severity.CRITICAL, created.getSeverity());
        assertEquals(AlertType.FEED_QUALITY, created.getAlertType());
        assertTrue(created.getTitle().contains("SMP-UNSAFE-01"));
        assertEquals("TEST_RESULT", created.getRelatedEntityType());
        assertEquals(55L, created.getRelatedEntityId());
    }

    @Test
    @DisplayName("Alert Generation: Consumes HIGH risk assessment and produces HIGH severity alert")
    void testProcessAssessmentAlerts_HighRisk() {
        Farm farm = new Farm();
        farm.setId(10L);
        farm.setOwner(farmerA);

        RiskAssessmentResponse risk = RiskAssessmentResponse.builder()
                .testResultId(60L)
                .sampleCode("SMP-HIGH-RISK")
                .overallRiskLevel(RiskLevel.HIGH)
                .allRisks(List.of(RiskIndicatorDto.builder()
                        .category(AdvisoryCategory.CONTAMINATION)
                        .severity(Severity.HIGH)
                        .description("High risk of mould / mycotoxin accumulation")
                        .build()))
                .build();

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(any(), any(), any(), any()))
                .thenReturn(false);
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> {
            Alert a = invocation.getArgument(0);
            a.setId(202L);
            return a;
        });

        List<Alert> alerts = alertService.processAssessmentAlerts(farm, null, risk, null, 60L);

        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(Severity.HIGH, created.getSeverity());
        assertEquals(AlertType.HEALTH_RISK, created.getAlertType());
        assertTrue(created.getMessage().contains("High risk"));
    }

    @Test
    @DisplayName("Alert Generation: Does NOT create alerts for normal / GOOD operations")
    void testProcessAssessmentAlerts_NormalGood_NoAlertsCreated() {
        Farm farm = new Farm();
        farm.setId(10L);
        farm.setOwner(farmerA);

        QualityAssessmentResponse quality = QualityAssessmentResponse.builder()
                .testResultId(70L)
                .sampleCode("SMP-GOOD-01")
                .qualityStatus(QualityStatus.GOOD)
                .explanation("All parameters within normal baseline")
                .build();

        RiskAssessmentResponse risk = RiskAssessmentResponse.builder()
                .testResultId(70L)
                .sampleCode("SMP-GOOD-01")
                .overallRiskLevel(RiskLevel.LOW)
                .allRisks(Collections.emptyList())
                .build();

        List<Alert> alerts = alertService.processAssessmentAlerts(farm, quality, risk, Collections.emptyList(), 70L);

        assertTrue(alerts.isEmpty());
        verify(alertRepository, never()).save(any());
    }

    @Test
    @DisplayName("Alert Generation: Consumes HIGH priority advisories and persists alert")
    void testProcessAssessmentAlerts_HighPriorityAdvisory() {
        Farm farm = new Farm();
        farm.setId(10L);
        farm.setOwner(farmerA);

        AdvisoryResponse adv = AdvisoryResponse.builder()
                .id(301L)
                .title("Immediate feed aeration required")
                .message("High moisture levels pose imminent heating hazard")
                .category(AdvisoryCategory.STORAGE)
                .priority(Priority.HIGH)
                .build();

        when(alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(any(), any(), any(), any()))
                .thenReturn(false);
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> {
            Alert a = invocation.getArgument(0);
            a.setId(203L);
            return a;
        });

        List<Alert> alerts = alertService.processAssessmentAlerts(farm, null, null, List.of(adv), 80L);

        assertEquals(1, alerts.size());
        Alert created = alerts.get(0);
        assertEquals(AlertType.STORAGE, created.getAlertType());
        assertEquals(Severity.HIGH, created.getSeverity());
        assertEquals("ADVISORY", created.getRelatedEntityType());
        assertEquals(301L, created.getRelatedEntityId());
    }
}
