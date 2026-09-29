import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { FeedPlan } from '../../models/feedPlan';
import { AppNavigationProp } from '../../navigation/types';
import { feedPlanService } from '../../services/feedPlanService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

type FilterTab = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const FeedPlanListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();

  const [plans, setPlans] = useState<FeedPlan[]>([]);
  const [selectedTab, setSelectedTab] = useState<FilterTab>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFeedPlans = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await feedPlanService.getAllFeedPlans();
      setPlans(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedPlans();
  }, [fetchFeedPlans]);

  // Re-fetch when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFeedPlans();
    });
    return unsubscribe;
  }, [navigation, fetchFeedPlans]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFeedPlans();
  }, [fetchFeedPlans]);

  const filteredPlans = plans.filter((plan) => {
    if (selectedTab === 'ALL') return true;
    return (plan.status || '').toUpperCase() === selectedTab;
  });

  const getStatusColor = (status: string) => {
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

  const renderItem = ({ item }: { item: FeedPlan }) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <AppCard
        testID={`feed-plan-card-${item.id}`}
        style={styles.planCard}
        onPress={() => navigation.navigate('FeedPlanDetails', { planId: item.id })}
        accessibilityLabel={`Feed plan: ${item.planName} for ${item.animal?.animalTag || 'Animal'}. Status: ${item.status}. Tap to view details.`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <Text style={styles.planTitle} numberOfLines={1}>
              {item.planName}
            </Text>
            <Text style={styles.animalSub}>
              🐄 {item.animal?.animalTag ? `Animal Tag: ${item.animal.animalTag}` : 'Animal'}
              {item.animal?.name ? ` (${item.animal.name})` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status || 'ACTIVE'}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            📅 {item.startDate} {item.endDate ? `→ ${item.endDate}` : ''}
          </Text>
          {item.plannedQuantity ? (
            <Text style={styles.metaText}>
              ⚖️ {item.plannedQuantity} kg {item.frequency ? `(${item.frequency})` : ''}
            </Text>
          ) : null}
        </View>

        {/* Quality / Risk Context Preview */}
        {(item.qualityStatus && item.qualityStatus !== 'Not Available') ||
        (item.riskLevel && item.riskLevel !== 'Not Available') ? (
          <View style={styles.contextRow}>
            {item.qualityStatus && item.qualityStatus !== 'Not Available' && (
              <View style={styles.contextBadge}>
                <Text style={styles.contextBadgeText}>
                  Quality: {item.qualityStatus}
                </Text>
              </View>
            )}
            {item.riskLevel && item.riskLevel !== 'Not Available' && (
              <View style={[styles.contextBadge, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
                <Text style={[styles.contextBadgeText, { color: '#E65100' }]}>
                  Risk: {item.riskLevel}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </AppCard>
    );
  };

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.screenTitle}>Feed Planning</Text>
          <Text style={styles.screenSubtitle}>
            Herd feed schedules, intake management & safety context
          </Text>
        </View>
        <AppButton
          testID="create-feed-plan-button"
          title="+ Create Plan"
          size="small"
          onPress={() => navigation.navigate('AddFeedPlan')}
          style={styles.addButton}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            testID={`feed-plan-tab-${tab.toLowerCase()}`}
            style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMessage && (
        <ErrorMessage
          testID="feed-plan-list-error"
          message={errorMessage}
          onRetry={fetchFeedPlans}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {isLoading ? (
        <LoadingView message="Loading feed plans..." testID="feed-plan-loading" />
      ) : (
        <FlatList
          data={filteredPlans}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer} testID="feed-plan-empty-state">
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Feed Plans Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'ALL'
                  ? 'No feeding schedules recorded yet. Tap "+ Create Plan" to set up feeding for an animal.'
                  : `No ${selectedTab.toLowerCase()} feed plans found.`}
              </Text>
              {selectedTab === 'ALL' && (
                <AppButton
                  testID="empty-create-plan-button"
                  title="Create First Plan"
                  onPress={() => navigation.navigate('AddFeedPlan')}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: spacing.sm,
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
  addButton: {
    alignSelf: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  planCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  planTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  animalSub: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  description: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  contextRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  contextBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  contextBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
