package com.cattlefeedai.api.dto.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Animal health risk screening response payload.
 * Non-diagnostic screening correlating animal profile, feed test history, and observations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnimalHealthScreeningResponse {

    private Long animalId;
    private String animalTag;
    private String screeningStatus; // NORMAL, POTENTIAL_CONCERN, INSUFFICIENT_DATA
    private List<String> missingInformation;
    private List<RiskIndicatorDto> detectedRisks;
    private int recentObservationsCount;
    private int recentTestResultsCount;
    private String dietaryAndHealthSummary;
    private String recommendationSummary;
    private LocalDateTime screeningTimestamp;
    private String disclaimer;
}
