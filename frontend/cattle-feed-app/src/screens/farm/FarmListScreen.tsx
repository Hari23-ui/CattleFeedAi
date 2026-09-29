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
import { Farm } from '../../models/farm';
import { AppNavigationProp } from '../../navigation/types';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const FarmListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFarms = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await farmService.getAllFarms();
      setFarms(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  // Refetch when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFarms();
    });
    return unsubscribe;
  }, [navigation, fetchFarms]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFarms();
  }, [fetchFarms]);

  const handleFarmPress = (farmId: number) => {
    navigation.navigate('FarmDetails', { farmId });
  };

  const handleAddFarm = () => {
    navigation.navigate('AddFarm');
  };

  if (isLoading && !isRefreshing) {
    return <LoadingView message="Loading your farms..." />;
  }

  const renderFarmItem = ({ item }: { item: Farm }) => {
    const locationParts = [item.location, item.district, item.state].filter(Boolean);
    const locationString = locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified';

    return (
      <AppCard
        testID={`farm-card-${item.id}`}
        style={styles.farmCard}
        onPress={() => handleFarmPress(item.id)}
        accessibilityLabel={`Farm: ${item.farmName}. Location: ${locationString}. Tap for details.`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.farmIconContainer}>
            <Text style={styles.farmIcon}>🏡</Text>
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.farmName} numberOfLines={1}>
              {item.farmName}
            </Text>
            <Text style={styles.farmLocation} numberOfLines={2}>
              📍 {locationString}
            </Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </View>

        {(item.pincode || item.district || item.state) && (
          <View style={styles.badgeRow}>
            {item.district ? (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{item.district}</Text>
              </View>
            ) : null}
            {item.state ? (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{item.state}</Text>
              </View>
            ) : null}
            {item.pincode ? (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>PIN: {item.pincode}</Text>
              </View>
            ) : null}
          </View>
        )}
      </AppCard>
    );
  };

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.actionBar}>
        <View>
          <Text style={styles.screenTitle}>My Farms</Text>
          <Text style={styles.screenSubtitle}>
            {farms.length} {farms.length === 1 ? 'registered farm' : 'registered farms'}
          </Text>
        </View>
        <AppButton
          testID="add-farm-header-button"
          title="+ Add Farm"
          size="small"
          onPress={handleAddFarm}
          accessibilityLabel="Add New Farm"
        />
      </View>

      {errorMessage && (
        <ErrorMessage
          testID="farm-list-error"
          message={errorMessage}
          onRetry={fetchFarms}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {farms.length === 0 && !isLoading && !errorMessage ? (
        <View style={styles.emptyContainer} testID="empty-farm-state">
          <Text style={styles.emptyIcon}>🌾</Text>
          <Text style={styles.emptyTitle}>No Farms Registered Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your dairy farm profile to start registering cattle and managing your herd.
          </Text>
          <AppButton
            testID="empty-add-farm-button"
            title="+ Add Your First Farm"
            onPress={handleAddFarm}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          testID="farm-list"
          data={farms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFarmItem}
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
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  screenTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  farmCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  farmIcon: {
    fontSize: 22,
  },
  headerTextGroup: {
    flex: 1,
  },
  farmName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  farmLocation: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 24,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  infoBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBadgeText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.small,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default FarmListScreen;
