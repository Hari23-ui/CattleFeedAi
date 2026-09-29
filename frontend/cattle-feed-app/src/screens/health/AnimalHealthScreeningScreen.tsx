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
  RiskIndicatorCard,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Animal } from '../../models/animal';
import { AnimalHealthScreeningResponse, HealthScreeningStatus } from '../../models/animalHealth';
import { FeedSample } from '../../models/feed';
import { SilageSample } from '../../models/silage';
import { AdvisoryResponse, Priority } from '../../models/advisory';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { animalService } from '../../services/animalService';
import { animalHealthService } from '../../services/animalHealthService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const SCREENING_STATUS_CONFIG: Record<
  HealthScreeningStatus,
  { bg: string; text: string; border: string; icon: string; title: string }
> = {
  NORMAL: {
    bg: '#E8F5E9',
    text: '#2E7D32',
    border: '#A5D6A7',
    icon: '✓',
    title: 'Baseline Normal Screening',
  },
  POTENTIAL_CONCERN: {
    bg: '#FFF3E0',
    text: '#E65100',
    border: '#FFCC80',
    icon: '⚠️',
    title: 'Potential Concern Identified',
  },
  INSUFFICIENT_DATA: {
    bg: '#ECEFF1',
    text: '#546E7A',
    border: '#CFD8DC',
    icon: 'ℹ️',
    title: 'Insufficient Data for Complete Screening',
  },
};

const PRIORITY_BADGE_STYLES: Record<Priority, { bg: string; text: string }> = {
  HIGH: { bg: '#FFEBEE', text: '#C62828' },
  MEDIUM: { bg: '#FFF8E1', text: '#F57F17' },
  LOW: { bg: '#E8F5E9', text: '#2E7D32' },
};

