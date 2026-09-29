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
import { Animal } from '../../models/animal';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { animalService } from '../../services/animalService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const AnimalListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AnimalList'>['route']>();
  const initialFarmId = route.params?.farmId;
  const initialFarmName = route.params?.farmName;

  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(initialFarmId);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [animalsData, farmsData] = await Promise.all([
        animalService.getAllAnimals(selectedFarmId),
        farmService.getAllFarms().catch(() => [] as Farm[]),
      ]);
      setAnimals(animalsData);
      setFarms(farmsData);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAnimalPress = (animalId: number) => {
    navigation.navigate('AnimalDetails', { animalId });
  };

  const handleAddAnimal = () => {
    navigation.navigate('AddAnimal', { farmId: selectedFarmId });
  };

  const getFarmName = (farmId: number): string => {
    const farm = farms.find((f) => f.id === farmId);
    return farm ? farm.farmName : `Farm #${farmId}`;
  };

  if (isLoading && !isRefreshing) {
    return <LoadingView message="Loading livestock records..." />;
  }

  const renderAnimalCard = ({ item }: { item: Animal }) => {
    const isFemale = item.gender === 'FEMALE';

    return (
      <AppCard
        testID={`animal-card-${item.id}`}
        style={styles.card}
        onPress={() => handleAnimalPress(item.id)}
        accessibilityLabel={`Animal Tag: ${item.animalTag}. Breed: ${item.breed || 'Unknown'}. Tap for details.`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{isFemale ? '🐄' : '🐂'}</Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.tagRow}>
              <Text style={styles.animalTag} numberOfLines={1}>
                {item.animalTag}
              </Text>
              {item.name ? (
                <Text style={styles.animalName} numberOfLines={1}>
                  ({item.name})
                </Text>
              ) : null}
            </View>

            <Text style={styles.breedText}>
              {item.breed || 'Breed not specified'} • {item.gender}
            </Text>

            <Text style={styles.farmAssocText}>
              🏡 {getFarmName(item.farmId)}
            </Text>
          </View>

          <Text style={styles.arrowIcon}>›</Text>
        </View>

        {/* Metrics Row */}
        <View style={styles.statsRow}>
          {item.lactationStage && (
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>Stage</Text>
              <Text style={styles.statValue}>{item.lactationStage}</Text>
            </View>
          )}

          {item.milkProductionPerDay !== undefined && item.milkProductionPerDay !== null && (
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>Yield</Text>
              <Text style={styles.statValue}>{item.milkProductionPerDay} L/day</Text>
            </View>
          )}

          {item.weight !== undefined && item.weight !== null && (
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{item.weight} kg</Text>
            </View>
          )}

          {item.pregnancyStatus && item.pregnancyStatus !== 'UNKNOWN' && (
            <View style={styles.statBadge}>
              <Text style={styles.statLabel}>Pregnancy</Text>
              <Text style={styles.statValue}>
                {item.pregnancyStatus === 'PREGNANT' ? 'Pregnant' : 'Open'}
              </Text>
            </View>
          )}
        </View>
      </AppCard>
    );
  };

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.container}>
      {/* Action Header */}
      <View style={styles.actionBar}>
        <View style={styles.titleGroup}>
          <Text style={styles.screenTitle}>
            {selectedFarmId
              ? `Livestock: ${initialFarmName || getFarmName(selectedFarmId)}`
              : 'All Livestock'}
          </Text>
          <Text style={styles.screenSubtitle}>
            {animals.length} {animals.length === 1 ? 'animal recorded' : 'animals recorded'}
          </Text>
        </View>

        <AppButton
          testID="add-animal-header-button"
          title="+ Add Animal"
          size="small"
          onPress={handleAddAnimal}
          accessibilityLabel="Add New Animal"
        />
      </View>

      {/* Farm Filter Pills (if multiple farms exist and no fixed initial farm filter) */}
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
          testID="animal-list-error"
          message={errorMessage}
          onRetry={fetchData}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {animals.length === 0 && !isLoading && !errorMessage ? (
        <View style={styles.emptyContainer} testID="empty-animal-state">
          <Text style={styles.emptyIcon}>🐄</Text>
          <Text style={styles.emptyTitle}>No Livestock Registered Yet</Text>
          <Text style={styles.emptySubtitle}>
            Register your cattle by tag, breed, and lactation stage to track milk yield and nutrition.
          </Text>
          <AppButton
            testID="empty-add-animal-button"
            title="+ Add Your First Animal"
            onPress={handleAddAnimal}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          testID="animal-list"
          data={animals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAnimalCard}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  animalTag: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  animalName: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  breedText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  farmAssocText: {
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 1,
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

export default AnimalListScreen;
