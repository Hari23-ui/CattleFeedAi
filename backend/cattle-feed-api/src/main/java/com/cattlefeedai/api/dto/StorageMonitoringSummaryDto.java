package com.cattlefeedai.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Summary metrics for the farmer's dashboard storage card.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageMonitoringSummaryDto {

    private long totalStorageUnits;
    private long monitoringUnits;
    private long normalUnits;
    private long attentionRequiredUnits;
    private long offlineUnits;
    private long unreadAlertCount;
}
