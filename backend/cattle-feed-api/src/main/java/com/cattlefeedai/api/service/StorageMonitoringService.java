package com.cattlefeedai.api.service;

import com.cattlefeedai.api.config.StorageMonitoringConfig;
import com.cattlefeedai.api.entity.Alert;
import com.cattlefeedai.api.entity.SensorReading;
import com.cattlefeedai.api.entity.StorageUnit;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AlertType;
import com.cattlefeedai.api.entity.enums.MonitoringStatus;
import com.cattlefeedai.api.entity.enums.Severity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Monitoring Engine for Feed & Silage Storage Units.
 *
 * Evaluates incoming sensor telemetry against configurable storage thresholds
 * and detects rapid environmental changes over time.
 *
 * NOTE: Scientific & Domain Boundary:
 * These evaluations represent storage condition monitoring thresholds and
 * anomaly detection. They do NOT represent definitive veterinary diagnoses,
 * chemical laboratory replacements, or guaranteed spoilage assertions.
 */
@Service
public class StorageMonitoringService {

    private static final Logger log = LoggerFactory.getLogger(StorageMonitoringService.class);

    private final StorageMonitoringConfig config;
    private final AlertService alertService;

    public StorageMonitoringService(StorageMonitoringConfig config, AlertService alertService) {
        this.config = config;
        this.alertService = alertService;
    }

    /**
     * Evaluate a newly recorded sensor reading against thresholds and previous telemetry.
     * Generates deduplicated alerts when anomalous conditions or rapid changes are detected.
     */
    public List<Alert> evaluateReading(StorageUnit storageUnit, SensorReading currentReading, SensorReading previousReading) {
        List<Alert> createdAlerts = new ArrayList<>();
        if (storageUnit == null || storageUnit.getFarm() == null || storageUnit.getFarm().getOwner() == null) {
            log.warn("Cannot evaluate storage reading without storage unit owner");
            return createdAlerts;
        }

        User owner = storageUnit.getFarm().getOwner();

        // 1. Sudden Temperature Change Detection
        if (currentReading.getTemperature() != null && previousReading != null && previousReading.getTemperature() != null) {
            BigDecimal diff = currentReading.getTemperature().subtract(previousReading.getTemperature());
            BigDecimal absDiff = diff.abs();
            if (absDiff.compareTo(config.getTemperatureSuddenChange()) >= 0) {
                String sign = diff.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
                String title = "Storage Temperature Alert: " + storageUnit.getName();
                String message = String.format(
                        "Storage Unit: %s\nCurrent Temperature: %s°C\nPrevious: %s°C\nChange: %s%s°C\nStatus: Temperature change detected. Review the storage unit.",
                        storageUnit.getName(),
                        currentReading.getTemperature(),
                        previousReading.getTemperature(),
                        sign,
                        diff
                );

                Alert alert = alertService.createAlert(
                        owner,
                        title,
                        message,
                        AlertType.STORAGE,
                        Severity.WARNING,
                        "STORAGE_UNIT",
                        storageUnit.getId()
                );
                if (alert != null) {
                    createdAlerts.add(alert);
                }
            }
        }

        // 2. Configurable Upper / Lower Temperature Bounds
        if (currentReading.getTemperature() != null) {
            if (currentReading.getTemperature().compareTo(config.getTemperatureMax()) > 0 ||
                currentReading.getTemperature().compareTo(config.getTemperatureMin()) < 0) {

                String title = "Abnormal Temperature Alert: " + storageUnit.getName();
                String message = String.format(
                        "Storage Unit: %s\nCurrent Temperature: %s°C\nConfigured Threshold: %s°C - %s°C\nStatus: Potential storage condition concern. Review recommended.",
                        storageUnit.getName(),
                        currentReading.getTemperature(),
                        config.getTemperatureMin(),
                        config.getTemperatureMax()
                );

                Alert alert = alertService.createAlert(
                        owner,
                        title,
                        message,
                        AlertType.STORAGE,
                        Severity.HIGH,
                        "STORAGE_UNIT",
                        storageUnit.getId()
                );
                if (alert != null) {
                    createdAlerts.add(alert);
                }
            }
        }

        // 3. Sudden pH Change Detection
        if (currentReading.getPh() != null && previousReading != null && previousReading.getPh() != null) {
            BigDecimal diff = currentReading.getPh().subtract(previousReading.getPh());
            BigDecimal absDiff = diff.abs();
            if (absDiff.compareTo(config.getPhSuddenChange()) >= 0) {
                String sign = diff.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
                String title = "Storage pH Change Alert: " + storageUnit.getName();
                String message = String.format(
                        "Storage Unit: %s\nPrevious pH: %s\nCurrent pH: %s\nChange: %s%s\nStatus: pH change detected. Review the storage condition and consider appropriate testing.",
                        storageUnit.getName(),
                        previousReading.getPh(),
                        currentReading.getPh(),
                        sign,
                        diff
                );

                Alert alert = alertService.createAlert(
                        owner,
                        title,
                        message,
                        AlertType.STORAGE,
                        Severity.WARNING,
                        "STORAGE_UNIT",
                        storageUnit.getId()
                );
                if (alert != null) {
                    createdAlerts.add(alert);
                }
            }
        }

        // 4. Configurable Upper / Lower pH Bounds
        if (currentReading.getPh() != null) {
            if (currentReading.getPh().compareTo(config.getPhMax()) > 0 ||
                currentReading.getPh().compareTo(config.getPhMin()) < 0) {

                String title = "Abnormal pH Alert: " + storageUnit.getName();
                String message = String.format(
                        "Storage Unit: %s\nCurrent pH: %s\nConfigured Threshold: %s - %s\nStatus: Storage condition concern. Review recommended.",
                        storageUnit.getName(),
                        currentReading.getPh(),
                        config.getPhMin(),
                        config.getPhMax()
                );

                Alert alert = alertService.createAlert(
                        owner,
                        title,
                        message,
                        AlertType.STORAGE,
                        Severity.HIGH,
                        "STORAGE_UNIT",
                        storageUnit.getId()
                );
                if (alert != null) {
                    createdAlerts.add(alert);
                }
            }
        }

        return createdAlerts;
    }

