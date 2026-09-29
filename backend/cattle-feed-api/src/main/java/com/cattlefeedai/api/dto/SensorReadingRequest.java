package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.enums.SensorSource;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Ingestion request payload for hardware sensor devices (e.g. ESP32) or manual readings.
 * Null measurements must remain null and NOT converted to zero.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReadingRequest {

    private String deviceId;

    @JsonAlias({"timestamp", "readingTime"})
    private LocalDateTime readingTime;

    private BigDecimal temperature;

    private BigDecimal ph;

    private BigDecimal humidity;

    private BigDecimal gasLevel;

    private BigDecimal mouldRiskIndicator;

    private SensorSource source;
}
