package com.cattlefeedai.api.dto.assessment;

import com.cattlefeedai.api.entity.enums.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Risk assessment response payload.
 * Non-diagnostic screening separating contamination, nutritional, and storage risks.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessmentResponse {

    private Long testResultId;
    private String sampleCode;
    private RiskLevel overallRiskLevel;
    private List<RiskIndicatorDto> allRisks;
    private List<RiskIndicatorDto> contaminationRisks;
    private List<RiskIndicatorDto> nutritionalImbalances;
    private List<RiskIndicatorDto> storageSpoilageRisks;
    private LocalDateTime evaluationTimestamp;
    private String screeningDisclaimer;
}