    /**
     * Compute current monitoring status for UI presentation.
     */
    public MonitoringStatus determineStatus(StorageUnit storageUnit, SensorReading latestReading, long unreadAlertCount) {
        if (latestReading == null || latestReading.getReadingTime() == null) {
            return MonitoringStatus.MONITORING;
        }

        long hoursSinceLastReading = Duration.between(latestReading.getReadingTime(), LocalDateTime.now()).toHours();
        if (hoursSinceLastReading >= config.getOfflineThresholdHours()) {
            return MonitoringStatus.NO_RECENT_DATA;
        }

        if (unreadAlertCount > 0) {
            return MonitoringStatus.ATTENTION_REQUIRED;
        }

        if (latestReading.getTemperature() != null) {
            if (latestReading.getTemperature().compareTo(config.getTemperatureMax()) > 0 ||
                latestReading.getTemperature().compareTo(config.getTemperatureMin()) < 0) {
                return MonitoringStatus.ATTENTION_REQUIRED;
            }
        }

        if (latestReading.getPh() != null) {
            if (latestReading.getPh().compareTo(config.getPhMax()) > 0 ||
                latestReading.getPh().compareTo(config.getPhMin()) < 0) {
                return MonitoringStatus.ATTENTION_REQUIRED;
            }
        }

        return MonitoringStatus.NORMAL;
    }

    /**
     * Checks if a device has gone offline and generates an infrastructure alert if needed.
     */
    public Alert checkAndAlertOffline(StorageUnit storageUnit, SensorReading latestReading) {
        if (storageUnit == null || storageUnit.getFarm() == null || storageUnit.getFarm().getOwner() == null) {
            return null;
        }
        if (latestReading == null || latestReading.getReadingTime() == null) {
            return null;
        }

        long hours = Duration.between(latestReading.getReadingTime(), LocalDateTime.now()).toHours();
        if (hours >= config.getOfflineThresholdHours()) {
            String deviceId = storageUnit.getDeviceId() != null && !storageUnit.getDeviceId().isBlank()
                    ? storageUnit.getDeviceId()
                    : "TEST-STORAGE-SENSOR";
            String title = "Storage Sensor Offline: " + storageUnit.getName();
            String message = String.format(
                    "Storage Unit: %s\nNo sensor reading has been received from: %s since: %s.\nStatus: Check device connectivity.",
                    storageUnit.getName(),
                    deviceId,
                    latestReading.getReadingTime()
            );

            return alertService.createAlert(
                    storageUnit.getFarm().getOwner(),
                    title,
                    message,
                    AlertType.STORAGE,
                    Severity.WARNING,
                    "STORAGE_UNIT",
                    storageUnit.getId()
            );
        }
        return null;
    }
}
