package com.cattlefeedai.api.service.sms;

import com.cattlefeedai.api.config.SmsConfig;
import com.cattlefeedai.api.dto.SmsRecord;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Severity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing SMS notifications for high-priority storage condition changes.
 *
 * Enforces:
 * - SMS enable flag verification
 * - Non-diagnostic wording compliance (review-oriented advisory)
 * - Rate-limiting and deduplication (cooldown period)
 * - India TRAI DLT parameters (Header & Content Template ID)
 */
@Service
public class SmsNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SmsNotificationService.class);

    private final SmsConfig config;
    private final Map<String, SmsProvider> providers = new HashMap<>();
    private final MockSmsProvider mockProvider;

    // In-memory deduplication tracker: key = (userId + ":" + entityType + ":" + entityId), value = timestamp
    private final Map<String, LocalDateTime> lastSentMap = new ConcurrentHashMap<>();

    public SmsNotificationService(SmsConfig config, List<SmsProvider> providerList, MockSmsProvider mockProvider) {
        this.config = config;
        this.mockProvider = mockProvider;
        for (SmsProvider p : providerList) {
            this.providers.put(p.getProviderName().toLowerCase(), p);
        }
    }

    /**
     * Dispatch an SMS notification for a high-priority storage alert.
     *
     * @param alert The generated storage alert entity.
     * @param storageUnitName Name of the affected storage unit (optional, can be derived).
     * @return SmsRecord containing dispatch details, or null if filtered out.
     */
    public SmsRecord sendStorageAlertSms(Alert alert, String storageUnitName) {
        if (alert == null || alert.getAlertType() != AlertType.STORAGE) {
            return null;
        }

        // Severity filter: only send for HIGH or CRITICAL if highPriorityOnly is enabled
        if (config.isHighPriorityOnly() &&
                alert.getSeverity() != Severity.HIGH &&
                alert.getSeverity() != Severity.CRITICAL) {
            log.debug("Skipping SMS dispatch: Alert severity {} is below configured threshold", alert.getSeverity());
            return null;
        }

        User recipientUser = alert.getUser();
        String recipientPhone = (recipientUser != null && recipientUser.getPhone() != null && !recipientUser.getPhone().isBlank())
                ? recipientUser.getPhone()
                : "+91-9876543210"; // Default demo farmer number if not set

        String unitLabel = (storageUnitName != null && !storageUnitName.isBlank())
                ? storageUnitName
                : (alert.getRelatedEntityId() != null ? "Unit #" + alert.getRelatedEntityId() : "Storage Unit");

        // Deduplication check: check cooldown window
        String dedupeKey = (recipientUser != null ? recipientUser.getId() : 0) + ":" +
                alert.getRelatedEntityType() + ":" + alert.getRelatedEntityId();

        LocalDateTime lastSent = lastSentMap.get(dedupeKey);
        if (lastSent != null && lastSent.plusMinutes(config.getCooldownMinutes()).isAfter(LocalDateTime.now())) {
            log.info("Suppressed duplicate SMS dispatch for key {} (sent at {})", dedupeKey, lastSent);
            return null;
        }

        // Compliant, review-oriented advisory wording (PART 8)
        String smsMessage = String.format(
                "CattleFeedAI Storage Alert: A storage condition change has been detected in %s. " +
                "Potential spoilage/fungal-growth risk condition detected. " +
                "Please inspect temperature, humidity and storage conditions for possible spoilage risk.",
                unitLabel
        );

        String providerName = config.getProvider() != null ? config.getProvider().toLowerCase() : "mock";
        SmsProvider provider = providers.getOrDefault(providerName, mockProvider);

        if (!config.isEnabled()) {
            log.info("[SMS NOTIFICATION] SMS_ENABLED=false. Notification created in audit log without carrier dispatch.");
            SmsRecord auditRecord = new SmsRecord(
                    UUID.randomUUID().toString(),
                    recipientPhone,
                    config.getSenderId(),
                    smsMessage,
                    providerName + " (simulated)",
                    "DISABLED_LOGGED",
                    LocalDateTime.now(),
                    config.getDltTemplateId(),
                    alert.getId()
            );
            return auditRecord;
        }

        boolean success = provider.sendSms(recipientPhone, smsMessage, config.getSenderId(), config.getDltTemplateId());
        lastSentMap.put(dedupeKey, LocalDateTime.now());

        SmsRecord record = new SmsRecord(
                UUID.randomUUID().toString(),
                recipientPhone,
                config.getSenderId(),
                smsMessage,
                providerName,
                success ? "SENT" : "FAILED",
                LocalDateTime.now(),
                config.getDltTemplateId(),
                alert.getId()
        );

        return record;
    }

    /**
     * Retrieve recent mock SMS dispatches for evaluator and judge demonstration.
     */
    public List<SmsRecord> getRecentDispatches() {
        return mockProvider.getRecentDispatches();
    }

    /**
     * Trigger a demo test SMS to verify configuration without needing an anomaly event.
     */
    public SmsRecord triggerTestSms(String targetPhone) {
        String phone = (targetPhone != null && !targetPhone.isBlank()) ? targetPhone : "+91-9876543210";
        String message = "CattleFeedAI Storage Alert: Demo test notification for storage unit monitoring. Please inspect temperature and ventilation conditions.";

        String providerName = config.getProvider() != null ? config.getProvider().toLowerCase() : "mock";
        SmsProvider provider = providers.getOrDefault(providerName, mockProvider);

        boolean success = provider.sendSms(phone, message, config.getSenderId(), config.getDltTemplateId());

        return new SmsRecord(
                UUID.randomUUID().toString(),
                phone,
                config.getSenderId(),
                message,
                providerName,
                success ? "SENT" : "FAILED",
                LocalDateTime.now(),
                config.getDltTemplateId(),
                null
        );
    }
}
