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
import { AnimalAnalytics, HistoricalTestPoint } from '../../models/analytics';

const DATE_FILTERS: { label: string; value: number | undefined }[] = [
  { label: 'All History', value: undefined },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export const AnimalAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'AnimalAnalytics'>>();
  const { animalId, animalTag } = route.params;

  const [selectedDays, setSelectedDays] = useState<number | undefined>(undefined);
  const [data, setData] = useState<AnimalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await analyticsService.getAnimalAnalytics(animalId, selectedDays);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load animal analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [animalId, selectedDays]);

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
            onRefresh={() => fetchAnalytics(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Animal Analytics: {data?.animalTag || animalTag || `ID #${animalId}`}
          </Text>
          <Text style={styles.headerSubtitle}>
            Historical test progression, recorded nutrition, and risk screening
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

        {error && <ErrorMessage message={error} onRetry={() => fetchAnalytics()} />}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading historical animal records...</Text>
          </View>
        ) : data ? (
          <>
            {/* Animal Profile Summary Card */}
            <AppCard style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.animalName}>
                    {data.name || 'Unnamed Animal'}
                  </Text>
                  <Text style={styles.animalMeta}>
                    Tag: {data.animalTag} • {data.breed || 'Breed Unspecified'} • {data.gender || 'Unknown'}
                  </Text>
                  {data.farmName && (
                    <Text style={styles.farmText}>Farm: {data.farmName}</Text>
                  )}
                </View>
              </View>

              <View style={styles.profileStatsRow}>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatLabel}>Weight</Text>
                  <Text style={styles.profileStatValue}>
                    {formatValue(data.weight, 'kg')}
                  </Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatLabel}>Lactation Stage</Text>
                  <Text style={styles.profileStatValue}>
                    {data.lactationStage || 'Not Available'}
                  </Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatLabel}>Milk Yield</Text>
                  <Text style={styles.profileStatValue}>
                    {formatValue(data.milkProductionPerDay, 'L/day')}
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Test Activity Totals Grid */}
            <View style={styles.totalsGrid}>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{data.totalTestResults}</Text>
                <Text style={styles.totalLabel}>Total Tests</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{data.totalFeedTests}</Text>
                <Text style={styles.totalLabel}>Feed Tests</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{data.totalSilageTests}</Text>
                <Text style={styles.totalLabel}>Silage Tests</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: colors.accent }]}>
                  {data.totalActiveAdvisories}
                </Text>
                <Text style={styles.totalLabel}>Advisories</Text>
              </View>
              <View style={styles.totalCard}>
                <Text style={[styles.totalValue, { color: colors.info }]}>
                  {data.totalConsultations}
                </Text>
                <Text style={styles.totalLabel}>Consultations</Text>
              </View>
            </View>

            {/* Descriptive Summary Card */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Historical Trend Summary</Text>
              <Text style={styles.descriptiveText}>{data.descriptiveSummary}</Text>
            </AppCard>

            {/* Latest Measurements Card */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Latest Recorded Measurements</Text>
              <Text style={styles.cardSubtitle}>
                Most recent test point recorded in the system
              </Text>

              {data.latestMeasurements ? (
                <View style={styles.measurementsGrid}>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Test Date</Text>
                    <Text style={styles.paramValue}>
                      {data.latestMeasurements.testDate}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Sample Code</Text>
                    <Text style={styles.paramValue}>
                      {data.latestMeasurements.sampleCode || 'Not Available'}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Sample Type</Text>
                    <Text style={styles.paramValue}>
                      {data.latestMeasurements.sampleType}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Moisture</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.moisture, '%')}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Crude Protein</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.crudeProtein, '%')}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Fiber</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.fiber, '%')}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>pH</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.ph)}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Aflatoxin</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.aflatoxin, 'ppb')}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Mould Detected</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.mouldDetected)}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Spoilage Detected</Text>
                    <Text style={styles.paramValue}>
                      {formatValue(data.latestMeasurements.spoilageDetected)}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Quality Status</Text>
                    <Text
                      style={[
                        styles.paramValue,
                        {
                          color: getQualityColor(
                            data.latestMeasurements.qualityStatus
                          ),
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {data.latestMeasurements.qualityStatus}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.paramLabel}>Risk Level</Text>
                    <Text
                      style={[
                        styles.paramValue,
                        {
                          color: getRiskColor(data.latestMeasurements.riskLevel),
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {data.latestMeasurements.riskLevel}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyNotice}>
                  No test results recorded for this animal yet.
                </Text>
              )}
            </AppCard>

            {/* Test History List */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>
                Chronological Test History ({data.testHistory.length})
              </Text>
              <Text style={styles.cardSubtitle}>
                Historical test results recorded over time
              </Text>

              {data.testHistory.length > 0 ? (
                data.testHistory.map((item, index) => (
                  <View
                    key={item.testResultId || index}
                    style={styles.historyItemCard}
                  >
                    <View style={styles.historyItemHeader}>
                      <View>
                        <Text style={styles.historyDate}>{item.testDate}</Text>
                        <Text style={styles.historyCode}>
                          {item.sampleType}: {item.sampleCode || 'Uncoded'}
                        </Text>
                      </View>
                      <View style={styles.badgesCol}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor:
                                getQualityColor(item.qualityStatus) + '20',
                              borderColor: getQualityColor(item.qualityStatus),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: getQualityColor(item.qualityStatus) },
                            ]}
                          >
                            {item.qualityStatus}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor:
                                getRiskColor(item.riskLevel) + '20',
                              borderColor: getRiskColor(item.riskLevel),
                              marginTop: 4,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: getRiskColor(item.riskLevel) },
                            ]}
                          >
                            Risk: {item.riskLevel}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.historyMeasurementsRow}>
                      <Text style={styles.historyParam}>
                        CP: {formatValue(item.crudeProtein, '%')}
                      </Text>
                      <Text style={styles.historyParam}>
                        Moisture: {formatValue(item.moisture, '%')}
                      </Text>
                      {item.ph !== null && item.ph !== undefined && (
                        <Text style={styles.historyParam}>
                          pH: {item.ph}
                        </Text>
                      )}
                      {item.aflatoxin !== null && item.aflatoxin !== undefined && (
                        <Text style={styles.historyParam}>
                          Aflatoxin: {item.aflatoxin} ppb
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyNotice}>
                  No historical test points found in this period.
                </Text>
              )}
            </AppCard>

            {/* Active Advisories Card */}
            {data.activeAdvisoryTitles && data.activeAdvisoryTitles.length > 0 && (
              <AppCard style={styles.card}>
                <Text style={styles.cardTitle}>Active Advisories</Text>
                {data.activeAdvisoryTitles.map((title, i) => (
                  <Text key={i} style={styles.advisoryBullet}>
                    • {title}
                  </Text>
                ))}
              </AppCard>
            )}

            {/* Health Risk Screening Indicators */}
            {data.healthRiskSummary && data.healthRiskSummary.length > 0 && (
              <AppCard style={styles.card}>
                <Text style={styles.cardTitle}>Health Risk Indicators</Text>
                {data.healthRiskSummary.map((summary, i) => (
                  <Text key={i} style={styles.healthRiskBullet}>
                    • {summary}
                  </Text>
                ))}
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
  cardSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  animalName: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  animalMeta: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  farmText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileStatsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    justifyContent: 'space-between',
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  profileStatValue: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  totalsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  totalCard: {
    flex: 1,
    minWidth: 60,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalValue: {
    fontSize: typography.fontSize.title,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalLabel: {
    fontSize: typography.fontSize.caption - 2,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  descriptiveText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.xs,
  },
  measurementsGrid: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs / 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  paramLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  paramValue: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyNotice: {
    fontSize: typography.fontSize.small,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  historyItemCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyCode: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  badgesCol: {
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
  historyMeasurementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
    paddingTop: spacing.xs / 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyParam: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  advisoryBullet: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    marginVertical: 2,
  },
  healthRiskBullet: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    marginVertical: 2,
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
