package com.cattlefeedai.api.dto.assessment;

import com.cattlefeedai.api.entity.enums.QualityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Quality assessment response payload.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QualityAssessmentResponse {

    private Long testResultId;
    private String sampleType;
    private Long sampleId;
    private String sampleCode;
    private QualityStatus qualityStatus;
    private String explanation;
    private List<ParameterAssessmentDto> parameters;
    private int triggeredRulesCount;
    private LocalDateTime evaluationTimestamp;
    private String disclaimer;
}
