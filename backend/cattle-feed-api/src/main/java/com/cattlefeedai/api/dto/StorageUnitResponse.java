package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.StorageUnit;
import com.cattlefeedai.api.entity.enums.MonitoringStatus;
import com.cattlefeedai.api.entity.enums.StorageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Safe response payload for a StorageUnit with current monitoring metrics.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageUnitResponse {

    private Long id;
    private Long farmId;
    private String farmName;
    private String name;
    private StorageType storageType;
    private String location;
    private String capacity;
    private String deviceId;

    private BigDecimal latestTemperature;
    private BigDecimal latestPh;
    private BigDecimal latestHumidity;
    private LocalDateTime lastReadingTime;

    private MonitoringStatus monitoringStatus;
    private long unreadAlertCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static StorageUnitResponse fromEntity(StorageUnit entity) {
        if (entity == null) {
            return null;
        }
        return StorageUnitResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarm() != null ? entity.getFarm().getId() : null)
                .farmName(entity.getFarm() != null ? entity.getFarm().getFarmName() : null)
                .name(entity.getName())
                .storageType(entity.getStorageType())
                .location(entity.getLocation())
                .capacity(entity.getCapacity())
                .deviceId(entity.getDeviceId())
                .monitoringStatus(MonitoringStatus.MONITORING)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