export const AnimalHealthScreeningScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AnimalHealthScreening'>['route']>();
  const animalId = route.params?.animalId;

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [screening, setScreening] = useState<AnimalHealthScreeningResponse | null>(null);
  const [feedSamples, setFeedSamples] = useState<FeedSample[]>([]);
  const [silageSamples, setSilageSamples] = useState<SilageSample[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!animalId) {
      setIsLoading(false);
      return;
    }
    try {
      setErrorMessage(null);
      const [animalRes, screenRes, feedRes, silageRes, advRes] = await Promise.all([
        animalService.getAnimalById(animalId),
        animalHealthService.screenAnimalHealth(animalId),
        animalHealthService.getAnimalFeedSamples(animalId).catch(() => []),
        animalHealthService.getAnimalSilageSamples(animalId).catch(() => []),
        animalHealthService.getAnimalAdvisories(animalId).catch(() => []),
      ]);

      setAnimal(animalRes);
      setScreening(screenRes);
      setFeedSamples(feedRes);
      setSilageSamples(silageRes);
      setAdvisories(advRes);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [animalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  if (!animalId) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <AppCard style={{ alignItems: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: typography.fontSize.title, fontWeight: '700', marginBottom: spacing.sm, color: colors.textPrimary }}>
            Select an Animal
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg }}>
            Please select an animal from your herd to view its individualized nutritional health risk screening.
          </Text>
          <AppButton
            title="View Livestock Herd"
            onPress={() => navigation.navigate('AnimalList')}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return <LoadingView message="Loading animal profile and health screening..." />;
  }

  if (errorMessage && !animal && !screening) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="health-screening-error"
          message={errorMessage}
          onRetry={loadData}
          onDismiss={() => setErrorMessage(null)}
        />
        <AppButton
          title="Back to Livestock Profile"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  const statusConfig = screening
    ? SCREENING_STATUS_CONFIG[screening.screeningStatus] || SCREENING_STATUS_CONFIG.INSUFFICIENT_DATA
    : SCREENING_STATUS_CONFIG.INSUFFICIENT_DATA;

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
          testID="health-screening-alert-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* 1. Header: Animal Profile Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Health Risk Screening</Text>
        </View>
        <Text style={styles.animalTagHeader} testID="screening-animal-tag">
          🐄 {animal?.animalTag || `Animal #${animalId}`}{' '}
          {animal?.name ? `(${animal.name})` : ''}
        </Text>
        <Text style={styles.headerSub}>
          Breed: {animal?.breed || 'Not specified'} • Lactation:{' '}
          {animal?.lactationStage || 'N/A'} • Daily Yield:{' '}
          {animal?.milkProductionPerDay != null
            ? `${animal.milkProductionPerDay} L/day`
            : 'Not recorded'}
        </Text>
      </View>

      {/* 2. Screening Status Banner */}
      <AppCard style={styles.card} testID="screening-status-card">
        <View style={styles.statusHeaderRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
            ]}
          >
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusText, { color: statusConfig.text }]}>
              {statusConfig.title}
            </Text>
          </View>
        </View>

        {screening?.dietaryAndHealthSummary ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Screening Assessment:</Text>
            <Text style={styles.summaryText}>
              {screening.dietaryAndHealthSummary}
            </Text>
          </View>
        ) : null}

        {screening?.recommendationSummary ? (
          <View style={styles.recBox}>
            <Text style={styles.recLabel}>💡 Recommended Next Action:</Text>
            <Text style={styles.recText}>{screening.recommendationSummary}</Text>
          </View>
        ) : null}

        {/* Missing information if data is insufficient */}
        {screening?.missingInformation && screening.missingInformation.length > 0 && (
          <View style={styles.missingBox} testID="missing-information-box">
            <Text style={styles.missingHeader}>📋 Missing Baseline Records:</Text>
            {screening.missingInformation.map((item, idx) => (
              <Text key={`miss-${idx}`} style={styles.missingItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.countsRow}>
          <Text style={styles.countText}>
            Tested Batches: {screening?.recentTestResultsCount ?? 0}
          </Text>
          <Text style={styles.countText}>
            Logged Observations: {screening?.recentObservationsCount ?? 0}
          </Text>
        </View>
      </AppCard>

      {/* 3. Potential Nutritional & Health Risk Indicators */}
      <AppCard style={styles.card} testID="health-risks-card">
        <Text style={styles.sectionTitle}>Possible Health & Nutritional Concerns</Text>
        <Text style={styles.sectionSubtitle}>
          Non-diagnostic indicators correlating lactation demands with recent feed test results.
        </Text>

        {screening?.detectedRisks && screening.detectedRisks.length > 0 ? (
          screening.detectedRisks.map((risk, index) => (
            <RiskIndicatorCard key={`risk-${index}`} risk={risk} />
          ))
        ) : (
          <View style={styles.cleanRiskBox} testID="no-health-risks-state">
            <Text style={styles.cleanRiskIcon}>✓</Text>
            <Text style={styles.cleanRiskTitle}>No Elevated Risk Indicators</Text>
            <Text style={styles.cleanRiskText}>
              Current nutritional and physical parameters meet baseline maintenance screening.
            </Text>
          </View>
        )}
      </AppCard>

      {/* 4. Feed & Silage History for this Animal */}
      <AppCard style={styles.card} testID="feed-silage-history-card">
        <Text style={styles.sectionTitle}>Associated Feed & Silage History</Text>
        <Text style={styles.sectionSubtitle}>
          Feed and forage batches allocated specifically to this animal.
        </Text>

        {/* Feed Samples */}
        <Text style={styles.subSectionTitle}>🌾 Feed Samples ({feedSamples.length})</Text>
        {feedSamples.length > 0 ? (
          feedSamples.map(sample => (
            <TouchableOpacity
              key={`feed-${sample.id}`}
              style={styles.sampleItem}
              onPress={() => navigation.navigate('FeedDetails', { sampleId: sample.id })}
              accessibilityLabel={`View feed sample ${sample.sampleCode}`}
            >
              <View style={styles.sampleItemLeft}>
                <Text style={styles.sampleCode}>{sample.sampleCode}</Text>
                <Text style={styles.sampleMeta}>
                  {sample.feedType} • Collected: {sample.sampleDate || 'N/A'}
                </Text>
              </View>
              <Text style={styles.sampleArrow}>View Tests →</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.naText}>No dedicated feed samples registered for this animal.</Text>
        )}

        {/* Silage Samples */}
        <Text style={[styles.subSectionTitle, { marginTop: spacing.md }]}>
          🌿 Silage Samples ({silageSamples.length})
        </Text>
        {silageSamples.length > 0 ? (
          silageSamples.map(sample => (
            <TouchableOpacity
              key={`silage-${sample.id}`}
              style={styles.sampleItem}
              onPress={() => navigation.navigate('SilageDetails', { sampleId: sample.id })}
              accessibilityLabel={`View silage sample ${sample.sampleCode}`}
            >
              <View style={styles.sampleItemLeft}>
                <Text style={styles.sampleCode}>{sample.sampleCode}</Text>
                <Text style={styles.sampleMeta}>
                  {sample.silageType} • Ensiled: {sample.sampleDate || 'N/A'}
                </Text>
              </View>
              <Text style={styles.sampleArrow}>View Tests →</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.naText}>No dedicated silage samples registered for this animal.</Text>
        )}

        <View style={styles.historyActionRow}>
          <AppButton
            title="+ Add Feed for Animal"
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('AddFeed', { animalId: animal?.id, farmId: animal?.farmId })}
            style={styles.historyButton}
          />
          <AppButton
            title="+ Add Silage for Animal"
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('AddSilage', { animalId: animal?.id, farmId: animal?.farmId })}
            style={styles.historyButton}
          />
        </View>
      </AppCard>

      {/* 5. Active Herd Advisories for this Animal */}
      <AppCard style={styles.card} testID="animal-advisories-card">
        <View style={styles.advisoriesHeaderRow}>
          <Text style={styles.sectionTitle}>Herd Advisories for Animal</Text>
          <Text style={styles.sectionSubtitle}>
            {advisories.length} {advisories.length === 1 ? 'advisory' : 'advisories'}
          </Text>
        </View>

        {advisories.length > 0 ? (
          advisories.map((adv, idx) => {
            const badgeStyle = adv.priority ? PRIORITY_BADGE_STYLES[adv.priority] : PRIORITY_BADGE_STYLES.LOW;
            return (
              <TouchableOpacity
                key={adv.id || idx}
                style={styles.advisoryItem}
                onPress={() => {
                  if (adv.id) {
                    navigation.navigate('AdvisoryDetails', { advisoryId: adv.id });
                  }
                }}
                accessibilityLabel={`View advisory ${adv.title}`}
              >
                <View style={styles.advisoryItemTop}>
                  <Text style={styles.advisoryTitle}>{adv.title}</Text>
                  {adv.priority && (
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: badgeStyle.bg },
                      ]}
                    >
                      <Text style={[styles.priorityText, { color: badgeStyle.text }]}>
                        {adv.priority}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.advisoryMessage} numberOfLines={2}>
                  {adv.message}
                </Text>
                {adv.recommendedAction ? (
                  <Text style={styles.advisoryAction} numberOfLines={1}>
                    Action: {adv.recommendedAction}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.naText}>No advisories recorded for this animal.</Text>
        )}
      </AppCard>

      {/* 6. Screening Disclaimer */}
      {screening?.disclaimer ? (
        <Text style={styles.disclaimerText}>{screening.disclaimer}</Text>
      ) : (
        <Text style={styles.disclaimerText}>
          Screening Disclaimer: Animal health risk screening correlates nutritional parameters and logged farmer observations. It identifies potential feed-related risk indicators and does NOT constitute a veterinary diagnosis.
        </Text>
      )}

      {/* Back Button */}
      <View style={styles.actionRow}>
        <AppButton
          title="← Back to Livestock Profile"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    </ScreenContainer>
  );
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
  animalTagHeader: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  headerSub: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusHeaderRow: {
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    fontSize: typography.fontSize.body,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  summaryBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  recBox: {
    backgroundColor: '#F9FBE7',
    borderColor: '#E6EE9C',
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  recLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#33691E',
    marginBottom: 2,
  },
  recText: {
    fontSize: typography.fontSize.small,
    color: '#33691E',
    lineHeight: 18,
  },
  missingBox: {
    backgroundColor: '#ECEFF1',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  missingHeader: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#37474F',
    marginBottom: 4,
  },
  missingItem: {
    fontSize: typography.fontSize.caption,
    color: '#455A64',
    lineHeight: 18,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  countText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
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
  subSectionTitle: {
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
    marginTop: spacing.xs,
  },
  cleanRiskIcon: {
    fontSize: 28,
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
  sampleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  sampleItemLeft: {
    flex: 1,
  },
  sampleCode: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  sampleMeta: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sampleArrow: {
    fontSize: typography.fontSize.caption,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  historyActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  historyButton: {
    flex: 1,
  },
  advisoriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  advisoryItem: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  advisoryItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  advisoryTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
  },
  advisoryMessage: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  advisoryAction: {
    fontSize: typography.fontSize.caption,
    color: '#2E7D32',
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  naText: {
    fontSize: typography.fontSize.small,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginVertical: spacing.xs,
  },
  disclaimerText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  actionRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: '100%',
  },
});

export default AnimalHealthScreeningScreen;
