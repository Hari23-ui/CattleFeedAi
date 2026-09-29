package com.cattlefeedai.api;

import com.cattlefeedai.api.config.SmsConfig;
import com.cattlefeedai.api.dto.SmsRecord;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.service.sms.MockSmsProvider;
import com.cattlefeedai.api.service.sms.SmsNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SmsNotificationServiceUnitTest {

    private SmsConfig config;
    private MockSmsProvider mockProvider;
    private SmsNotificationService smsNotificationService;
    private User testUser;

    @BeforeEach
    void setUp() {
        config = new SmsConfig();
        config.setEnabled(true);
        config.setProvider("mock");
        config.setSenderId("CTLFED");
        config.setDltTemplateId("1107161234567890123");
        config.setHighPriorityOnly(true);
        config.setCooldownMinutes(30);

        mockProvider = new MockSmsProvider();
        mockProvider.clearHistory();

        smsNotificationService = new SmsNotificationService(config, List.of(mockProvider), mockProvider);

        testUser = new User();
        testUser.setId(5L);
        testUser.setPhone("+91-9876543210");
        testUser.setUsername("testfarmer");
    }

    @Test
    @DisplayName("Should send SMS via mock provider for HIGH severity storage alert")
    void testSendSmsForHighPriorityStorageAlert() {
        Alert alert = new Alert();
        alert.setId(101L);
        alert.setUser(testUser);
        alert.setAlertType(AlertType.STORAGE);
        alert.setSeverity(Severity.HIGH);
        alert.setRelatedEntityType("STORAGE_UNIT");
        alert.setRelatedEntityId(1L);

        SmsRecord record = smsNotificationService.sendStorageAlertSms(alert, "Demo Storage Godown");

        assertThat(record).isNotNull();
        assertThat(record.getStatus()).isEqualTo("SENT");
        assertThat(record.getRecipientPhone()).isEqualTo("+91-9876543210");
        assertThat(record.getSenderId()).isEqualTo("CTLFED");
        assertThat(record.getDltTemplateId()).isEqualTo("1107161234567890123");

        // Verify non-diagnostic review wording (PART 8)
        assertThat(record.getMessage()).contains("Potential spoilage/fungal-growth risk condition detected");
        assertThat(record.getMessage()).contains("Please inspect temperature, humidity and storage conditions");
        assertThat(record.getMessage()).doesNotContain("Fungal attack confirmed");

        // Verify provider dispatch history recorded
        List<SmsRecord> history = mockProvider.getRecentDispatches();
        assertThat(history).hasSize(1);
    }

    @Test
    @DisplayName("Should prevent duplicate SMS within cooldown window")
    void testDuplicateSmsPrevention() {
        Alert alert = new Alert();
        alert.setId(101L);
        alert.setUser(testUser);
        alert.setAlertType(AlertType.STORAGE);
        alert.setSeverity(Severity.HIGH);
        alert.setRelatedEntityType("STORAGE_UNIT");
        alert.setRelatedEntityId(1L);

        SmsRecord first = smsNotificationService.sendStorageAlertSms(alert, "Demo Storage Godown");
        assertThat(first).isNotNull();

        // Second call for same user and entity
        SmsRecord duplicate = smsNotificationService.sendStorageAlertSms(alert, "Demo Storage Godown");
        assertThat(duplicate).isNull(); // Suppressed by deduplication
    }

    @Test
    @DisplayName("Should not dispatch SMS when SMS is disabled (audit log only)")
    void testSmsDisabledMode() {
        config.setEnabled(false);

        Alert alert = new Alert();
        alert.setId(102L);
        alert.setUser(testUser);
        alert.setAlertType(AlertType.STORAGE);
        alert.setSeverity(Severity.HIGH);
        alert.setRelatedEntityType("STORAGE_UNIT");
        alert.setRelatedEntityId(2L);

        SmsRecord record = smsNotificationService.sendStorageAlertSms(alert, "Silage Pit #2");

        assertThat(record).isNotNull();
        assertThat(record.getStatus()).isEqualTo("DISABLED_LOGGED");

        // Carrier mock provider should not have received dispatch
        List<SmsRecord> history = mockProvider.getRecentDispatches();
        assertThat(history).isEmpty();
    }

    @Test
    @DisplayName("Should filter out LOW or INFO severity alerts when highPriorityOnly is true")
    void testFilterLowPriorityAlerts() {
        Alert lowAlert = new Alert();
        lowAlert.setId(103L);
        lowAlert.setUser(testUser);
        lowAlert.setAlertType(AlertType.STORAGE);
        lowAlert.setSeverity(Severity.INFO);

        SmsRecord record = smsNotificationService.sendStorageAlertSms(lowAlert, "Demo Storage Godown");
        assertThat(record).isNull();
    }
}
