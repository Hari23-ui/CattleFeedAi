package com.cattlefeedai.api.service.assessment;

import com.cattlefeedai.api.dto.assessment.ParameterAssessmentDto;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.QualityStatus;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.model.RuleEvaluationResult;
import com.cattlefeedai.api.service.rule.RuleEngineService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service evaluating a TestResult to produce a structured QualityAssessmentResponse.
 */
@Service
public class QualityAssessmentService {

    private final RuleEngineService ruleEngineService;

    public static final String PLACEHOLDER_DISCLAIMER =
            "Screening Disclaimer: Quality assessment uses a configurable rule engine with placeholder thresholds pending certified agricultural/NDDB scientific calibration.";

    public QualityAssessmentService(RuleEngineService ruleEngineService) {
        this.ruleEngineService = ruleEngineService;
    }

    /**
     * Evaluate a TestResult and return structured QualityAssessmentResponse.
     */
    public QualityAssessmentResponse assessQuality(TestResult testResult) {
        if (testResult == null) {
            return null;
        }

        List<RuleEvaluationResult> triggeredRules = ruleEngineService.evaluate(testResult);
        Map<AssessmentParameter, RuleEvaluationResult> ruleMap = triggeredRules.stream()
                .collect(Collectors.toMap(RuleEvaluationResult::getParameter, r -> r, (r1, r2) -> r1));

        List<ParameterAssessmentDto> parameterList = new ArrayList<>();
        int measuredCount = 0;

        measuredCount += addNumericParam(parameterList, AssessmentParameter.MOISTURE, testResult.getMoisture(), "%", ruleMap);
        measuredCount += addNumericParam(parameterList, AssessmentParameter.CRUDE_PROTEIN, testResult.getCrudeProtein(), "%", ruleMap);
        measuredCount += addNumericParam(parameterList, AssessmentParameter.FIBER, testResult.getFiber(), "%", ruleMap);
        measuredCount += addNumericParam(parameterList, AssessmentParameter.ENERGY_VALUE, testResult.getEnergyValue(), "kcal/kg", ruleMap);
        measuredCount += addNumericParam(parameterList, AssessmentParameter.AFLATOXIN, testResult.getAflatoxin(), "ppb", ruleMap);
        measuredCount += addNumericParam(parameterList, AssessmentParameter.MYCOTOXIN, testResult.getMycotoxin(), "ppb", ruleMap);
        measuredCount += addNumericParam(parameterList, AssessmentParameter.PH, testResult.getPh(), "pH", ruleMap);

        measuredCount += addStringParam(parameterList, AssessmentParameter.MINERAL_STATUS, testResult.getMineralStatus(), ruleMap);
        measuredCount += addStringParam(parameterList, AssessmentParameter.ADULTERATION, testResult.getAdulteration(), ruleMap);

        measuredCount += addBooleanParam(parameterList, AssessmentParameter.MOULD_DETECTED, testResult.getMouldDetected(), ruleMap);
        measuredCount += addBooleanParam(parameterList, AssessmentParameter.SPOILAGE_DETECTED, testResult.getSpoilageDetected(), ruleMap);

        // Determine QualityStatus & Narrative Explanation
        QualityStatus status;
        String explanation;

        boolean hasCritical = triggeredRules.stream().anyMatch(r -> r.getSeverity() == Severity.CRITICAL);
        boolean hasWarningOrHigh = triggeredRules.stream().anyMatch(r -> r.getSeverity() == Severity.WARNING || r.getSeverity() == Severity.HIGH);

        if (measuredCount == 0) {
            status = QualityStatus.INSUFFICIENT_DATA;
            explanation = "Insufficient data: No physical or chemical parameters were recorded for evaluation.";
        } else if (hasCritical) {
            status = QualityStatus.UNSAFE;
            explanation = "Sample flagged as UNSAFE: Critical hazard detected (" +
                    triggeredRules.stream()
                            .filter(r -> r.getSeverity() == Severity.CRITICAL)
                            .map(RuleEvaluationResult::getMessage)
                            .collect(Collectors.joining("; ")) + ").";
        } else if (hasWarningOrHigh) {
            status = QualityStatus.NEEDS_ATTENTION;
            explanation = "Sample flagged as NEEDS_ATTENTION: Parameters deviate from standard baseline (" +
                    triggeredRules.stream()
                            .map(RuleEvaluationResult::getMessage)
                            .collect(Collectors.joining("; ")) + ").";
        } else if (measuredCount >= 2) {
            status = QualityStatus.GOOD;
            explanation = "Sample assessed as GOOD: All " + measuredCount + " evaluated parameters are within normal baseline thresholds.";
        } else {
            status = QualityStatus.ACCEPTABLE;
            explanation = "Sample assessed as ACCEPTABLE based on limited available parameter screening (" + measuredCount + " parameter evaluated).";
        }

        String sampleType = testResult.getFeedSample() != null ? "FEED" :
                (testResult.getSilageSample() != null ? "SILAGE" : "UNKNOWN");
        Long sampleId = testResult.getFeedSample() != null ? testResult.getFeedSample().getId() :
                (testResult.getSilageSample() != null ? testResult.getSilageSample().getId() : null);
        String sampleCode = testResult.getFeedSample() != null ? testResult.getFeedSample().getSampleCode() :
                (testResult.getSilageSample() != null ? testResult.getSilageSample().getSampleCode() : null);

        return QualityAssessmentResponse.builder()
                .testResultId(testResult.getId())
                .sampleType(sampleType)
                .sampleId(sampleId)
                .sampleCode(sampleCode)
                .qualityStatus(status)
                .explanation(explanation)
                .parameters(parameterList)
                .triggeredRulesCount(triggeredRules.size())
                .evaluationTimestamp(LocalDateTime.now())
                .disclaimer(PLACEHOLDER_DISCLAIMER)
                .build();
    }

