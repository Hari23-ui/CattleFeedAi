package com.cattlefeedai.api.service.assessment;

import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.RiskLevel;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.model.RuleEvaluationResult;
import com.cattlefeedai.api.service.rule.RuleEngineService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service evaluating potential feed, silage, contamination, and nutritional risks.
 * Explicitly maintains non-diagnostic terminology.
 */
@Service
public class RiskAssessmentService {

    private final RuleEngineService ruleEngineService;

    public static final String RISK_SCREENING_DISCLAIMER =
            "Screening Disclaimer: Risk assessment identifies potential feed-related risk indicators only and does not constitute a veterinary medical diagnosis.";

    public RiskAssessmentService(RuleEngineService ruleEngineService) {
        this.ruleEngineService = ruleEngineService;
    }

    /**
     * Evaluate a TestResult and produce a comprehensive RiskAssessmentResponse.
     */
    public RiskAssessmentResponse assessRisk(TestResult testResult) {
        if (testResult == null) {
            return null;
        }

        List<RuleEvaluationResult> triggeredRules = ruleEngineService.evaluate(testResult);

        List<RiskIndicatorDto> allRisks = new ArrayList<>();
        List<RiskIndicatorDto> contaminationRisks = new ArrayList<>();
        List<RiskIndicatorDto> nutritionalImbalances = new ArrayList<>();
        List<RiskIndicatorDto> storageSpoilageRisks = new ArrayList<>();

        for (RuleEvaluationResult r : triggeredRules) {
            RiskIndicatorDto dto = RiskIndicatorDto.builder()
                    .category(r.getCategory())
                    .riskTitle("Potential " + r.getCategory().name() + " Risk Indicator: " + r.getParameter().name())
                    .severity(r.getSeverity())
                    .description(r.getMessage())
                    .mitigationRecommendation(r.getRecommendation())
                    .detectedParameter(r.getParameter())
                    .build();

            allRisks.add(dto);

            if (r.getCategory() == AdvisoryCategory.CONTAMINATION) {
                contaminationRisks.add(dto);
            } else if (r.getCategory() == AdvisoryCategory.NUTRITION) {
                nutritionalImbalances.add(dto);
            } else if (r.getCategory() == AdvisoryCategory.STORAGE || r.getCategory() == AdvisoryCategory.SILAGE) {
                storageSpoilageRisks.add(dto);
            }
        }

        // Determine Overall Risk Level
        RiskLevel overallRisk;
        boolean hasCriticalOrHigh = triggeredRules.stream()
                .anyMatch(r -> r.getSeverity() == Severity.CRITICAL || r.getSeverity() == Severity.HIGH);
        boolean hasWarning = triggeredRules.stream()
                .anyMatch(r -> r.getSeverity() == Severity.WARNING);

        if (hasCriticalOrHigh) {
            overallRisk = RiskLevel.HIGH;
        } else if (hasWarning) {
            overallRisk = RiskLevel.MEDIUM;
        } else {
            overallRisk = RiskLevel.LOW;
        }

        String sampleCode = testResult.getFeedSample() != null ? testResult.getFeedSample().getSampleCode() :
                (testResult.getSilageSample() != null ? testResult.getSilageSample().getSampleCode() : null);

        return RiskAssessmentResponse.builder()
                .testResultId(testResult.getId())
                .sampleCode(sampleCode)
                .overallRiskLevel(overallRisk)
                .allRisks(allRisks)
                .contaminationRisks(contaminationRisks)
                .nutritionalImbalances(nutritionalImbalances)
                .storageSpoilageRisks(storageSpoilageRisks)
                .evaluationTimestamp(LocalDateTime.now())
                .screeningDisclaimer(RISK_SCREENING_DISCLAIMER)
                .build();
    }
}
