package com.cattlefeedai.api.model;

import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.ComparisonOperator;
import com.cattlefeedai.api.entity.enums.Severity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Configurable assessment rule definition.
 * Holds parameter triggers, comparison operators, and placeholder thresholds.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentRule {

    private String ruleCode;
    private String sampleType; // "FEED", "SILAGE", "ANY"
    private AssessmentParameter parameter;
    private ComparisonOperator operator;
    private Object thresholdValue;
    private Severity severity;
    private String message;
    private String recommendation;
    private AdvisoryCategory category;
    private boolean active;
    private String note; // Explicitly marks placeholder thresholds requiring verified scientific calibration
}
