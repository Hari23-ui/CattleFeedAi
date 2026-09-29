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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AppNavigationProp } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { ErrorMessage } from '../../components/ErrorMessage';
import { analyticsService } from '../../services/analyticsService';
import { FarmAnalyticsSummary } from '../../models/analytics';

const DATE_FILTERS: { label: string; value: number | undefined }[] = [
  { label: 'All History', value: undefined },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export const AnalyticsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();

  const [selectedDays, setSelectedDays] = useState<number | undefined>(undefined);
  const [summary, setSummary] = useState<FarmAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await analyticsService.getFarmSummary(selectedDays);
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics summary.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedDays]);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [selectedDays])
  );

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
            onRefresh={() => fetchSummary(true)}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics & Trends</Text>
          <Text style={styles.headerSubtitle}>
            Descriptive historical summaries across farms, samples, and herds
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

        {error && <ErrorMessage message={error} onRetry={() => fetchSummary()} />}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Compiling historical records...</Text>
          </View>
        ) : summary ? (
          <>
            {/* Key Totals Grid */}
            <Text style={styles.sectionHeading}>Farm Activity Overview</Text>
            <View style={styles.metricsGrid}>
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('AnimalList')}
                accessibilityRole="button"
              >
                <Text style={styles.metricValue}>{summary.totalAnimals}</Text>
                <Text style={styles.metricLabel}>Animals</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('FeedList')}
                accessibilityRole="button"
              >
                <Text style={styles.metricValue}>{summary.totalFeedSamples}</Text>
                <Text style={styles.metricLabel}>Feed Samples</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('SilageList')}
                accessibilityRole="button"
              >
                <Text style={styles.metricValue}>{summary.totalSilageSamples}</Text>
                <Text style={styles.metricLabel}>Silage Samples</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('TestResultList')}
                accessibilityRole="button"
              >
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {summary.totalTestResults}
                </Text>
                <Text style={styles.metricLabel}>Test Results</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('AdvisoryList')}
                accessibilityRole="button"
              >
                <Text style={[styles.metricValue, { color: colors.accent }]}>
                  {summary.totalActiveAdvisories}
                </Text>
                <Text style={styles.metricLabel}>Active Advisories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => navigation.navigate('ConsultationList')}
                accessibilityRole="button"
              >
                <Text style={[styles.metricValue, { color: colors.info }]}>
                  {summary.totalConsultations}
                </Text>
                <Text style={styles.metricLabel}>Consultations</Text>
              </TouchableOpacity>
            </View>

            {/* Quality Status Distribution */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Quality Status Distribution</Text>
              <Text style={styles.cardSubtitle}>
                Calculated by RuleEngine from recorded physical/chemical tests
              </Text>
              <View style={styles.distributionContainer}>
                {Object.entries(summary.qualityStatusDistribution || {}).map(
                  ([status, count]) => {
                    const color = getQualityColor(status);
                    const total = summary.totalTestResults || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <View key={status} style={styles.distributionRow}>
                        <View style={styles.distLabelContainer}>
                          <View
                            style={[styles.statusDot, { backgroundColor: color }]}
                          />
                          <Text style={styles.distLabel}>
                            {status.replace(/_/g, ' ')}
                          </Text>
                        </View>
                        <View style={styles.distBarWrapper}>
                          <View
                            style={[
                              styles.distBarFill,
                              {
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.distCount}>{count}</Text>
                      </View>
                    );
                  }
                )}
              </View>
            </AppCard>

            {/* Risk Distribution */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Risk Level Distribution</Text>
              <Text style={styles.cardSubtitle}>
                Categorized based on deviation from baseline safe thresholds
              </Text>
              <View style={styles.riskGrid}>
                {Object.entries(summary.riskDistribution || {}).map(
                  ([risk, count]) => {
                    const color = getRiskColor(risk);
                    return (
                      <View
                        key={risk}
                        style={[
                          styles.riskBadgeCard,
                          { borderColor: color, backgroundColor: color + '10' },
                        ]}
                      >
                        <Text style={[styles.riskLevelText, { color }]}>
                          {risk}
                        </Text>
                        <Text style={[styles.riskCountText, { color }]}>
                          {count}
                        </Text>
                        <Text style={styles.riskSublabel}>records</Text>
                      </View>
                    );
                  }
                )}
              </View>
            </AppCard>

            {/* Risk Category Indicator Counts */}
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Risk Category Indicators</Text>
              <Text style={styles.cardSubtitle}>
                Aggregate risk occurrences detected across tested parameters
              </Text>
              <View style={styles.categoryRow}>
                <View style={styles.categoryItem}>
                  <Text style={[styles.categoryCount, { color: colors.statusUnsafe }]}>
                    {summary.contaminationRiskCount}
                  </Text>
                  <Text style={styles.categoryLabel}>Contamination</Text>
                  <Text style={styles.categorySub}>Aflatoxin / Mould</Text>
                </View>

                <View style={styles.categoryItem}>
                  <Text
                    style={[styles.categoryCount, { color: colors.statusNeedsAttention }]}
                  >
                    {summary.nutritionalRiskCount}
                  </Text>
                  <Text style={styles.categoryLabel}>Nutritional</Text>
                  <Text style={styles.categorySub}>Protein / Energy</Text>
                </View>

                <View style={styles.categoryItem}>
                  <Text style={[styles.categoryCount, { color: colors.accent }]}>
                    {summary.storageRiskCount}
                  </Text>
                  <Text style={styles.categoryLabel}>Storage & Silage</Text>
                  <Text style={styles.categorySub}>Moisture / Spoilage</Text>
                </View>
              </View>
            </AppCard>

            {/* Scientific Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerTitle}>Scientific Boundary Notice</Text>
              <Text style={styles.disclaimerText}>{summary.disclaimer}</Text>
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
    fontSize: typography.fontSize.header,
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
  sectionHeading: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: typography.fontSize.display,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontWeight: '600',
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
    marginBottom: spacing.md,
  },
  distributionContainer: {
    gap: spacing.sm,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  distLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  distBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  distBarFill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  distCount: {
    fontSize: typography.fontSize.small,
    fontWeight: '700',
    color: colors.textPrimary,
    width: 30,
    textAlign: 'right',
  },
  riskGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  riskBadgeCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    padding: spacing.sm,
    alignItems: 'center',
  },
  riskLevelText: {
    fontSize: typography.fontSize.caption,
    fontWeight: '800',
  },
  riskCountText: {
    fontSize: typography.fontSize.header,
    fontWeight: '800',
    marginVertical: spacing.xs / 2,
  },
  riskSublabel: {
    fontSize: typography.fontSize.caption - 2,
    color: colors.textSecondary,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: typography.fontSize.title,
    fontWeight: '800',
  },
  categoryLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs / 2,
    textAlign: 'center',
  },
  categorySub: {
    fontSize: typography.fontSize.caption - 2,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
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