    private int addNumericParam(
            List<ParameterAssessmentDto> list,
            AssessmentParameter param,
            Number value,
            String unit,
            Map<AssessmentParameter, RuleEvaluationResult> ruleMap
    ) {
        if (value == null) {
            list.add(ParameterAssessmentDto.builder()
                    .parameter(param)
                    .measuredValue(null)
                    .unit(unit)
                    .status("NOT_AVAILABLE")
                    .evaluationNote("Parameter not provided in test result")
                    .build());
            return 0;
        }

        RuleEvaluationResult triggered = ruleMap.get(param);
        String status = triggered != null ? triggered.getSeverity().name() : "NORMAL";
        String note = triggered != null ? triggered.getMessage() : "Within normal baseline screening threshold";

        list.add(ParameterAssessmentDto.builder()
                .parameter(param)
                .measuredValue(value)
                .unit(unit)
                .status(status)
                .evaluationNote(note)
                .build());
        return 1;
    }

    private int addStringParam(
            List<ParameterAssessmentDto> list,
            AssessmentParameter param,
            String value,
            Map<AssessmentParameter, RuleEvaluationResult> ruleMap
    ) {
        if (value == null || value.trim().isEmpty()) {
            list.add(ParameterAssessmentDto.builder()
                    .parameter(param)
                    .measuredValue(null)
                    .unit(null)
                    .status("NOT_AVAILABLE")
                    .evaluationNote("Parameter not recorded")
                    .build());
            return 0;
        }

        RuleEvaluationResult triggered = ruleMap.get(param);
        String status = triggered != null ? triggered.getSeverity().name() : "NORMAL";
        String note = triggered != null ? triggered.getMessage() : "No abnormal indicator observed";

        list.add(ParameterAssessmentDto.builder()
                .parameter(param)
                .measuredValue(value)
                .unit(null)
                .status(status)
                .evaluationNote(note)
                .build());
        return 1;
    }

    private int addBooleanParam(
            List<ParameterAssessmentDto> list,
            AssessmentParameter param,
            Boolean value,
            Map<AssessmentParameter, RuleEvaluationResult> ruleMap
    ) {
        if (value == null) {
            list.add(ParameterAssessmentDto.builder()
                    .parameter(param)
                    .measuredValue(null)
                    .unit(null)
                    .status("NOT_AVAILABLE")
                    .evaluationNote("Indicator not checked")
                    .build());
            return 0;
        }

        RuleEvaluationResult triggered = ruleMap.get(param);
        String status = triggered != null ? triggered.getSeverity().name() : "NORMAL";
        String note = triggered != null ? triggered.getMessage() : "Negative / Not observed";

        list.add(ParameterAssessmentDto.builder()
                .parameter(param)
                .measuredValue(value)
                .unit(null)
                .status(status)
                .evaluationNote(note)
                .build());
        return 1;
    }
}
