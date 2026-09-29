package com.cattlefeedai.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

/**
 * Centralized, configurable storage unit monitoring thresholds.
 *
 * NOTE: These are CONFIGURABLE STORAGE MONITORING THRESHOLDS for early
 * condition change detection, and are NOT universal veterinary or
 * scientific laws.
 */
@Configuration
@ConfigurationProperties(prefix = "storage.monitoring")
@Getter
@Setter
public class StorageMonitoringConfig {

    /**
     * Minimum expected temperature (°C) under normal storage.
     */
    private BigDecimal temperatureMin = new BigDecimal("5.0");

    /**
     * Maximum expected temperature (°C) before elevated temperature alert.
     */
    private BigDecimal temperatureMax = new BigDecimal("35.0");

    /**
     * Threshold for sudden temperature jump/drop between consecutive readings (°C).
     */
    private BigDecimal temperatureSuddenChange = new BigDecimal("3.0");

    /**
     * Minimum expected pH for storage/silage.
     */
    private BigDecimal phMin = new BigDecimal("3.5");

    /**
     * Maximum expected pH for storage/silage before fermentation/stability alert.
     */
    private BigDecimal phMax = new BigDecimal("5.5");

    /**
     * Threshold for sudden pH jump/drop between consecutive readings.
     */
    private BigDecimal phSuddenChange = new BigDecimal("0.5");

    /**
     * Hours without reading before a device is marked NO_RECENT_DATA / OFFLINE.
     */
    private long offlineThresholdHours = 24L;
}
