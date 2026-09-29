package com.cattlefeedai.api.model;

import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Result of evaluating an individual rule against a measured parameter.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RuleEvaluationResult {

    private String ruleCode;
    private AssessmentParameter parameter;
    private boolean triggered;
    private Severity severity;
    private AdvisoryCategory category;
    private String message;
    private String recommendation;
    private Object actualValue;
    private Object thresholdValue;
}
