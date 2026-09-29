import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert as NativeAlert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { FeedPlan } from '../../models/feedPlan';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { feedPlanService } from '../../services/feedPlanService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const FeedPlanDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'FeedPlanDetails'>['route']>();
  const { planId } = route.params;

  const [plan, setPlan] = useState<FeedPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPlanDetails = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await feedPlanService.getFeedPlanById(planId);
      setPlan(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  // Refetch when screen regains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPlanDetails();
    });
    return unsubscribe;
  }, [navigation, fetchPlanDetails]);

  const handleDelete = () => {
    NativeAlert.alert(
      'Delete Feed Plan',
      'Are you sure you want to delete this feed plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await feedPlanService.deleteFeedPlan(planId);
              navigation.navigate('FeedPlanList');
            } catch (err) {
              setErrorMessage(getFarmerFriendlyErrorMessage(err));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
      case 'COMPLETED':
        return { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' };
      case 'CANCELLED':
        return { bg: '#FAFAFA', text: '#757575', border: '#E0E0E0' };
      default:
        return { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} contentContainerStyle={styles.centerContainer}>
        <LoadingView message="Loading plan details..." testID="plan-details-loading" />
      </ScreenContainer>
    );
  }

  if (errorMessage && !plan) {
    return (
      <ScreenContainer scrollable={false} contentContainerStyle={styles.centerContainer}>
        <ErrorMessage
          testID="feed-plan-details-error"
          message={errorMessage}
          onRetry={fetchPlanDetails}
        />
        <AppButton
          title="Back to Feed Plans"
          variant="outline"
          onPress={() => navigation.navigate('FeedPlanList')}
          style={{ marginTop: spacing.md }}
        />
      </ScreenContainer>
    );
  }

  if (!plan) return null;

  const statusStyle = getStatusColor(plan.status);

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.planTitle} testID="plan-details-title">
            {plan.planName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]} testID="plan-details-status">
              {plan.status || 'ACTIVE'}
            </Text>
          </View>
        </View>

        <Text style={styles.dateSub}>
          📅 Schedule: {plan.startDate} {plan.endDate ? `to ${plan.endDate}` : '(Ongoing)'}
        </Text>
      </View>

      {errorMessage && (
        <ErrorMessage
          testID="details-action-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Animal Section */}
      <AppCard style={styles.sectionCard} testID="plan-animal-card">
        <Text style={styles.sectionTitle}>🐄 Target Livestock</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Animal Tag:</Text>
          <Text style={styles.detailValue} testID="plan-animal-tag">
            {plan.animal?.animalTag || 'Not Available'}
          </Text>
        </View>
        {plan.animal?.name ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{plan.animal.name}</Text>
          </View>
        ) : null}
        {plan.animal?.breed ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Breed:</Text>
            <Text style={styles.detailValue}>{plan.animal.breed}</Text>
          </View>
        ) : null}
        {plan.animal?.category ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lactation Stage:</Text>
            <Text style={styles.detailValue}>{plan.animal.category}</Text>
          </View>
        ) : null}
        {plan.animal?.farmName ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dairy Farm:</Text>
            <Text style={styles.detailValue}>{plan.animal.farmName}</Text>
          </View>
        ) : null}
      </AppCard>

      {/* Linked Feed / Silage Sample */}
      <AppCard style={styles.sectionCard} testID="plan-sample-card">
        <Text style={styles.sectionTitle}>🌾 Linked Feed / Silage Material</Text>
        {plan.feedSample ? (
          <View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Feed Sample Code:</Text>
              <Text style={styles.detailValue}>{plan.feedSample.sampleCode}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Feed Type:</Text>
              <Text style={styles.detailValue}>{plan.feedSample.feedType || 'N/A'}</Text>
            </View>
            {plan.feedSample.sampleDate ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sample Date:</Text>
                <Text style={styles.detailValue}>{plan.feedSample.sampleDate}</Text>
              </View>
            ) : null}
          </View>
        ) : plan.silageSample ? (
          <View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Silage Sample Code:</Text>
              <Text style={styles.detailValue}>{plan.silageSample.sampleCode}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Silage Type:</Text>
              <Text style={styles.detailValue}>{plan.silageSample.silageType || 'N/A'}</Text>
            </View>
            {plan.silageSample.sampleDate ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Harvest Date:</Text>
                <Text style={styles.detailValue}>{plan.silageSample.sampleDate}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.notAvailableText}>No specific feed or silage batch linked to this plan.</Text>
        )}
      </AppCard>

      {/* Feeding Schedule & Ration Quantity */}
      <AppCard style={styles.sectionCard} testID="plan-ration-card">
        <Text style={styles.sectionTitle}>⚖️ Planned Ration & Frequency</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Planned Quantity:</Text>
          <Text style={styles.detailValue} testID="plan-quantity">
            {plan.plannedQuantity ? `${plan.plannedQuantity} kg / day` : 'Not Available'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Feeding Frequency:</Text>
          <Text style={styles.detailValue} testID="plan-frequency">
            {plan.frequency || 'Not Available'}
          </Text>
        </View>
        {plan.description ? (
          <View style={styles.textBlock}>
            <Text style={styles.detailLabel}>Ration Description:</Text>
            <Text style={styles.descriptionText}>{plan.description}</Text>
          </View>
        ) : null}
        {plan.notes ? (
          <View style={styles.textBlock}>
            <Text style={styles.detailLabel}>Farmer Notes:</Text>
            <Text style={styles.descriptionText}>{plan.notes}</Text>
          </View>
        ) : null}
      </AppCard>

      {/* Authoritative Quality & Risk Screening Context */}
      <AppCard style={styles.sectionCard} testID="plan-assessment-card">
        <Text style={styles.sectionTitle}>🧪 Quality & Risk Screening Context</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quality Assessment:</Text>
          <Text
            style={[
              styles.detailValue,
              { fontWeight: typography.fontWeight.bold },
              plan.qualityStatus === 'SAFE' || plan.qualityStatus === 'GOOD' ? { color: '#2E7D32' } : null,
              plan.qualityStatus === 'UNSAFE' ? { color: '#C62828' } : null,
            ]}
            testID="plan-quality-status"
          >
            {plan.qualityStatus || 'Not Available'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Risk Indicator Level:</Text>
          <Text
            style={[
              styles.detailValue,
              { fontWeight: typography.fontWeight.bold },
              plan.riskLevel === 'HIGH' ? { color: '#C62828' } : null,
              plan.riskLevel === 'MEDIUM' ? { color: '#E65100' } : null,
              plan.riskLevel === 'LOW' ? { color: '#2E7D32' } : null,
            ]}
            testID="plan-risk-level"
          >
            {plan.riskLevel || 'Not Available'}
          </Text>
        </View>

        {plan.latestTestResult ? (
          <View style={styles.subCard}>
            <Text style={styles.subCardTitle}>Latest Lab Measurement ({plan.latestTestResult.testDate})</Text>
            <View style={styles.metricGrid}>
              {plan.latestTestResult.moisture !== undefined && plan.latestTestResult.moisture !== null ? (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Moisture</Text>
                  <Text style={styles.metricValue}>{plan.latestTestResult.moisture}%</Text>
                </View>
              ) : null}
              {plan.latestTestResult.crudeProtein !== undefined && plan.latestTestResult.crudeProtein !== null ? (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Crude Protein</Text>
                  <Text style={styles.metricValue}>{plan.latestTestResult.crudeProtein}%</Text>
                </View>
              ) : null}
              {plan.latestTestResult.ph !== undefined && plan.latestTestResult.ph !== null ? (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>pH</Text>
                  <Text style={styles.metricValue}>{plan.latestTestResult.ph}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <Text style={styles.notAvailableText}>No recent laboratory test result available for this feed.</Text>
        )}

        {plan.riskIndicators && plan.riskIndicators.length > 0 ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.detailLabel}>Identified Risk Alerts:</Text>
            {plan.riskIndicators.map((risk, index) => (
              <View key={index} style={styles.riskItem}>
                <Text style={styles.riskTitle}>⚠️ {risk.riskTitle} ({risk.severity})</Text>
                {risk.mitigationRecommendation ? (
                  <Text style={styles.riskRecommendation}>👉 {risk.mitigationRecommendation}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </AppCard>

      {/* Advisory Context */}
      {plan.recentAdvisories && plan.recentAdvisories.length > 0 ? (
        <AppCard style={styles.sectionCard} testID="plan-advisory-card">
          <Text style={styles.sectionTitle}>🛡️ Relevant Animal Advisories</Text>
          {plan.recentAdvisories.map((adv) => (
            <View key={adv.id} style={styles.advisoryItem}>
              <View style={styles.advisoryHeader}>
                <Text style={styles.advisoryTitle}>{adv.title}</Text>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>{adv.priority || 'NORMAL'}</Text>
                </View>
              </View>
              <Text style={styles.advisoryMessage}>{adv.message}</Text>
            </View>
          ))}
        </AppCard>
      ) : null}

      {/* Scientific Safety & Disclaimer Banner */}
      <View style={styles.disclaimerBanner} testID="plan-disclaimer">
        <Text style={styles.disclaimerIcon}>🩺</Text>
        <Text style={styles.disclaimerText}>
          {plan.disclaimer ||
            'Informational feed planning record only. Non-diagnostic. Does not constitute veterinary prescription or diagnosis. Consult a qualified Veterinarian, Veterinary Nutritionist, or Animal Nutrition Expert for clinical or dietary interventions.'}
        </Text>
      </View>

      {/* Integrated Evidence Review (M12) */}
      {plan.animal ? (
        <AppButton
          testID="plan-view-evidence-button"
          title="🔬 Review Unified Evidence Summary →"
          variant="secondary"
          onPress={() =>
            navigation.navigate('EvidenceSummary', {
              animalId: plan.animal?.id,
              title: `Evidence: ${plan.animal?.animalTag}`,
            })
          }
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <AppButton
          testID="edit-plan-button"
          title="Edit Plan"
          onPress={() => navigation.navigate('EditFeedPlan', { planId })}
          style={styles.actionButton}
        />
        <AppButton
          testID="delete-plan-button"
          title="Delete Plan"
          variant="outline"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          style={[styles.actionButton, { borderColor: '#E53935' }]}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  planTitle: {
    flex: 1,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  dateSub: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  textBlock: {
    marginTop: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  notAvailableText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  subCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  subCardTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  riskItem: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
    padding: spacing.xs,
    marginTop: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  riskTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#E65100',
  },
  riskRecommendation: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
  advisoryItem: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  advisoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  advisoryTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  priorityBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  priorityText: {
    fontSize: typography.fontSize.caption,
    color: '#00796B',
    fontWeight: typography.fontWeight.bold,
  },
  advisoryMessage: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#7B1FA2',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  disclaimerIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: '#4A148C',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
