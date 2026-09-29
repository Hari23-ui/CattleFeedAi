package com.cattlefeedai.api.service.rule;

import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AssessmentParameter;
import com.cattlefeedai.api.entity.enums.ComparisonOperator;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.model.AssessmentRule;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory configurable registry for assessment rules.
 * Manages rules without hardcoding thresholds across service logic.
 *
 * IMPORTANT:
 * All default numerical thresholds configured here are clearly designated
 * as PLACEHOLDER THRESHOLDS for architectural verification. They require
 * scientific calibration from certified ICAR, NDDB, or agricultural nutrition sources.
 */
@Component
public class RuleRegistry {

    private final Map<String, AssessmentRule> rules = new ConcurrentHashMap<>();

    private static final String PLACEHOLDER_NOTICE =
            "PLACEHOLDER THRESHOLD: Requires scientific calibration from agricultural/animal-nutrition sources.";

    @PostConstruct
    public void initDefaultRules() {
        // ── 1. Feed Moisture Rule ──────────────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_FEED_MOISTURE_HIGH")
                .sampleType("FEED")
                .parameter(AssessmentParameter.MOISTURE)
                .operator(ComparisonOperator.GREATER_THAN)
                .thresholdValue(14.0) // Placeholder threshold: standard dry feed safe storage boundary
                .severity(Severity.WARNING)
                .category(AdvisoryCategory.STORAGE)
                .message("Feed moisture level is above safe storage screening threshold (placeholder: 14.0%). High moisture promotes mould and bacterial growth.")
                .recommendation("Store feed in a dry, ventilated area. Check for clumping or heating before feeding.")
                .active(true)
                .note(PLACEHOLDER_NOTICE)
                .build());

