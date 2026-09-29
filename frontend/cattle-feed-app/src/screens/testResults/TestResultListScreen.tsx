import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
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
  OptionSelector,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { OverallQuality, TestResult } from '../../models/testResult';
import { FeedSample } from '../../models/feed';
import { SilageSample } from '../../models/silage';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { testResultService } from '../../services/testResultService';
import { feedService } from '../../services/feedService';
import { silageService } from '../../services/silageService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const QUALITY_BADGES: Record<OverallQuality, { bg: string; text: string; label: string }> = {
  GOOD: { bg: '#E8F5E9', text: '#2E7D32', label: 'Good' },
  MODERATE: { bg: '#FFF8E1', text: '#F57F17', label: 'Moderate' },
  POOR: { bg: '#FBE9E7', text: '#D84315', label: 'Poor' },
  UNSAFE: { bg: '#FFEBEE', text: '#C62828', label: 'Unsafe' },
  UNKNOWN: { bg: '#ECEFF1', text: '#546E7A', label: 'Unknown' },
};

export const TestResultListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'TestResultList'>['route']>();

  const paramFeedId = route.params?.feedSampleId;
  const paramSilageId = route.params?.silageSampleId;
  const paramSampleCode = route.params?.sampleCode;

  const [activeSampleType, setActiveSampleType] = useState<'FEED' | 'SILAGE'>(
    paramSilageId ? 'SILAGE' : 'FEED'
  );
  const [selectedFeedId, setSelectedFeedId] = useState<number | undefined>(paramFeedId);
  const [selectedSilageId, setSelectedSilageId] = useState<number | undefined>(paramSilageId);

  const [feedSamples, setFeedSamples] = useState<FeedSample[]>([]);
  const [silageSamples, setSilageSamples] = useState<SilageSample[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load available samples if not locked via params
  useEffect(() => {
    if (!paramFeedId && !paramSilageId) {
      const loadSamples = async () => {
        try {
          const [feeds, silages] = await Promise.all([
            feedService.getAllFeedSamples().catch(() => [] as FeedSample[]),
            silageService.getAllSilageSamples().catch(() => [] as SilageSample[]),
          ]);
          setFeedSamples(feeds);
          setSilageSamples(silages);
          if (feeds.length > 0 && !selectedFeedId) {
            setSelectedFeedId(feeds[0].id);
          } else if (silages.length > 0 && !selectedSilageId) {
            setActiveSampleType('SILAGE');
            setSelectedSilageId(silages[0].id);
          }
        } catch (err) {
          setErrorMessage(getFarmerFriendlyErrorMessage(err));
        }
      };
      loadSamples();
    }
  }, [paramFeedId, paramSilageId, selectedFeedId, selectedSilageId]);

  const loadTestResults = useCallback(async () => {
    const feedId = paramFeedId || (activeSampleType === 'FEED' ? selectedFeedId : undefined);
    const silageId = paramSilageId || (activeSampleType === 'SILAGE' ? selectedSilageId : undefined);

    if (!feedId && !silageId) {
      setTestResults([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setErrorMessage(null);
      let results: TestResult[] = [];
      if (feedId) {
        results = await testResultService.getTestResultsByFeedSampleId(feedId);
      } else if (silageId) {
        results = await testResultService.getTestResultsBySilageSampleId(silageId);
      }
      setTestResults(results);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [paramFeedId, paramSilageId, activeSampleType, selectedFeedId, selectedSilageId]);

  useEffect(() => {
    loadTestResults();
  }, [loadTestResults]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTestResults();
  };

  const handleAddTestResult = () => {
    const feedId = paramFeedId || (activeSampleType === 'FEED' ? selectedFeedId : undefined);
    const silageId = paramSilageId || (activeSampleType === 'SILAGE' ? selectedSilageId : undefined);
    const sampleCode = paramSampleCode ||
      (activeSampleType === 'FEED'
        ? feedSamples.find((f) => f.id === feedId)?.sampleCode
        : silageSamples.find((s) => s.id === silageId)?.sampleCode);

    navigation.navigate('AddTestResult', {
      feedSampleId: feedId,
      silageSampleId: silageId,
      sampleCode,
    });
  };

  const isLocked = Boolean(paramFeedId || paramSilageId);

  const feedOptions = feedSamples.map((f) => ({
    label: `${f.sampleCode} (${f.feedType})`,
    value: f.id,
    description: `Sampled: ${f.sampleDate}`,
  }));

  const silageOptions = silageSamples.map((s) => ({
    label: `${s.sampleCode} (${s.silageType})`,
    value: s.id,
    description: `Sampled: ${s.sampleDate}`,
  }));

  const renderItem = ({ item }: { item: TestResult }) => {
    const badge = item.overallQuality ? QUALITY_BADGES[item.overallQuality] : null;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('TestResultDetails', { resultId: item.id })}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Test #{item.id}</Text>
              <Text style={styles.cardDate}>
                {item.testDate || 'Date not recorded'} • Source: {item.analysisSource || 'Not Available'}
              </Text>
            </View>
            {badge && (
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Moisture</Text>
              <Text style={styles.metricItemValue}>
                {item.moisture !== null && item.moisture !== undefined
                  ? `${item.moisture.toFixed(1)}%`
                  : 'Not Available'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Crude Protein</Text>
              <Text style={styles.metricItemValue}>
                {item.crudeProtein !== null && item.crudeProtein !== undefined
                  ? `${item.crudeProtein.toFixed(1)}%`
                  : 'Not Available'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>pH</Text>
              <Text style={styles.metricItemValue}>
                {item.ph !== null && item.ph !== undefined
                  ? item.ph.toFixed(2)
                  : 'Not Available'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricItemLabel}>Aflatoxin</Text>
              <Text style={styles.metricItemValue}>
                {item.aflatoxin !== null && item.aflatoxin !== undefined
                  ? `${item.aflatoxin.toFixed(1)} ppb`
                  : 'Not Available'}
              </Text>
            </View>
          </View>

          {(item.mouldDetected !== null || item.spoilageDetected !== null) && (
            <View style={styles.safetyRow}>
              {item.mouldDetected !== null && (
                <Text
                  style={[
                    styles.safetyTag,
                    item.mouldDetected ? styles.safetyTagDanger : styles.safetyTagSafe,
                  ]}
                >
                  {item.mouldDetected ? '⚠️ Mould' : '✓ No Mould'}
                </Text>
              )}
              {item.spoilageDetected !== null && (
                <Text
                  style={[
                    styles.safetyTag,
                    item.spoilageDetected ? styles.safetyTagDanger : styles.safetyTagSafe,
                  ]}
                >
                  {item.spoilageDetected ? '⚠️ Spoilage' : '✓ No Spoilage'}
                </Text>
              )}
            </View>
          )}
        </AppCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Screen Title */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.screenTitle}>Test Results</Text>
          <Text style={styles.screenSubtitle}>
            {paramSampleCode
              ? `Results for Sample: ${paramSampleCode}`
              : 'Nutritional & quality analysis history'}
          </Text>
        </View>
        <AppButton
          title="+ Record Test"
          onPress={handleAddTestResult}
          size="small"
        />
      </View>

      {/* Filter / Selector if not locked */}
      {!isLocked && (
        <AppCard style={styles.filterCard}>
          <View style={styles.typeToggleRow}>
            <TouchableOpacity
              style={[styles.typeButton, activeSampleType === 'FEED' && styles.typeButtonActive]}
              onPress={() => setActiveSampleType('FEED')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  activeSampleType === 'FEED' && styles.typeButtonTextActive,
                ]}
              >
                🌾 Feed Sample
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, activeSampleType === 'SILAGE' && styles.typeButtonActive]}
              onPress={() => setActiveSampleType('SILAGE')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  activeSampleType === 'SILAGE' && styles.typeButtonTextActive,
                ]}
              >
                🌿 Silage Sample
              </Text>
            </TouchableOpacity>
          </View>

          {activeSampleType === 'FEED' ? (
            feedSamples.length > 0 ? (
              <OptionSelector
                testID="filter-feed-selector"
                label="Selected Feed Sample"
                options={feedOptions}
                selectedValue={selectedFeedId}
                onSelect={(val) => setSelectedFeedId(val)}
              />
            ) : (
              <Text style={styles.emptyPrompt}>No feed samples available.</Text>
            )
          ) : silageSamples.length > 0 ? (
            <OptionSelector
              testID="filter-silage-selector"
              label="Selected Silage Sample"
              options={silageOptions}
              selectedValue={selectedSilageId}
              onSelect={(val) => setSelectedSilageId(val)}
            />
          ) : (
            <Text style={styles.emptyPrompt}>No silage samples available.</Text>
          )}
        </AppCard>
      )}

      {errorMessage && (
        <ErrorMessage
          testID="test-list-error"
          message={errorMessage}
          onRetry={loadTestResults}
          onDismiss={() => setErrorMessage(null)}
          style={styles.error}
        />
      )}

      {isLoading ? (
        <LoadingView message="Loading test results..." />
      ) : (
        <FlatList
          data={testResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧪</Text>
              <Text style={styles.emptyTitle}>No Test Results Yet</Text>
              <Text style={styles.emptySubtitle}>
                No chemical or sensory tests have been recorded for this sample.
              </Text>
              <AppButton
                title="+ Record First Test Result"
                onPress={handleAddTestResult}
                style={styles.emptyButton}
              />
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTextGroup: {
    flex: 1,
  },
  screenTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  emptyPrompt: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  error: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  metricItem: {
    width: '47%',
  },
  metricItemLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  metricItemValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
  },
  safetyRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  safetyTag: {
    fontSize: typography.fontSize.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  safetyTagSafe: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  safetyTagDanger: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default TestResultListScreen;
