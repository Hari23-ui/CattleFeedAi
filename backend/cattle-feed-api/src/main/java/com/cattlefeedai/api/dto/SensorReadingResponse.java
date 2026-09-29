package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.SensorReading;
import com.cattlefeedai.api.entity.enums.SensorSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Historical sensor reading response.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReadingResponse {

    private Long id;
    private Long storageUnitId;
    private String deviceId;
    private LocalDateTime readingTime;
    private BigDecimal temperature;
    private BigDecimal humidity;
    private BigDecimal ph;
    private BigDecimal gasLevel;
    private BigDecimal mouldRiskIndicator;
    private SensorSource source;
    private LocalDateTime createdAt;

    public static SensorReadingResponse fromEntity(SensorReading entity) {
        if (entity == null) {
            return null;
        }
        return SensorReadingResponse.builder()
                .id(entity.getId())
                .storageUnitId(entity.getStorageUnit() != null ? entity.getStorageUnit().getId() : null)
                .deviceId(entity.getDeviceId())
                .readingTime(entity.getReadingTime())
                .temperature(entity.getTemperature())
                .humidity(entity.getHumidity())
                .ph(entity.getPh())
                .gasLevel(entity.getGasLevel())
                .mouldRiskIndicator(entity.getMouldRiskIndicator())
                .source(entity.getSource())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
