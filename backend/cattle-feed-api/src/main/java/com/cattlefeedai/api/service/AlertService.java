package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.AlertResponse;
import com.cattlefeedai.api.dto.UnreadCountResponse;
import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.Priority;
import com.cattlefeedai.api.entity.enums.QualityStatus;
import com.cattlefeedai.api.entity.enums.RiskLevel;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AlertRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Service managing farmer alerts and notifications.
 *
 * Enforces strict per-farmer ownership:
 * - Farmers only see and modify their own alerts.
 * - Cross-owner access triggers 403 (ResourceOwnershipException).
 * - Missing alerts trigger 404 (ResourceNotFoundException).
 */
@Service
@Transactional
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final SecurityUtils securityUtils;
    private final com.cattlefeedai.api.service.sms.SmsNotificationService smsNotificationService;

    public AlertService(AlertRepository alertRepository, SecurityUtils securityUtils) {
        this(alertRepository, securityUtils, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AlertService(
            AlertRepository alertRepository,
            SecurityUtils securityUtils,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.cattlefeedai.api.service.sms.SmsNotificationService smsNotificationService
    ) {
        this.alertRepository = alertRepository;
        this.securityUtils = securityUtils;
        this.smsNotificationService = smsNotificationService;
    }

    /**
     * Retrieve all alerts for the authenticated farmer, newest first.
     */
    @Transactional(readOnly = true)
    public List<AlertResponse> getAlerts() {
        User currentUser = securityUtils.getCurrentUser();
        List<Alert> alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return alerts.stream()
                .map(AlertResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve a specific alert by ID with strict ownership validation.
     */
    @Transactional(readOnly = true)
    public AlertResponse getAlertById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));

        if (!securityUtils.isAdmin(currentUser) && !alert.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to view this alert");
        }

        return AlertResponse.fromEntity(alert);
    }

    /**
     * Retrieve the count of unread alerts for the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount() {
        User currentUser = securityUtils.getCurrentUser();
        long unread = alertRepository.countByUserIdAndIsReadFalse(currentUser.getId());
        return new UnreadCountResponse(unread, unread);
    }

    /**
     * Mark a specific alert as read.
     */
    public AlertResponse markAsRead(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));

        if (!securityUtils.isAdmin(currentUser) && !alert.getUser().getId().equals(currentUser.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to modify this alert");
        }

        if (!Boolean.TRUE.equals(alert.getIsRead())) {
            alert.setIsRead(true);
            alert = alertRepository.save(alert);
        }

        return AlertResponse.fromEntity(alert);
    }

    /**
     * Mark all unread alerts for the authenticated farmer as read.
     */
    public int markAllAsRead() {
        User currentUser = securityUtils.getCurrentUser();
        return alertRepository.markAllAsReadForUser(currentUser.getId());
    }

    /**
     * Persist a new alert for a farmer if an equivalent alert does not already exist.
     */
    public Alert createAlert(
            User user,
            String title,
            String message,
            AlertType alertType,
            Severity severity,
            String relatedEntityType,
            Long relatedEntityId
    ) {
        if (user == null || user.getId() == null) {
            log.warn("Cannot create alert without a target user");
            return null;
        }

        // Deduplication check: prevent multiple identical alerts for the same event
        if (relatedEntityType != null && relatedEntityId != null) {
            boolean exists = alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
                    user.getId(),
                    relatedEntityType,
                    relatedEntityId,
                    title
            );
            if (exists) {
                log.info("Alert already exists for user {} entity {}#{}: {}", user.getId(), relatedEntityType, relatedEntityId, title);
                return null;
            }
        }

        Alert alert = new Alert();
        alert.setUser(user);
        alert.setTitle(title);
        alert.setMessage(message);
        alert.setAlertType(alertType);
        alert.setSeverity(severity);
        alert.setIsRead(false);
        alert.setRelatedEntityType(relatedEntityType);
        alert.setRelatedEntityId(relatedEntityId);

        Alert saved = alertRepository.save(alert);
        log.info("Created alert id={} type={} severity={} for user id={}", saved.getId(), saved.getAlertType(), saved.getSeverity(), user.getId());

        if (smsNotificationService != null && saved.getAlertType() == AlertType.STORAGE) {
            try {
                smsNotificationService.sendStorageAlertSms(saved, null);
            } catch (Exception ex) {
                log.warn("Failed to dispatch storage SMS notification: {}", ex.getMessage());
            }
        }

        return saved;
    }

    /**
     * Consume quality and risk assessment results and generate alerts for critical/high conditions.
     * Integrates only with meaningful existing events:
     * - UNSAFE quality status -> CRITICAL Alert
     * - HIGH risk level -> HIGH Alert
     * - HIGH priority advisories -> HIGH Alert
     */
    public List<Alert> processAssessmentAlerts(
            Farm farm,
            QualityAssessmentResponse quality,
            RiskAssessmentResponse risk,
            List<AdvisoryResponse> advisories,
            Long testResultId
    ) {
        List<Alert> createdAlerts = new ArrayList<>();
        if (farm == null || farm.getOwner() == null) {
            return createdAlerts;
        }

        User owner = farm.getOwner();
        String sampleCode = (quality != null && quality.getSampleCode() != null)
                ? quality.getSampleCode()
                : (risk != null && risk.getSampleCode() != null ? risk.getSampleCode() : "Sample #" + testResultId);

        String sampleType = quality != null ? quality.getSampleType() : "FEED";
        AlertType qualityAlertType = "SILAGE".equalsIgnoreCase(sampleType)
                ? AlertType.SILAGE_QUALITY
                : AlertType.FEED_QUALITY;

        // 1. UNSAFE Quality Assessment Event
        if (quality != null && quality.getQualityStatus() == QualityStatus.UNSAFE) {
            String title = "Critical Quality Alert: " + sampleCode;
            String message = quality.getExplanation() != null
                    ? quality.getExplanation()
                    : "Sample " + sampleCode + " evaluated as UNSAFE. Critical threshold violations detected.";

            Alert alert = createAlert(
                    owner,
                    title,
                    message,
                    qualityAlertType,
                    Severity.CRITICAL,
                    "TEST_RESULT",
                    testResultId
            );
            if (alert != null) {
                createdAlerts.add(alert);
            }
        }

        // 2. HIGH Risk Assessment Event
        if (risk != null && risk.getOverallRiskLevel() == RiskLevel.HIGH) {
            String title = "High Risk Screening Alert: " + sampleCode;
            String detail = (risk.getAllRisks() != null && !risk.getAllRisks().isEmpty())
                    ? risk.getAllRisks().get(0).getDescription()
                    : "Elevated risk indicators identified during screening.";
            String message = "High risk detected for " + sampleCode + ". " + detail;

            Alert alert = createAlert(
                    owner,
                    title,
                    message,
                    AlertType.HEALTH_RISK,
                    Severity.HIGH,
                    "TEST_RESULT",
                    testResultId
            );
            if (alert != null) {
                createdAlerts.add(alert);
            }
        }

        // 3. Important persisted advisories (Priority.HIGH)
        if (advisories != null) {
            for (AdvisoryResponse adv : advisories) {
                if (adv.getPriority() == Priority.HIGH) {
                    String title = "Urgent Advisory: " + adv.getTitle();
                    String message = adv.getMessage() != null
                            ? adv.getMessage()
                            : "Urgent management action recommended: " + adv.getTitle();

                    AlertType alertType = mapAdvisoryCategoryToAlertType(adv.getCategory());
                    Alert alert = createAlert(
                            owner,
                            title,
                            message,
                            alertType,
                            Severity.HIGH,
                            "ADVISORY",
                            adv.getId() != null ? adv.getId() : testResultId
                    );
                    if (alert != null) {
                        createdAlerts.add(alert);
                    }
                }
            }
        }

        return createdAlerts;
    }

    public AlertType mapAdvisoryCategoryToAlertType(AdvisoryCategory category) {
        if (category == null) {
            return AlertType.GENERAL;
        }
        return switch (category) {
            case FEED -> AlertType.FEED_QUALITY;
            case SILAGE -> AlertType.SILAGE_QUALITY;
            case STORAGE -> AlertType.STORAGE;
            case CONTAMINATION, NUTRITION -> AlertType.FEED_QUALITY;
            case HEALTH_SCREENING -> AlertType.HEALTH_RISK;
            case EXPERT_CONSULTATION -> AlertType.CONSULTATION;
        };
    }
}
