package com.cattlefeedai.api.dto.assessment;

import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Details of a single identified risk indicator.
 * Uses non-diagnostic terminology ("Potential Risk", "Risk Indicator").
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskIndicatorDto {

    private AdvisoryCategory category;
    private String riskTitle;
    private Severity severity;
    private String description;
    private String mitigationRecommendation;
    private AssessmentParameter detectedParameter;
}
