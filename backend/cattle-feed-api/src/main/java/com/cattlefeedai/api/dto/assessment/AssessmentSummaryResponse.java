package com.cattlefeedai.api.dto.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Consolidated assessment summary combining quality evaluation, risk screening, and generated advisories.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentSummaryResponse {

    private QualityAssessmentResponse qualityAssessment;
    private RiskAssessmentResponse riskAssessment;
    private List<AdvisoryResponse> generatedAdvisories;
}
