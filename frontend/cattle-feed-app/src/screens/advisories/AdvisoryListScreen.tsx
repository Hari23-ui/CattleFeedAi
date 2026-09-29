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
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { AdvisoryResponse, Priority } from '../../models/advisory';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { advisoryService } from '../../services/advisoryService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const PRIORITY_THEME: Record<
  Priority,
  { bg: string; text: string; label: string }
> = {
  HIGH: { bg: '#FFEBEE', text: '#C62828', label: 'HIGH PRIORITY' },
  MEDIUM: { bg: '#FFF8E1', text: '#F57F17', label: 'MEDIUM PRIORITY' },
  LOW: { bg: '#E8F5E9', text: '#2E7D32', label: 'LOW PRIORITY' },
};

type FilterTab = 'ALL' | 'UNREAD' | 'READ';

export const AdvisoryListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AdvisoryList'>['route']>();
  const animalId = route.params?.animalId;

  const [advisories, setAdvisories] = useState<AdvisoryResponse[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAdvisories = useCallback(async () => {
    try {
      setErrorMessage(null);
      let isReadFilter: boolean | undefined = undefined;
      if (activeTab === 'UNREAD') isReadFilter = false;
      if (activeTab === 'READ') isReadFilter = true;

      const data = await advisoryService.getAdvisories({
        animalId: animalId,
        isRead: isReadFilter,
      });
      setAdvisories(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [animalId, activeTab]);

  useEffect(() => {
    fetchAdvisories();
  }, [fetchAdvisories]);

  // Refetch when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAdvisories();
    });
    return unsubscribe;
  }, [navigation, fetchAdvisories]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAdvisories();
  }, [fetchAdvisories]);

  const handleMarkAsRead = async (advisoryId: number) => {
    try {
      await advisoryService.markAsRead(advisoryId);
      // update state locally
      setAdvisories(prev =>
        prev.map(a => (a.id === advisoryId ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    }
  };

  const renderAdvisoryItem = ({ item }: { item: AdvisoryResponse }) => {
    const priorityTheme = item.priority
      ? PRIORITY_THEME[item.priority] || PRIORITY_THEME.LOW
      : PRIORITY_THEME.LOW;

    return (
      <AppCard
        testID={`advisory-item-${item.id}`}
        style={[styles.advisoryCard, !item.isRead && styles.unreadCard]}
        onPress={() => {
          if (item.id) {
            navigation.navigate('AdvisoryDetails', { advisoryId: item.id });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgesRow}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            )}
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityTheme.bg },
              ]}
            >
              <Text style={[styles.priorityBadgeText, { color: priorityTheme.text }]}>
                {priorityTheme.label}
              </Text>
            </View>
          </View>
          {!item.isRead && (
            <View style={styles.unreadDotBadge}>
              <Text style={styles.unreadDotText}>NEW</Text>
            </View>
          )}
        </View>

        <Text style={styles.advisoryTitle}>{item.title}</Text>
        <Text style={styles.advisoryMessage} numberOfLines={2}>
          {item.message}
        </Text>

        {item.recommendedAction ? (
          <View style={styles.actionPreview}>
            <Text style={styles.actionPreviewLabel}>Action:</Text>
            <Text style={styles.actionPreviewText} numberOfLines={1}>
              {item.recommendedAction}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.footerAnimal}>
            {item.animalTag ? `🐄 ${item.animalTag}` : '🌾 General Herd'}
          </Text>
          {item.createdAt && (
            <Text style={styles.footerDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          )}
          {!item.isRead && item.id && (
            <TouchableOpacity
              style={styles.quickMarkRead}
              onPress={() => handleMarkAsRead(item.id!)}
              accessibilityLabel="Mark advisory as read"
            >
              <Text style={styles.quickMarkReadText}>Mark Read ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </AppCard>
    );
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Title & Filter Tabs */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Herd Advisories</Text>
        <Text style={styles.pageSubtitle}>
          Prioritized, rule-derived herd management recommendations.
        </Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ALL')}
            testID="filter-tab-all"
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'ALL' && styles.tabButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'UNREAD' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('UNREAD')}
            testID="filter-tab-unread"
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'UNREAD' && styles.tabButtonTextActive,
              ]}
            >
              Unread
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'READ' && styles.tabButtonActive]}
            onPress={() => setActiveTab('READ')}
            testID="filter-tab-read"
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'READ' && styles.tabButtonTextActive,
              ]}
            >
              Read
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {errorMessage && (
        <ErrorMessage
          testID="advisory-list-error"
          message={errorMessage}
          onRetry={fetchAdvisories}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {isLoading ? (
        <LoadingView message="Loading herd advisories..." />
      ) : advisories.length === 0 ? (
        <View style={styles.emptyContainer} testID="advisory-empty-state">
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyTitle}>No Advisories Found</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'UNREAD'
              ? 'You have caught up with all herd recommendations.'
              : 'No management advisories have been recorded yet.'}
          </Text>
          <AppButton
            title="Refresh"
            variant="outline"
            onPress={fetchAdvisories}
            style={styles.emptyRefreshButton}
          />
        </View>
      ) : (
        <FlatList
          data={advisories}
          keyExtractor={item => String(item.id || Math.random())}
          renderItem={renderAdvisoryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
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
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ECEFF1',
    borderRadius: borderRadius.md,
    padding: 2,
    marginTop: spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabButtonText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  advisoryCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: '#455A64',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  unreadDotBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  unreadDotText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  advisoryTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  advisoryMessage: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  actionPreview: {
    flexDirection: 'row',
    backgroundColor: '#F1F8E9',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  actionPreviewLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#33691E',
  },
  actionPreviewText: {
    fontSize: typography.fontSize.caption,
    color: '#33691E',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  footerAnimal: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  footerDate: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
  },
  quickMarkRead: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  quickMarkReadText: {
    fontSize: 10,
    color: '#00796B',
    fontWeight: typography.fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  emptyRefreshButton: {
    minWidth: 140,
  },
});

export default AdvisoryListScreen;
