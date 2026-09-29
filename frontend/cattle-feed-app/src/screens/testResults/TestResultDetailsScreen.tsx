import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { AnalysisSource, OverallQuality, TestResult } from '../../models/testResult';
import { FeedSample } from '../../models/feed';
import { SilageSample } from '../../models/silage';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { testResultService } from '../../services/testResultService';
import { feedService } from '../../services/feedService';
import { silageService } from '../../services/silageService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const QUALITY_COLORS: Record<OverallQuality, { bg: string; text: string; label: string }> = {
  GOOD: { bg: '#E8F5E9', text: '#2E7D32', label: 'Good Quality' },
  MODERATE: { bg: '#FFF8E1', text: '#F57F17', label: 'Moderate Quality' },
  POOR: { bg: '#FBE9E7', text: '#D84315', label: 'Poor Quality' },
  UNSAFE: { bg: '#FFEBEE', text: '#C62828', label: 'Unsafe Feed' },
  UNKNOWN: { bg: '#ECEFF1', text: '#546E7A', label: 'Quality Unknown' },
};

export const TestResultDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'TestResultDetails'>['route']>();
  const { resultId } = route.params;

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [feedSample, setFeedSample] = useState<FeedSample | null>(null);
  const [silageSample, setSilageSample] = useState<SilageSample | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const result = await testResultService.getTestResultById(resultId);
      setTestResult(result);

      if (result.feedSampleId) {
        feedService
          .getFeedSampleById(result.feedSampleId)
          .then(setFeedSample)
          .catch(() => null);
      } else if (result.silageSampleId) {
        silageService
          .getSilageSampleById(result.silageSampleId)
          .then(setSilageSample)
          .catch(() => null);
      }
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingView message="Loading lab test metrics..." />;
  }

  if (errorMessage || !testResult) {
    return (
      <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="test-details-error"
          message={errorMessage || 'Test result record could not be found.'}
          onRetry={loadData}
          onDismiss={() => setErrorMessage(null)}
        />
        <AppButton
          title="Back to List"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  // Helper for displaying nullable numbers with unit
  const formatMeasurement = (
    val: number | null | undefined,
    unit: string,
    decimals = 1
  ): string => {
    if (val === null || val === undefined) {
      return 'Not Available';
    }
    return `${val.toFixed(decimals)} ${unit}`;
  };

  // Helper for displaying boolean flags (Yes / No / Not Available)
  const formatBooleanFlag = (
    val: boolean | null | undefined,
    positiveLabel = 'Yes',
    negativeLabel = 'No'
  ): string => {
    if (val === null || val === undefined) {
      return 'Not Available';
    }
    return val ? positiveLabel : negativeLabel;
  };

  // Helper for adulteration string representation
  const formatAdulteration = (val: string | null | undefined): string => {
    if (!val || val.trim() === '') {
      return 'Not Available';
    }
    const upper = val.trim().toUpperCase();
    if (upper === 'NONE' || upper === 'NO' || upper === 'CLEAN') {
      return 'No';
    }
    if (upper === 'ADULTERATION_DETECTED' || upper === 'YES') {
      return 'Yes ⚠️';
    }
    return `Yes ⚠️ (${val.trim()})`;
  };

  // Helper for text values
  const formatText = (val: string | null | undefined): string => {
    if (!val || val.trim() === '') {
      return 'Not Available';
    }
    return val;
  };

  const formatConfidence = (val: number | null | undefined): string => {
    if (val === null || val === undefined) {
      return 'Not Available';
    }
    const percent = val <= 1.0 ? val * 100 : val;
    return `${percent.toFixed(0)}%`;
  };

  const formatAnalysisSource = (val: AnalysisSource | null | undefined): string => {
    if (!val) return 'Not Available';
    switch (val) {
      case 'LAB':
        return 'Certified Lab Test (LAB)';
      case 'MANUAL':
        return 'Manual Field Test (MANUAL)';
      case 'IMAGE':
        return 'AI Visual Screening (IMAGE)';
      case 'AI':
        return 'AI Assessment (AI)';
      case 'NIR':
        return 'NIR Spectroscopy (NIR)';
      case 'IOT':
        return 'IoT Sensor (IOT)';
      default:
        return String(val);
    }
  };

  const qualityBadge = testResult.overallQuality
    ? QUALITY_COLORS[testResult.overallQuality] || QUALITY_COLORS.UNKNOWN
    : null;

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Test Result #{testResult.id}</Text>
          {qualityBadge && (
            <View style={[styles.qualityBadge, { backgroundColor: qualityBadge.bg }]}>
              <Text style={[styles.qualityBadgeText, { color: qualityBadge.text }]}>
                {qualityBadge.label}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>
          Tested on {testResult.testDate || 'Unknown date'} • Source:{' '}
          {formatAnalysisSource(testResult.analysisSource)}
        </Text>
      </View>

      {/* 1. Associated Sample */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>1. Associated Sample</Text>
        {testResult.feedSampleId ? (
          <TouchableOpacity
            style={styles.sampleLink}
            onPress={() =>
              navigation.navigate('FeedDetails', { sampleId: testResult.feedSampleId! })
            }
          >
            <View>
              <Text style={styles.sampleLinkType}>🌾 Feed Sample</Text>
              <Text style={styles.sampleLinkCode}>
                {feedSample ? `${feedSample.sampleCode} (${feedSample.feedType})` : `Sample #${testResult.feedSampleId}`}
              </Text>
            </View>
            <Text style={styles.sampleLinkArrow}>View Details →</Text>
          </TouchableOpacity>
        ) : testResult.silageSampleId ? (
          <TouchableOpacity
            style={styles.sampleLink}
            onPress={() =>
              navigation.navigate('SilageDetails', { sampleId: testResult.silageSampleId! })
            }
          >
            <View>
              <Text style={styles.sampleLinkType}>🌿 Silage Sample</Text>
              <Text style={styles.sampleLinkCode}>
                {silageSample ? `${silageSample.sampleCode} (${silageSample.silageType})` : `Sample #${testResult.silageSampleId}`}
              </Text>
            </View>
            <Text style={styles.sampleLinkArrow}>View Details →</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.naText}>No associated sample link found.</Text>
        )}
      </AppCard>

      {/* 2. Nutritional & Physical Metrics */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>2. Nutritional & Physical Metrics</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Moisture</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.moisture === null && styles.naText,
            ]}
          >
            {formatMeasurement(testResult.moisture, '%', 1)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Crude Protein</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.crudeProtein === null && styles.naText,
            ]}
          >
            {formatMeasurement(testResult.crudeProtein, '%', 1)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Crude Fiber</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.fiber === null && styles.naText,
            ]}
          >
            {formatMeasurement(testResult.fiber, '%', 1)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Energy</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.energyValue === null && styles.naText,
            ]}
          >
            {testResult.energyValue !== null && testResult.energyValue !== undefined
              ? formatMeasurement(testResult.energyValue, testResult.energyValue > 100 ? 'kcal/kg' : 'MJ/kg', testResult.energyValue > 100 ? 0 : 2)
              : 'Not Available'}
          </Text>
        </View>
      </AppCard>

      {/* 3. Safety & Contamination */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>3. Safety & Contamination</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Aflatoxin</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.aflatoxin === null && styles.naText,
            ]}
          >
            {formatMeasurement(testResult.aflatoxin, 'ppb', 2)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Mycotoxin</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.mycotoxin === null && styles.naText,
            ]}
          >
            {formatMeasurement(testResult.mycotoxin, 'ppb', 2)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Mould Detected</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.mouldDetected === null && styles.naText,
              testResult.mouldDetected === true && styles.dangerText,
              testResult.mouldDetected === false && styles.safeText,
            ]}
          >
            {formatBooleanFlag(testResult.mouldDetected, 'Yes', 'No')}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Spoilage Detected</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.spoilageDetected === null && styles.naText,
              testResult.spoilageDetected === true && styles.dangerText,
              testResult.spoilageDetected === false && styles.safeText,
            ]}
          >
            {formatBooleanFlag(testResult.spoilageDetected, 'Yes', 'No')}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Adulteration</Text>
          <Text
            style={[
              styles.metricValue,
              (!testResult.adulteration || testResult.adulteration.trim() === '') && styles.naText,
              testResult.adulteration && testResult.adulteration !== 'NONE' && testResult.adulteration !== 'No' && styles.dangerText,
              (testResult.adulteration === 'NONE' || testResult.adulteration === 'No') && styles.safeText,
            ]}
          >
            {formatAdulteration(testResult.adulteration)}
          </Text>
        </View>
      </AppCard>

      {/* 4. Other Measurements */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>4. Other Measurements</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>pH</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.ph === null && styles.naText,
            ]}
          >
            {testResult.ph !== null && testResult.ph !== undefined
              ? testResult.ph.toFixed(2)
              : 'Not Available'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Mineral Status</Text>
          <Text
            style={[
              styles.metricValue,
              !testResult.mineralStatus && styles.naText,
            ]}
          >
            {formatText(testResult.mineralStatus)}
          </Text>
        </View>
      </AppCard>

      {/* 5. Additional Information & System Records */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>5. Additional Information</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text
            style={[
              styles.metricValue,
              testResult.confidenceScore === null && styles.naText,
            ]}
          >
            {formatConfidence(testResult.confidenceScore)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Analysis Source</Text>
          <Text style={styles.metricValue}>
            {formatAnalysisSource(testResult.analysisSource)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Record Created</Text>
          <Text style={styles.metricValue}>
            {testResult.createdAt ? new Date(testResult.createdAt).toLocaleString() : 'Not Available'}
          </Text>
        </View>
      </AppCard>

      {/* Quality & Risk Assessment Action */}
      <AppCard style={styles.card} testID="test-result-assessment-card">
        <Text style={styles.sectionTitle}>Quality & Risk Assessment</Text>
        <Text style={styles.assessmentExplanation}>
          Evaluate these measurements against configured baseline rules to identify contamination, nutritional, and storage risks, and generate herd advisories.
        </Text>
        <AppButton
          testID="view-quality-assessment-button"
          title="🛡️ View Quality Assessment →"
          onPress={() =>
            navigation.navigate('AssessmentResult', {
              testResultId: testResult.id,
              sampleCode: feedSample?.sampleCode || silageSample?.sampleCode,
            })
          }
          style={styles.viewAssessmentButton}
        />
      </AppCard>

      {/* Navigation Buttons */}
      <View style={styles.actionRow}>
        <AppButton
          title="← Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <AppButton
          title="+ Record Another Test"
          onPress={() =>
            navigation.navigate('AddTestResult', {
              feedSampleId: testResult.feedSampleId || undefined,
              silageSampleId: testResult.silageSampleId || undefined,
              sampleCode: feedSample?.sampleCode || silageSample?.sampleCode,
            })
          }
          style={styles.newTestButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
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
    gap: spacing.sm,
  },
  pageTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  headerSub: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  qualityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  qualityBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.xs,
  },
  sampleLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  sampleLinkType: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  sampleLinkCode: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: 2,
  },
  sampleLinkArrow: {
    fontSize: typography.fontSize.caption,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  metricLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    flex: 1,
  },
  metricValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  naText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  dangerText: {
    color: colors.error,
    fontWeight: 'bold',
  },
  safeText: {
    color: colors.success,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    flex: 1,
  },
  newTestButton: {
    flex: 2,
  },
  assessmentExplanation: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  viewAssessmentButton: {
    width: '100%',
  },
});

export default TestResultDetailsScreen;
