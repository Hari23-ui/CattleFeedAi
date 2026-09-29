import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppNavigationProp, AppStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { ErrorMessage } from '../../components/ErrorMessage';
import { analyticsService } from '../../services/analyticsService';
import { HistoricalTestPoint, SampleHistoricalTrends } from '../../models/analytics';

const DATE_FILTERS: { label: string; value: number | undefined }[] = [
  { label: 'All History', value: undefined },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export const SilageHistoryScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'SilageHistory'>>();
  const { silageSampleId, sampleCode } = route.params;

  const [selectedDays, setSelectedDays] = useState<number | undefined>(undefined);
  const [data, setData] = useState<SampleHistoricalTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await analyticsService.getSilageSampleHistory(silageSampleId, selectedDays);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load silage sample history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [silageSampleId, selectedDays]);

  const formatValue = (val: number | string | boolean | null | undefined, unit = '') => {
    if (val === null || val === undefined) {
      return 'Not Available';
    }
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    return `${val}${unit ? ` ${unit}` : ''}`;
  };

  const getQualityColor = (status: string) => {
    switch (status) {
      case 'GOOD':
        return colors.statusGood;
      case 'ACCEPTABLE':
        return colors.statusAcceptable;
      case 'NEEDS_ATTENTION':
        return colors.statusNeedsAttention;
      case 'UNSAFE':
        return colors.statusUnsafe;
      default:
        return colors.statusInsufficientData;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return colors.statusGood;
      case 'MEDIUM':
        return colors.statusNeedsAttention;
      case 'HIGH':
        return colors.statusUnsafe;
      default:
        return colors.textMuted;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Silage History: {data?.sampleCode || sampleCode || `ID #${silageSampleId}`}
          </Text>
          <Text style={styles.headerSubtitle}>
            Fermentation stability, pH progression, and nutritional preservation
          </Text>
        </View>

        {/* Date Filter Pills */}
        <View style={styles.filterRow}>
          {DATE_FILTERS.map((f) => {
            const isSelected = selectedDays === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedDays(f.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${f.label}`}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && <ErrorMessage message={error} onRetry={() => fetchHistory()} />}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Compiling silage records...</Text>
          </View>
        ) : data ? (
          <>
            {/* Sample Information Card */}
            <AppCard style={styles.card}>
              <View style={styles.sampleMetaGrid}>
                <View style={styles.sampleMetaItem}>
                  <Text style={styles.metaLabel}>Sample Code</Text>
                  <Text style={styles.metaValue}>{data.sampleCode}</Text>
                </View>
                <View style={styles.sampleMetaItem}>
                  <Text style={styles.metaLabel}>Silage Type</Text>
                  <Text style={styles.metaValue}>
                    {data.subtype?.replace(/_/g, ' ') || 'Unspecified'}
                  </Text>
                </View>
                <View style={styles.sampleMetaItem}>
                  <Text style={styles.metaLabel}>Farm</Text>
                  <Text style={styles.metaValue}>
                    {data.farmName || 'Not Available'}
                  </Text>
                </View>
                <View style={styles.sampleMetaItem}>
                  <Text style={styles.metaLabel}>Assigned Animal</Text>
                  <Text style={styles.metaValue}>
                    {data.animalTag || 'Not Available'}
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Descriptive Summary Card */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Fermentation & Quality Summary</Text>
              <Text style={styles.descriptiveText}>{data.descriptiveSummary}</Text>
            </AppCard>

            {/* Historical Test Points List */}
            <Text style={styles.sectionHeading}>
              Test Records ({data.totalTestPoints})
            </Text>

            {data.testPoints.length > 0 ? (
              data.testPoints.map((pt, idx) => (
                <AppCard key={pt.testResultId || idx} style={styles.pointCard}>
                  {/* Point Header */}
                  <View style={styles.pointHeader}>
                    <View>
                      <Text style={styles.pointDate}>{pt.testDate}</Text>
                      <Text style={styles.pointSource}>
                        Source: {pt.analysisSource || 'Standard'}
                      </Text>
                    </View>
                    <View style={styles.pointBadges}>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor:
                              getQualityColor(pt.qualityStatus) + '20',
                            borderColor: getQualityColor(pt.qualityStatus),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: getQualityColor(pt.qualityStatus) },
                          ]}
                        >
                          {pt.qualityStatus}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: getRiskColor(pt.riskLevel) + '20',
                            borderColor: getRiskColor(pt.riskLevel),
                            marginTop: 4,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: getRiskColor(pt.riskLevel) },
                          ]}
                        >
                          Risk: {pt.riskLevel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Measurement Table */}
                  <View style={styles.measurementGrid}>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>pH</Text>
                      <Text
                        style={[
                          styles.measVal,
                          { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        {formatValue(pt.ph)}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Moisture</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.moisture, '%')}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Crude Protein</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.crudeProtein, '%')}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Fiber</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.fiber, '%')}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Energy Value</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.energyValue, 'kcal/kg')}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Aflatoxin</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.aflatoxin, 'ppb')}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Mycotoxin</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.mycotoxin, 'ppb')}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Mineral Status</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.mineralStatus)}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Adulteration</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.adulteration)}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Mould Detected</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.mouldDetected)}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Spoilage Detected</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.spoilageDetected)}
                      </Text>
                    </View>
                    <View style={styles.measItem}>
                      <Text style={styles.measLabel}>Confidence</Text>
                      <Text style={styles.measVal}>
                        {formatValue(pt.confidenceScore, '%')}
                      </Text>
                    </View>
                  </View>
                </AppCard>
              ))
            ) : (
              <AppCard style={styles.card}>
                <Text style={styles.emptyNotice}>
                  No test results recorded for this silage sample in the selected period.
                </Text>
              </AppCard>
            )}

            {/* Scientific Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerTitle}>Scientific Boundary Notice</Text>
              <Text style={styles.disclaimerText}>{data.disclaimer}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: typography.fontSize.small,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.textInverse,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sampleMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sampleMetaItem: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  metaLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  descriptiveText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  pointCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  pointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pointDate: {
    fontSize: typography.fontSize.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pointSource: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pointBadges: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.fontSize.caption - 2,
    fontWeight: '700',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  measItem: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  measLabel: {
    fontSize: typography.fontSize.caption - 2,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  measVal: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  emptyNotice: {
    fontSize: typography.fontSize.small,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  disclaimerContainer: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  disclaimerTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: colors.info,
    marginBottom: spacing.xs,
  },
  disclaimerText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.small,
  },
});
