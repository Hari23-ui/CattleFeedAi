package com.cattlefeedai.api.dto.assessment;

import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Assessment details for an individual parameter.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParameterAssessmentDto {

    private AssessmentParameter parameter;
    private Object measuredValue;
    private String unit;
    private String status; // NORMAL, WARNING, CRITICAL, NOT_AVAILABLE
    private String evaluationNote;
}
