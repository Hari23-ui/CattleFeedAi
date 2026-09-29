import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import { Farm } from '../../models/farm';
import { Animal } from '../../models/animal';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { farmService } from '../../services/farmService';
import { animalService } from '../../services/animalService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const FarmDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'FarmDetails'>['route']>();
  const { farmId } = route.params;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFarmData = useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      const [farmData, farmAnimals] = await Promise.all([
        farmService.getFarmById(farmId),
        animalService.getAllAnimals(farmId).catch(() => [] as Animal[]),
      ]);
      setFarm(farmData);
      setAnimals(farmAnimals);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadFarmData();
  }, [loadFarmData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFarmData();
    });
    return unsubscribe;
  }, [navigation, loadFarmData]);

  const handleEdit = () => {
    if (!farm) return;
    navigation.navigate('EditFarm', { farmId: farm.id });
  };

  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await farmService.deleteFarm(farmId);
      navigation.goBack();
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Farm',
      `Are you sure you want to delete "${farm?.farmName || 'this farm'}"? All animals registered under this farm will also be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: executeDelete,
        },
      ],
      { cancelable: true }
    );
  };

  const handleViewAnimals = () => {
    if (!farm) return;
    navigation.navigate('AnimalList', { farmId: farm.id, farmName: farm.farmName });
  };

  const handleAddAnimal = () => {
    if (!farm) return;
    navigation.navigate('AddAnimal', { farmId: farm.id });
  };

  if (isLoading) {
    return <LoadingView message="Loading farm details..." />;
  }

  if (errorMessage && !farm) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="farm-details-error"
          message={errorMessage}
          onRetry={loadFarmData}
        />
        <AppButton
          title="Back to Farm List"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {errorMessage && (
        <ErrorMessage
          testID="farm-action-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Main Farm Card */}
      <AppCard style={styles.card} testID="farm-info-card">
        <View style={styles.heroRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🏡</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.farmTitle} testID="farm-detail-name">
              {farm?.farmName}
            </Text>
            <Text style={styles.farmIdBadge}>Farm ID: #{farm?.id}</Text>
          </View>
        </View>

        <View style={styles.detailsTable}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location</Text>
            <Text style={styles.detailValue} testID="farm-detail-location">
              {farm?.location || 'Not provided'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🏛️ District</Text>
            <Text style={styles.detailValue} testID="farm-detail-district">
              {farm?.district || 'Not provided'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🗺️ State</Text>
            <Text style={styles.detailValue} testID="farm-detail-state">
              {farm?.state || 'Not provided'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📮 Pincode</Text>
            <Text style={styles.detailValue} testID="farm-detail-pincode">
              {farm?.pincode || 'Not provided'}
            </Text>
          </View>
        </View>
      </AppCard>

      {/* Livestock Summary Card */}
      <AppCard style={styles.card} testID="farm-livestock-card">
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>🐄 Livestock Herd</Text>
            <Text style={styles.sectionSubtitle}>
              {animals.length} {animals.length === 1 ? 'animal registered' : 'animals registered'}
            </Text>
          </View>
          <AppButton
            testID="view-animals-button"
            title="View Animals"
            size="small"
            onPress={handleViewAnimals}
          />
        </View>

        <View style={styles.addAnimalButtonRow}>
          <AppButton
            testID="add-animal-to-farm-button"
            title="+ Add Animal to this Farm"
            variant="outline"
            onPress={handleAddAnimal}
          />
        </View>
      </AppCard>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <AppButton
          testID="edit-farm-button"
          title="✏️ Edit Farm Details"
          variant="secondary"
          onPress={handleEdit}
          disabled={isDeleting}
          style={styles.actionButton}
        />

        <AppButton
          testID="delete-farm-button"
          title="🗑️ Delete Farm"
          variant="outline"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          style={[styles.actionButton, styles.deleteButton]}
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
  card: {
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  heroInfo: {
    flex: 1,
  },
  farmTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  farmIdBadge: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsTable: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  detailValue: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addAnimalButtonRow: {
    marginTop: spacing.sm,
  },
  actionSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  deleteButton: {
    borderColor: colors.error,
  },
  backButton: {
    marginTop: spacing.md,
  },
});

export default FarmDetailsScreen;
