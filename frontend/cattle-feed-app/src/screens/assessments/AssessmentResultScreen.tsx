import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  QualityStatusBadge,
  RiskIndicatorCard,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import {
  AssessmentSummaryResponse,
  ParameterAssessmentDto,
  QualityAssessmentResponse,
} from '../../models/assessment';
import { RiskAssessmentResponse, RiskLevel } from '../../models/risk';
import { TestResult } from '../../models/testResult';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { assessmentService } from '../../services/assessmentService';
import { testResultService } from '../../services/testResultService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const RISK_LEVEL_THEME: Record<
  RiskLevel,
  { bg: string; text: string; label: string }
> = {
  LOW: { bg: '#E8F5E9', text: '#2E7D32', label: 'Low Risk' },
  MEDIUM: { bg: '#FFF8E1', text: '#F57F17', label: 'Medium Risk' },
  HIGH: { bg: '#FFEBEE', text: '#C62828', label: 'High Risk' },
  UNKNOWN: { bg: '#ECEFF1', text: '#546E7A', label: 'Unknown Risk' },
};

export const AssessmentResultScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AssessmentResult'>['route']>();
  const { testResultId } = route.params;

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [quality, setQuality] = useState<QualityAssessmentResponse | null>(null);
  const [risk, setRisk] = useState<RiskAssessmentResponse | null>(null);
  const [summary, setSummary] = useState<AssessmentSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [testData, qualityData, riskData] = await Promise.all([
        testResultService.getTestResultById(testResultId).catch(() => null),
        assessmentService.getQualityAssessment(testResultId),
        assessmentService.getRiskAssessment(testResultId),
      ]);
      setTestResult(testData);
      setQuality(qualityData);
      setRisk(riskData);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [testResultId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleEvaluateAndGenerateAdvisories = async () => {
    try {
      setIsEvaluating(true);
      setErrorMessage(null);
      const result = await assessmentService.evaluateAndGenerateAdvisories(testResultId);
      setSummary(result);
      if (result.qualityAssessment) setQuality(result.qualityAssessment);
      if (result.riskAssessment) setRisk(result.riskAssessment);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Evaluating test parameters against quality rules..." />;
  }

  if (errorMessage && !quality) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="assessment-error"
          message={errorMessage}
          onRetry={loadData}
          onDismiss={() => setErrorMessage(null)}
        />
        <AppButton
          title="Back to Test Result"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  // Format parameter display value safely preserving null / missing values
  const renderParameterValue = (p: ParameterAssessmentDto) => {
    if (p.measuredValue === null || p.measuredValue === undefined) {
      return <Text style={styles.naText}>Not Available</Text>;
    }
    if (typeof p.measuredValue === 'boolean') {
      return (
        <Text style={p.measuredValue ? styles.warningValue : styles.safeValue}>
          {p.measuredValue ? 'Detected ⚠️' : 'Not Detected ✓'}
        </Text>
      );
    }
    const unit = p.unit ? ` ${p.unit}` : '';
    return (
      <Text style={styles.paramValueText}>
        {String(p.measuredValue)}
        {unit}
      </Text>
    );
  };

  const riskTheme = risk ? RISK_LEVEL_THEME[risk.overallRiskLevel] || RISK_LEVEL_THEME.UNKNOWN : null;
  const activeAdvisories = summary?.generatedAdvisories || [];

  return (
    <ScreenContainer
      scrollable={true}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {errorMessage && (
        <ErrorMessage
          testID="assessment-alert-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Quality & Risk Assessment</Text>
        </View>
        <Text style={styles.headerSub}>
          Sample: {quality?.sampleCode || 'Sample #' + (quality?.sampleId || testResultId)} •{' '}
          Type: {quality?.sampleType || 'FEED'}
        </Text>
        {testResult && (
          <Text style={styles.headerMeta}>
            Analysis Source: {testResult.analysisSource || 'LAB'} • Tested on:{' '}
            {testResult.testDate || 'N/A'}
          </Text>
        )}
      </View>

      {/* Overall Quality Status Card */}
      <AppCard style={styles.card} testID="quality-summary-card">
        <Text style={styles.sectionTitle}>Overall Quality Assessment</Text>
        <View style={styles.qualityRow}>
          <QualityStatusBadge
            status={quality?.qualityStatus}
            showDescription={true}
            testID="assessment-quality-badge"
          />
        </View>

        {quality?.explanation ? (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationLabel}>Evaluation Summary:</Text>
            <Text style={styles.explanationText}>{quality.explanation}</Text>
          </View>
        ) : null}

        {quality?.triggeredRulesCount !== undefined && quality.triggeredRulesCount > 0 && (
          <View style={styles.ruleCountRow}>
            <Text style={styles.ruleCountLabel}>Triggered Quality Rules:</Text>
            <Text style={styles.ruleCountValue}>{quality.triggeredRulesCount}</Text>
          </View>
        )}

        {quality?.disclaimer ? (
          <Text style={styles.disclaimerText}>{quality.disclaimer}</Text>
        ) : null}
      </AppCard>

      {/* Evaluated Parameters List */}
      <AppCard style={styles.card} testID="parameters-list-card">
        <Text style={styles.sectionTitle}>Parameter Screening Results</Text>
        <Text style={styles.sectionSubtitle}>
          Evaluated from physical, chemical, and microbiological lab metrics.
        </Text>

        {quality?.parameters && quality.parameters.length > 0 ? (
          quality.parameters.map((param, index) => (
            <View key={param.parameter || index} style={styles.parameterRow}>
              <View style={styles.parameterInfo}>
                <Text style={styles.paramName}>
                  {formatParameterName(param.parameter)}
                </Text>
                <Text style={styles.paramNote}>{param.evaluationNote}</Text>
              </View>

              <View style={styles.paramRightCol}>
                <View style={styles.paramValueContainer}>
                  {renderParameterValue(param)}
                </View>
                <View
                  style={[
                    styles.paramStatusBadge,
                    getParamStatusStyle(param.status),
                  ]}
                >
                  <Text
                    style={[
                      styles.paramStatusText,
                      getParamStatusTextStyle(param.status),
                    ]}
                  >
                    {param.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.naText}>No parameters recorded for evaluation.</Text>
        )}
      </AppCard>

      {/* Potential Risk Indicators */}
      <AppCard style={styles.card} testID="risk-assessment-card">
        <View style={styles.riskHeaderRow}>
          <Text style={styles.sectionTitle}>Risk Screening Layer</Text>
          {riskTheme && (
            <View
              style={[
                styles.riskLevelBadge,
                { backgroundColor: riskTheme.bg },
              ]}
            >
              <Text style={[styles.riskLevelText, { color: riskTheme.text }]}>
                {riskTheme.label}
              </Text>
            </View>
          )}
        </View>

        {risk?.screeningDisclaimer ? (
          <Text style={styles.disclaimerText}>{risk.screeningDisclaimer}</Text>
        ) : null}

        {/* Contamination Risks */}
        {risk?.contaminationRisks && risk.contaminationRisks.length > 0 && (
          <View style={styles.riskGroup}>
            <Text style={styles.riskGroupTitle}>⚠️ Contamination Risks</Text>
            {risk.contaminationRisks.map((item, idx) => (
              <RiskIndicatorCard key={`contam-${idx}`} risk={item} />
            ))}
          </View>
        )}

        {/* Nutritional Imbalances */}
        {risk?.nutritionalImbalances && risk.nutritionalImbalances.length > 0 && (
          <View style={styles.riskGroup}>
            <Text style={styles.riskGroupTitle}>🌾 Nutritional Imbalances</Text>
            {risk.nutritionalImbalances.map((item, idx) => (
              <RiskIndicatorCard key={`nutr-${idx}`} risk={item} />
            ))}
          </View>
        )}

        {/* Storage / Spoilage Risks */}
        {risk?.storageSpoilageRisks && risk.storageSpoilageRisks.length > 0 && (
          <View style={styles.riskGroup}>
            <Text style={styles.riskGroupTitle}>🏚️ Storage & Spoilage Risks</Text>
            {risk.storageSpoilageRisks.map((item, idx) => (
              <RiskIndicatorCard key={`storage-${idx}`} risk={item} />
            ))}
          </View>
        )}

        {/* Empty state when no risks detected */}
        {(!risk?.allRisks || risk.allRisks.length === 0) && (
          <View style={styles.cleanRiskBox}>
            <Text style={styles.cleanRiskIcon}>✓</Text>
            <Text style={styles.cleanRiskTitle}>No Elevated Risk Indicators</Text>
            <Text style={styles.cleanRiskText}>
              All evaluated parameters are within configured baseline screening thresholds.
            </Text>
          </View>
        )}
      </AppCard>

      {/* Advisory Generation & Actions */}
      <AppCard style={styles.card} testID="advisory-section-card">
        <Text style={styles.sectionTitle}>Herd Management Advisories</Text>
        <Text style={styles.sectionSubtitle}>
          Prioritized, non-diagnostic management guidance derived from identified risks.
        </Text>

        <AppButton
          testID="generate-advisories-button"
          title={isEvaluating ? 'Evaluating Advisories...' : '⚡ Generate Herd Advisories'}
          onPress={handleEvaluateAndGenerateAdvisories}
          loading={isEvaluating}
          disabled={isEvaluating}
          style={styles.advisoryButton}
        />

        {activeAdvisories.length > 0 ? (
          <View style={styles.advisoriesList}>
            <Text style={styles.advisoryListHeader}>Generated Advisories:</Text>
            {activeAdvisories.map((adv, idx) => (
              <View key={adv.id || idx} style={styles.advisoryItem}>
                <View style={styles.advisoryItemTop}>
                  <Text style={styles.advisoryItemTitle}>{adv.title}</Text>
                  {adv.priority && (
                    <View
                      style={[
                        styles.priorityBadge,
                        adv.priority === 'HIGH' && styles.priorityHigh,
                        adv.priority === 'MEDIUM' && styles.priorityMedium,
                        adv.priority === 'LOW' && styles.priorityLow,
                      ]}
                    >
                      <Text style={styles.priorityText}>{adv.priority}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.advisoryItemMsg}>{adv.message}</Text>
                {adv.recommendedAction ? (
                  <View style={styles.recBox}>
                    <Text style={styles.recLabel}>Action: {adv.recommendedAction}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : summary ? (
          <View style={styles.emptyAdvisoriesBox}>
            <Text style={styles.emptyAdvisoriesText}>
              No specific advisories generated for this sample.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.allAdvisoriesLink}
          onPress={() => navigation.navigate('AdvisoryList')}
          accessibilityLabel="View All Herd Advisories"
        >
          <Text style={styles.allAdvisoriesLinkText}>
            View All Herd Advisories →
          </Text>
        </TouchableOpacity>
      </AppCard>

      {/* Back Button */}
      <View style={styles.actionRow}>
        <AppButton
          title="← Back to Test Result"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    </ScreenContainer>
  );
};

// Helper: readable parameter names
const formatParameterName = (param: string): string => {
  return param
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper: status styles
const getParamStatusStyle = (status: string) => {
  switch (status) {
    case 'CRITICAL':
      return { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A' };
    case 'HIGH':
    case 'WARNING':
      return { backgroundColor: '#FFF8E1', borderColor: '#FFE082' };
    case 'NORMAL':
      return { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' };
    case 'NOT_AVAILABLE':
    default:
      return { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' };
  }
};

const getParamStatusTextStyle = (status: string) => {
  switch (status) {
    case 'CRITICAL':
      return { color: '#C62828' };
    case 'HIGH':
    case 'WARNING':
      return { color: '#E65100' };
    case 'NORMAL':
      return { color: '#2E7D32' };
    case 'NOT_AVAILABLE':
    default:
      return { color: '#757575' };
  }
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  headerMeta: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  qualityRow: {
    marginVertical: spacing.xs,
  },
  explanationBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  explanationLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  explanationText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  ruleCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  ruleCountLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  ruleCountValue: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  disclaimerText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  parameterInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  paramName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  paramNote: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paramRightCol: {
    alignItems: 'flex-end',
  },
  paramValueContainer: {
    marginBottom: 4,
  },
  paramValueText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  naText: {
    fontSize: typography.fontSize.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  safeValue: {
    fontSize: typography.fontSize.small,
    color: colors.success,
    fontWeight: 'bold',
  },
  warningValue: {
    fontSize: typography.fontSize.small,
    color: colors.warning,
    fontWeight: 'bold',
  },
  paramStatusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paramStatusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  riskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  riskLevelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  riskLevelText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  riskGroup: {
    marginTop: spacing.md,
  },
  riskGroupTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cleanRiskBox: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#F1F8E9',
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  cleanRiskIcon: {
    fontSize: 32,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  cleanRiskTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: '#33691E',
  },
  cleanRiskText: {
    fontSize: typography.fontSize.small,
    color: '#558B2F',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  advisoryButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  advisoriesList: {
    marginTop: spacing.sm,
  },
  advisoryListHeader: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  advisoryItem: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  advisoryItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  advisoryItemTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  priorityHigh: {
    backgroundColor: '#FFEBEE',
  },
  priorityMedium: {
    backgroundColor: '#FFF8E1',
  },
  priorityLow: {
    backgroundColor: '#E8F5E9',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  advisoryItemMsg: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recBox: {
    backgroundColor: '#E8F5E9',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  recLabel: {
    fontSize: typography.fontSize.caption,
    color: '#2E7D32',
    fontWeight: typography.fontWeight.semibold,
  },
  emptyAdvisoriesBox: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  emptyAdvisoriesText: {
    fontSize: typography.fontSize.small,
    color: colors.textMuted,
  },
  allAdvisoriesLink: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  allAdvisoriesLinkText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  actionRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: '100%',
  },
});

export default AssessmentResultScreen;
