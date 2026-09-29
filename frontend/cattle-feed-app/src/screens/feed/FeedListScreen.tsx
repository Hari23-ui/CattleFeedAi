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
import { FeedSample, FeedType } from '../../models/feed';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { feedService } from '../../services/feedService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const FEED_TYPE_LABELS: Record<FeedType, string> = {
  CATTLE_FEED_PELLET: 'Cattle Feed Pellet',
  FEED_MASH: 'Feed Mash',
  MINERAL_MIXTURE: 'Mineral Mixture',
  GREEN_FODDER: 'Green Fodder',
  DRY_FODDER: 'Dry Fodder',
  OTHER: 'Other Feed',
};

export const FeedListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'FeedList'>['route']>();
  const initialFarmId = route.params?.farmId;

  const [samples, setSamples] = useState<FeedSample[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(initialFarmId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSamples = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [feedData, farmData] = await Promise.all([
        feedService.getAllFeedSamples(selectedFarmId ? { farmId: selectedFarmId } : undefined),
        farmService.getAllFarms().catch(() => [] as Farm[]),
      ]);
      setSamples(feedData);
      setFarms(farmData);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSamples();
    });
    return unsubscribe;
  }, [navigation, fetchSamples]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSamples();
  }, [fetchSamples]);

  const handleSamplePress = (sampleId: number) => {
    navigation.navigate('FeedDetails', { sampleId });
  };

  const handleAddFeed = () => {
    navigation.navigate('AddFeed', { farmId: selectedFarmId });
  };

  const getFarmName = (farmId: number): string => {
    const farm = farms.find((f) => f.id === farmId);
    return farm ? farm.farmName : `Farm #${farmId}`;
  };

  if (isLoading && !isRefreshing) {
    return <LoadingView message="Loading feed samples..." />;
  }

  const renderSampleItem = ({ item }: { item: FeedSample }) => {
    return (
      <AppCard
        testID={`feed-card-${item.id}`}
        style={styles.card}
        onPress={() => handleSamplePress(item.id)}
        accessibilityLabel={`Feed Sample: ${item.sampleCode}. Type: ${FEED_TYPE_LABELS[item.feedType]}. Tap for details.`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🌾</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.sampleCode} numberOfLines={1}>
                {item.sampleCode}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {FEED_TYPE_LABELS[item.feedType] || item.feedType}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>
              📅 Sample Date: {item.sampleDate}
            </Text>
            <Text style={styles.farmText}>
              🏡 {getFarmName(item.farmId)}
              {item.animalId ? ` • Animal #${item.animalId}` : ''}
            </Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </View>

        {item.source ? (
          <View style={styles.sourceRow}>
            <Text style={styles.sourceLabel}>Source:</Text>
            <Text style={styles.sourceValue} numberOfLines={1}>
              {item.source}
            </Text>
          </View>
        ) : null}
      </AppCard>
    );
  };

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.container}>
      {/* Action Header */}
      <View style={styles.actionBar}>
        <View style={styles.titleGroup}>
          <Text style={styles.screenTitle}>Feed Samples</Text>
          <Text style={styles.screenSubtitle}>
            {samples.length} {samples.length === 1 ? 'sample registered' : 'samples registered'}
          </Text>
        </View>

        <AppButton
          testID="add-feed-header-button"
          title="+ Add Feed"
          size="small"
          onPress={handleAddFeed}
          accessibilityLabel="Add New Feed Sample"
        />
      </View>

      {/* Farm filter pills if multiple farms exist */}
      {farms.length > 1 && !initialFarmId && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            testID="filter-all-farms"
            activeOpacity={0.7}
            onPress={() => setSelectedFarmId(undefined)}
            style={[
              styles.filterPill,
              selectedFarmId === undefined && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFarmId === undefined && styles.filterPillTextActive,
              ]}
            >
              All Farms ({farms.length})
            </Text>
          </TouchableOpacity>

          {farms.map((f) => (
            <TouchableOpacity
              key={f.id}
              testID={`filter-farm-${f.id}`}
              activeOpacity={0.7}
              onPress={() => setSelectedFarmId(f.id)}
              style={[
                styles.filterPill,
                selectedFarmId === f.id && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedFarmId === f.id && styles.filterPillTextActive,
                ]}
                numberOfLines={1}
              >
                {f.farmName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {errorMessage && (
        <ErrorMessage
          testID="feed-list-error"
          message={errorMessage}
          onRetry={fetchSamples}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {samples.length === 0 && !isLoading && !errorMessage ? (
        <View style={styles.emptyContainer} testID="empty-feed-state">
          <Text style={styles.emptyIcon}>🌾</Text>
          <Text style={styles.emptyTitle}>No Feed Samples Registered Yet</Text>
          <Text style={styles.emptySubtitle}>
            Register cattle feed batches, pellets, fodder, and mineral mixtures to record quality test results.
          </Text>
          <AppButton
            testID="empty-add-feed-button"
            title="+ Register First Feed Sample"
            onPress={handleAddFeed}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          testID="feed-list"
          data={samples}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSampleItem}
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
    marginBottom: spacing.sm,
  },
  titleGroup: {
    flex: 1,
    marginRight: spacing.sm,
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
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterPillTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.bold,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleCode: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  typeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.primaryDark,
  },
  dateText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  farmText: {
    fontSize: typography.fontSize.caption,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 24,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  sourceLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  sourceValue: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    flex: 1,
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
    minWidth: 220,
  },
});

export default FeedListScreen;
