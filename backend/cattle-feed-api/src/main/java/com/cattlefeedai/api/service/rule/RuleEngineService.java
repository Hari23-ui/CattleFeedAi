package com.cattlefeedai.api.service.rule;

import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.ComparisonOperator;
import com.cattlefeedai.api.model.AssessmentRule;
import com.cattlefeedai.api.model.RuleEvaluationResult;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Service executing rule evaluations against measured test result parameters.
 */
@Service
public class RuleEngineService {

    private final RuleRegistry ruleRegistry;

    public RuleEngineService(RuleRegistry ruleRegistry) {
        this.ruleRegistry = ruleRegistry;
    }

    /**
     * Evaluate all active rules for the given TestResult.
     * Null parameters are skipped (NULL means "not available", not zero/failed).
     */
    public List<RuleEvaluationResult> evaluate(TestResult testResult) {
        List<RuleEvaluationResult> results = new ArrayList<>();

        if (testResult == null) {
            return results;
        }

        String sampleType = testResult.getFeedSample() != null ? "FEED" :
                (testResult.getSilageSample() != null ? "SILAGE" : "ANY");

        // Evaluate each parameter if present
        evaluateNumericParam(sampleType, AssessmentParameter.MOISTURE, testResult.getMoisture(), results);
        evaluateNumericParam(sampleType, AssessmentParameter.CRUDE_PROTEIN, testResult.getCrudeProtein(), results);
        evaluateNumericParam(sampleType, AssessmentParameter.FIBER, testResult.getFiber(), results);
        evaluateNumericParam(sampleType, AssessmentParameter.ENERGY_VALUE, testResult.getEnergyValue(), results);
        evaluateNumericParam(sampleType, AssessmentParameter.AFLATOXIN, testResult.getAflatoxin(), results);
        evaluateNumericParam(sampleType, AssessmentParameter.MYCOTOXIN, testResult.getMycotoxin(), results);
        evaluateNumericParam(sampleType, AssessmentParameter.PH, testResult.getPh(), results);

        evaluateStringParam(sampleType, AssessmentParameter.MINERAL_STATUS, testResult.getMineralStatus(), results);
        evaluateStringParam(sampleType, AssessmentParameter.ADULTERATION, testResult.getAdulteration(), results);

        evaluateBooleanParam(sampleType, AssessmentParameter.MOULD_DETECTED, testResult.getMouldDetected(), results);
        evaluateBooleanParam(sampleType, AssessmentParameter.SPOILAGE_DETECTED, testResult.getSpoilageDetected(), results);

        return results;
    }

    private void evaluateNumericParam(
            String sampleType,
            AssessmentParameter param,
            BigDecimal value,
            List<RuleEvaluationResult> results
    ) {
        if (value == null) {
            return; // NULL = measurement not available; not zero, not failed
        }

        double val = value.doubleValue();
        List<AssessmentRule> rules = ruleRegistry.getRulesForSampleTypeAndParameter(sampleType, param);

        for (AssessmentRule rule : rules) {
            if (!(rule.getThresholdValue() instanceof Number numThreshold)) {
                continue;
            }

            double threshold = numThreshold.doubleValue();
            boolean triggered = checkNumericCondition(val, rule.getOperator(), threshold);

            if (triggered) {
                results.add(RuleEvaluationResult.builder()
                        .ruleCode(rule.getRuleCode())
                        .parameter(param)
                        .triggered(true)
                        .severity(rule.getSeverity())
                        .category(rule.getCategory())
                        .message(rule.getMessage())
                        .recommendation(rule.getRecommendation())
                        .actualValue(val)
                        .thresholdValue(threshold)
                        .build());
            }
        }
    }

    private void evaluateStringParam(
            String sampleType,
            AssessmentParameter param,
            String value,
            List<RuleEvaluationResult> results
    ) {
        if (value == null || value.trim().isEmpty()) {
            return;
        }

        List<AssessmentRule> rules = ruleRegistry.getRulesForSampleTypeAndParameter(sampleType, param);
        for (AssessmentRule rule : rules) {
            String threshold = String.valueOf(rule.getThresholdValue());
            boolean triggered = checkStringCondition(value.trim(), rule.getOperator(), threshold);

            if (triggered) {
                results.add(RuleEvaluationResult.builder()
                        .ruleCode(rule.getRuleCode())
                        .parameter(param)
                        .triggered(true)
                        .severity(rule.getSeverity())
                        .category(rule.getCategory())
                        .message(rule.getMessage())
                        .recommendation(rule.getRecommendation())
                        .actualValue(value)
                        .thresholdValue(threshold)
                        .build());
            }
        }
    }

    private void evaluateBooleanParam(
            String sampleType,
            AssessmentParameter param,
            Boolean value,
            List<RuleEvaluationResult> results
    ) {
        if (value == null) {
            return;
        }

        List<AssessmentRule> rules = ruleRegistry.getRulesForSampleTypeAndParameter(sampleType, param);
        for (AssessmentRule rule : rules) {
            boolean threshold = Boolean.parseBoolean(String.valueOf(rule.getThresholdValue()));
            boolean triggered = (rule.getOperator() == ComparisonOperator.EQUALS && value.equals(threshold)) ||
                    (rule.getOperator() == ComparisonOperator.NOT_EQUALS && !value.equals(threshold));

            if (triggered) {
                results.add(RuleEvaluationResult.builder()
                        .ruleCode(rule.getRuleCode())
                        .parameter(param)
                        .triggered(true)
                        .severity(rule.getSeverity())
                        .category(rule.getCategory())
                        .message(rule.getMessage())
                        .recommendation(rule.getRecommendation())
                        .actualValue(value)
                        .thresholdValue(threshold)
                        .build());
            }
        }
    }

    private boolean checkNumericCondition(double actual, ComparisonOperator op, double threshold) {
        return switch (op) {
            case GREATER_THAN -> actual > threshold;
            case GREATER_THAN_OR_EQUAL -> actual >= threshold;
            case LESS_THAN -> actual < threshold;
            case LESS_THAN_OR_EQUAL -> actual <= threshold;
            case EQUALS -> Math.abs(actual - threshold) < 0.00001;
            case NOT_EQUALS -> Math.abs(actual - threshold) >= 0.00001;
        };
    }

    private boolean checkStringCondition(String actual, ComparisonOperator op, String threshold) {
        return switch (op) {
            case EQUALS -> actual.equalsIgnoreCase(threshold);
            case NOT_EQUALS -> !actual.equalsIgnoreCase(threshold);
            default -> false;
        };
    }
}
