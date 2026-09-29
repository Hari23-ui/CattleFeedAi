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
  AlertSeverityBadge,
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Alert } from '../../models/alert';
import { AppNavigationProp } from '../../navigation/types';
import { alertService } from '../../services/alertService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

type FilterTab = 'ALL' | 'UNREAD' | 'READ';

export const AlertListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await alertService.getAlerts();
      setAlerts(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Refetch alerts whenever the screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAlerts();
    });
    return unsubscribe;
  }, [navigation, fetchAlerts]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkAsRead = async (alertId: number) => {
    try {
      const updated = await alertService.markAsRead(alertId);
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await alertService.markAllAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'UNREAD') return !a.isRead;
    if (activeTab === 'READ') return a.isRead;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const renderAlertItem = ({ item }: { item: Alert }) => {
    return (
      <AppCard
        testID={`alert-item-${item.id}`}
        style={[styles.alertCard, !item.isRead && styles.unreadCard]}
        onPress={() => {
          navigation.navigate('AlertDetails', { alertId: item.id });
        }}
      >
        <View style={styles.cardHeader}>
          <AlertSeverityBadge
            severity={item.severity}
            alertType={item.alertType}
            testID={`alert-severity-${item.id}`}
          />
          {!item.isRead && (
            <View style={styles.unreadBadge} testID={`alert-unread-badge-${item.id}`}>
              <Text style={styles.unreadBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        <Text style={styles.alertTitle} testID={`alert-title-${item.id}`}>{item.title}</Text>
        <Text style={styles.alertMessage} numberOfLines={2} testID={`alert-msg-${item.id}`}>
          {item.message}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.footerDate} testID={`alert-date-${item.id}`}>
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
          </Text>

          {!item.isRead && (
            <TouchableOpacity
              testID={`alert-mark-read-btn-${item.id}`}
              style={styles.quickMarkRead}
              onPress={() => handleMarkAsRead(item.id)}
              accessibilityLabel={`Mark alert ${item.title} as read`}
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
      {/* Header and Title Section */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.pageTitle}>Notifications & Alerts</Text>
            <Text style={styles.pageSubtitle}>
              Feed safety, risk indicators, and critical herd advisories
            </Text>
          </View>
          {unreadCount > 0 && (
            <AppButton
              testID="mark-all-read-button"
              title="Mark All Read"
              variant="outline"
              size="small"
              onPress={handleMarkAllAsRead}
              loading={isMarkingAll}
              style={styles.markAllButton}
            />
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            testID="filter-tab-all"
            style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'ALL' && styles.tabButtonTextActive,
              ]}
            >
              All ({alerts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="filter-tab-unread"
            style={[styles.tabButton, activeTab === 'UNREAD' && styles.tabButtonActive]}
            onPress={() => setActiveTab('UNREAD')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'UNREAD' && styles.tabButtonTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="filter-tab-read"
            style={[styles.tabButton, activeTab === 'READ' && styles.tabButtonActive]}
            onPress={() => setActiveTab('READ')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'READ' && styles.tabButtonTextActive,
              ]}
            >
              Read ({alerts.length - unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Message */}
      {errorMessage && (
        <ErrorMessage
          testID="alert-list-error"
          message={errorMessage}
          onRetry={fetchAlerts}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Body States */}
      {isLoading ? (
        <LoadingView message="Loading farm alerts..." testID="alert-loading-view" />
      ) : filteredAlerts.length === 0 ? (
        <View style={styles.emptyContainer} testID="alert-empty-state">
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'UNREAD' ? 'All Caught Up!' : 'No Notifications'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'UNREAD'
              ? 'You have reviewed all urgent notifications and farm alerts.'
              : 'No alerts or hazard indicators have been recorded.'}
          </Text>
          <AppButton
            testID="alert-empty-refresh-button"
            title="Refresh"
            variant="outline"
            onPress={fetchAlerts}
            style={styles.emptyRefreshButton}
          />
        </View>
      ) : (
        <FlatList
          testID="alert-flat-list"
          data={filteredAlerts}
          keyExtractor={item => String(item.id)}
          renderItem={renderAlertItem}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  pageTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  markAllButton: {
    minWidth: 110,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ECEFF1',
    borderRadius: borderRadius.md,
    padding: 3,
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
  alertCard: {
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
  unreadBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  alertTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  alertMessage: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
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
  footerDate: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
  },
  quickMarkRead: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  quickMarkReadText: {
    fontSize: 11,
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

export default AlertListScreen;