        // ── 2. Feed Crude Protein Rule ─────────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_FEED_PROTEIN_LOW")
                .sampleType("FEED")
                .parameter(AssessmentParameter.CRUDE_PROTEIN)
                .operator(ComparisonOperator.LESS_THAN)
                .thresholdValue(16.0) // Placeholder threshold: typical dairy concentrate minimum
                .severity(Severity.WARNING)
                .category(AdvisoryCategory.NUTRITION)
                .message("Crude protein is below typical dairy concentrate screening threshold (placeholder: 16.0%).")
                .recommendation("Supplement with oil cakes, leguminous green fodder, or protein premixes to support milk yield.")
                .active(true)
                .note(PLACEHOLDER_NOTICE)
                .build());

        // ── 3. Feed Aflatoxin Contamination Rule ───────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_FEED_AFLATOXIN_HIGH")
                .sampleType("FEED")
                .parameter(AssessmentParameter.AFLATOXIN)
                .operator(ComparisonOperator.GREATER_THAN)
                .thresholdValue(20.0) // Placeholder threshold in ppb
                .severity(Severity.CRITICAL)
                .category(AdvisoryCategory.CONTAMINATION)
                .message("Aflatoxin concentration exceeds safety screening threshold (placeholder: 20.0 ppb). High risk of mycotoxicosis.")
                .recommendation("Cease feeding this batch immediately. Isolate remaining feed and consult a dairy nutritionist or veterinarian.")
                .active(true)
                .note(PLACEHOLDER_NOTICE)
                .build());

        // ── 4. Mould Detected Rule ────────────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_MOULD_DETECTED")
                .sampleType("ANY")
                .parameter(AssessmentParameter.MOULD_DETECTED)
                .operator(ComparisonOperator.EQUALS)
                .thresholdValue(true)
                .severity(Severity.CRITICAL)
                .category(AdvisoryCategory.CONTAMINATION)
                .message("Visible mould growth detected on feed/silage sample.")
                .recommendation("Do not feed mouldy feed to livestock, especially lactating or pregnant animals. Discard affected portions.")
                .active(true)
                .note("Direct sensory indicator — independent of numerical threshold.")
                .build());

        // ── 5. Spoilage Detected Rule ─────────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_SPOILAGE_DETECTED")
                .sampleType("ANY")
                .parameter(AssessmentParameter.SPOILAGE_DETECTED)
                .operator(ComparisonOperator.EQUALS)
                .thresholdValue(true)
                .severity(Severity.CRITICAL)
                .category(AdvisoryCategory.STORAGE)
                .message("Physical spoilage, rancidity, or abnormal odor detected in sample.")
                .recommendation("Remove spoiled feed from feeding areas. Clean feed bunks and check storage conditions.")
                .active(true)
                .note("Direct sensory indicator — independent of numerical threshold.")
                .build());

        // ── 6. Silage pH High (Poor Fermentation) ─────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_SILAGE_PH_HIGH")
                .sampleType("SILAGE")
                .parameter(AssessmentParameter.PH)
                .operator(ComparisonOperator.GREATER_THAN)
                .thresholdValue(4.5) // Placeholder threshold: well-fermented silage is typically < 4.5
                .severity(Severity.WARNING)
                .category(AdvisoryCategory.SILAGE)
                .message("Silage pH is above ideal lactic fermentation threshold (placeholder: 4.5). May indicate secondary fermentation or aerobic spoilage.")
                .recommendation("Inspect silo face compaction and plastic sealing. Increase face feedout speed to reduce aerobic deterioration.")
                .active(true)
                .note(PLACEHOLDER_NOTICE)
                .build());

        // ── 7. Silage Moisture High ───────────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_SILAGE_MOISTURE_HIGH")
                .sampleType("SILAGE")
                .parameter(AssessmentParameter.MOISTURE)
                .operator(ComparisonOperator.GREATER_THAN)
                .thresholdValue(72.0) // Placeholder threshold in %
                .severity(Severity.WARNING)
                .category(AdvisoryCategory.SILAGE)
                .message("Silage moisture is elevated (placeholder: 72.0%). High moisture risks effluent loss and clostridial fermentation.")
                .recommendation("Check for butyric smell or slimy texture. Blend with dry straw or hay if feeding.")
                .active(true)
                .note(PLACEHOLDER_NOTICE)
                .build());

        // ── 8. Adulteration Detected Rule ─────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_ADULTERATION_DETECTED")
                .sampleType("ANY")
                .parameter(AssessmentParameter.ADULTERATION)
                .operator(ComparisonOperator.NOT_EQUALS)
                .thresholdValue("NONE")
                .severity(Severity.CRITICAL)
                .category(AdvisoryCategory.CONTAMINATION)
                .message("Potential adulterant or foreign material reported in feed sample.")
                .recommendation("Halt feeding of this batch. Verify supplier authenticity and inspect remaining bags.")
                .active(true)
                .note("Direct foreign-material indicator.")
                .build());

        // ── 9. Feed Fiber Elevated Rule ───────────────────────────
        registerRule(AssessmentRule.builder()
                .ruleCode("RULE_FEED_FIBER_HIGH")
                .sampleType("FEED")
                .parameter(AssessmentParameter.FIBER)
                .operator(ComparisonOperator.GREATER_THAN)
                .thresholdValue(22.0) // Placeholder threshold in %
                .severity(Severity.INFO)
                .category(AdvisoryCategory.NUTRITION)
                .message("Crude fiber is elevated for concentrate feed (placeholder: 22.0%). May limit energy intake in high-yield cows.")
                .recommendation("Ensure adequate high-energy concentrate balance for early/mid-lactation animals.")
                .active(true)
                .note(PLACEHOLDER_NOTICE)
                .build());
    }

    public void registerRule(AssessmentRule rule) {
        rules.put(rule.getRuleCode(), rule);
    }

    public Optional<AssessmentRule> getRule(String ruleCode) {
        return Optional.ofNullable(rules.get(ruleCode));
    }

    public List<AssessmentRule> getAllRules() {
        return new ArrayList<>(rules.values());
    }

    public List<AssessmentRule> getRulesForSampleTypeAndParameter(String sampleType, AssessmentParameter parameter) {
        return rules.values().stream()
                .filter(AssessmentRule::isActive)
                .filter(r -> r.getParameter() == parameter)
                .filter(r -> "ANY".equalsIgnoreCase(r.getSampleType()) || r.getSampleType().equalsIgnoreCase(sampleType))
                .toList();
    }

    public boolean updateRuleThreshold(String ruleCode, Object newThreshold) {
        AssessmentRule rule = rules.get(ruleCode);
        if (rule != null) {
            rule.setThresholdValue(newThreshold);
            return true;
        }
        return false;
    }

    public boolean setRuleActive(String ruleCode, boolean active) {
        AssessmentRule rule = rules.get(ruleCode);
        if (rule != null) {
            rule.setActive(active);
            return true;
        }
        return false;
    }
}
