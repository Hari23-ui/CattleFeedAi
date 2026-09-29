package com.cattlefeedai.api;

import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.repository.UserRepository;
import com.cattlefeedai.api.security.JwtService;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AlertIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private User farmerA;
    private User farmerB;
    private String tokenFarmerA;
    private String tokenFarmerB;

    @BeforeEach
    void setup() {
        farmerA = userRepository.findByEmail("farmerA_test@m10.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("farmerA_test");
                    u.setEmail("farmerA_test@m10.com");
                    u.setPasswordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
                    u.setRole(Role.FARMER);
                    return userRepository.save(u);
                });

        farmerB = userRepository.findByEmail("farmerB_test@m10.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("farmerB_test");
                    u.setEmail("farmerB_test@m10.com");
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
        tokenFarmerA = jwtService.generateToken(principalA);

        org.springframework.security.core.userdetails.User principalB =
                new org.springframework.security.core.userdetails.User(
                        farmerB.getEmail(),
                        farmerB.getPasswordHash(),
                        List.of(new SimpleGrantedAuthority("ROLE_FARMER"))
                );
        tokenFarmerB = jwtService.generateToken(principalB);
    }

    @Test
    @DisplayName("GET /api/alerts: Returns 401 when unauthenticated")
    void testGetAlerts_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/alerts: Returns only farmer's own alerts, maintaining isolation")
    void testGetAlerts_ReturnsOwnAlerts() throws Exception {
        Alert alertA = new Alert();
        alertA.setUser(farmerA);
        alertA.setTitle("Alpha Quality Warning");
        alertA.setMessage("Sample 101 high moisture");
        alertA.setAlertType(AlertType.FEED_QUALITY);
        alertA.setSeverity(Severity.WARNING);
        alertA.setIsRead(false);
        alertRepository.save(alertA);

        Alert alertB = new Alert();
        alertB.setUser(farmerB);
        alertB.setTitle("Beta Health Warning");
        alertB.setMessage("Beta herd screening");
        alertB.setAlertType(AlertType.HEALTH_RISK);
        alertB.setSeverity(Severity.HIGH);
        alertB.setIsRead(false);
        alertRepository.save(alertB);

        mockMvc.perform(get("/api/alerts")
                        .header("Authorization", "Bearer " + tokenFarmerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[?(@.title == 'Alpha Quality Warning')]").exists())
                .andExpect(jsonPath("$[?(@.title == 'Beta Health Warning')]").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/alerts/{id}: Returns 200 for owned alert and 403 for cross-owner access")
    void testGetAlertById_OwnershipCheck() throws Exception {
        Alert alertA = new Alert();
        alertA.setUser(farmerA);
        alertA.setTitle("Alpha Critical Spoilage");
        alertA.setMessage("Spoilage detected on feed #42");
        alertA.setAlertType(AlertType.FEED_QUALITY);
        alertA.setSeverity(Severity.CRITICAL);
        alertA.setIsRead(false);
        alertA = alertRepository.save(alertA);

        // Owner farmerA can access
        mockMvc.perform(get("/api/alerts/" + alertA.getId())
                        .header("Authorization", "Bearer " + tokenFarmerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alertA.getId()))
                .andExpect(jsonPath("$.title").value("Alpha Critical Spoilage"))
                .andExpect(jsonPath("$.severity").value("CRITICAL"));

        // Farmer B cannot access (returns 403 Forbidden)
        mockMvc.perform(get("/api/alerts/" + alertA.getId())
                        .header("Authorization", "Bearer " + tokenFarmerB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/alerts/{id}: Returns 404 for missing alert")
    void testGetAlertById_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/alerts/999999")
                        .header("Authorization", "Bearer " + tokenFarmerA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/alerts/unread-count: Returns correct unread alert count")
    void testGetUnreadCount() throws Exception {
        Alert alertA1 = new Alert();
        alertA1.setUser(farmerA);
        alertA1.setTitle("Alert A1");
        alertA1.setMessage("Msg");
        alertA1.setAlertType(AlertType.GENERAL);
        alertA1.setSeverity(Severity.INFO);
        alertA1.setIsRead(false);
        alertRepository.save(alertA1);

        Alert alertA2 = new Alert();
        alertA2.setUser(farmerA);
        alertA2.setTitle("Alert A2");
        alertA2.setMessage("Msg");
        alertA2.setAlertType(AlertType.STORAGE);
        alertA2.setSeverity(Severity.WARNING);
        alertA2.setIsRead(true);
        alertRepository.save(alertA2);

        mockMvc.perform(get("/api/alerts/unread-count")
                        .header("Authorization", "Bearer " + tokenFarmerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.count", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("PUT /api/alerts/{id}/read: Updates read status in MySQL and returns 200")
    void testMarkAsRead_Success() throws Exception {
        Alert alert = new Alert();
        alert.setUser(farmerA);
        alert.setTitle("Mark Me Read");
        alert.setMessage("Content");
        alert.setAlertType(AlertType.FEED_QUALITY);
        alert.setSeverity(Severity.WARNING);
        alert.setIsRead(false);
        alert = alertRepository.save(alert);

        mockMvc.perform(put("/api/alerts/" + alert.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenFarmerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alert.getId()))
                .andExpect(jsonPath("$.isRead").value(true));

        Alert refreshed = alertRepository.findById(alert.getId()).orElseThrow();
        assertTrue(refreshed.getIsRead());
    }

    @Test
    @DisplayName("PUT /api/alerts/{id}/read: Returns 403 when updating another farmer's alert")
    void testMarkAsRead_CrossOwner_Returns403() throws Exception {
        Alert alertOfFarmerA = new Alert();
        alertOfFarmerA.setUser(farmerA);
        alertOfFarmerA.setTitle("Alpha Private Alert");
        alertOfFarmerA.setMessage("Private content");
        alertOfFarmerA.setAlertType(AlertType.CONSULTATION);
        alertOfFarmerA.setSeverity(Severity.HIGH);
        alertOfFarmerA.setIsRead(false);
        alertOfFarmerA = alertRepository.save(alertOfFarmerA);

        mockMvc.perform(put("/api/alerts/" + alertOfFarmerA.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenFarmerB))
                .andExpect(status().isForbidden());

        Alert unchanged = alertRepository.findById(alertOfFarmerA.getId()).orElseThrow();
        assertFalse(unchanged.getIsRead());
    }

    @Test
    @DisplayName("PUT /api/alerts/read-all: Marks all unread alerts for current farmer as read")
    void testMarkAllAsRead_Success() throws Exception {
        Alert a1 = new Alert();
        a1.setUser(farmerA);
        a1.setTitle("Batch 1");
        a1.setMessage("Msg 1");
        a1.setAlertType(AlertType.GENERAL);
        a1.setSeverity(Severity.INFO);
        a1.setIsRead(false);
        alertRepository.save(a1);

        Alert a2 = new Alert();
        a2.setUser(farmerA);
        a2.setTitle("Batch 2");
        a2.setMessage("Msg 2");
        a2.setAlertType(AlertType.STORAGE);
        a2.setSeverity(Severity.WARNING);
        a2.setIsRead(false);
        alertRepository.save(a2);

        mockMvc.perform(put("/api/alerts/read-all")
                        .header("Authorization", "Bearer " + tokenFarmerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All alerts marked as read"))
                .andExpect(jsonPath("$.updatedCount", greaterThanOrEqualTo(2)));
    }
}
