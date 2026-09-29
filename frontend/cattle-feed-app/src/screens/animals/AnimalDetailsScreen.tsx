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
import { Animal } from '../../models/animal';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { animalService } from '../../services/animalService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const AnimalDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AnimalDetails'>['route']>();
  const { animalId } = route.params;

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAnimalData = useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoading(true);
      const animalData = await animalService.getAnimalById(animalId);
      setAnimal(animalData);

      if (animalData.farmId) {
        try {
          const farmData = await farmService.getFarmById(animalData.farmId);
          setFarm(farmData);
        } catch {
          // If farm fetch fails, proceed with animal details
        }
      }
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    loadAnimalData();
  }, [loadAnimalData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAnimalData();
    });
    return unsubscribe;
  }, [navigation, loadAnimalData]);

  const handleEdit = () => {
    if (!animal) return;
    navigation.navigate('EditAnimal', { animalId: animal.id });
  };

  const executeDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await animalService.deleteAnimal(animalId);
      navigation.goBack();
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Animal Record',
      `Are you sure you want to delete animal tag "${animal?.animalTag || 'this animal'}"? This action cannot be undone.`,
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

  const calculateAge = (dobString?: string | null): string => {
    if (!dobString) return 'Not recorded';
    try {
      const dob = new Date(dobString);
      const today = new Date();
      if (isNaN(dob.getTime())) return dobString;

      const totalMonths = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
      if (totalMonths < 1) return '< 1 month';
      if (totalMonths < 12) return `${totalMonths} months`;

      const years = Math.floor(totalMonths / 12);
      const remainingMonths = totalMonths % 12;
      return remainingMonths > 0 ? `${years}y ${remainingMonths}m (${dobString})` : `${years} years (${dobString})`;
    } catch {
      return dobString;
    }
  };

  if (isLoading) {
    return <LoadingView message="Loading animal profile..." />;
  }

  if (errorMessage && !animal) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="animal-details-error"
          message={errorMessage}
          onRetry={loadAnimalData}
        />
        <AppButton
          title="Back to Livestock List"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  const isFemale = animal?.gender === 'FEMALE';

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {errorMessage && (
        <ErrorMessage
          testID="animal-action-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Header Banner Card */}
      <AppCard style={styles.card} testID="animal-header-card">
        <View style={styles.heroRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{isFemale ? '🐄' : '🐂'}</Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.tagTitleRow}>
              <Text style={styles.animalTag} testID="animal-detail-tag">
                {animal?.animalTag}
              </Text>
              {animal?.name ? (
                <Text style={styles.animalName}>({animal.name})</Text>
              ) : null}
            </View>
            <Text style={styles.breedSubtitle}>
              {animal?.breed || 'Breed not specified'} • {animal?.gender}
            </Text>
            <Text style={styles.farmAssocText}>
              🏡 {farm ? farm.farmName : `Farm #${animal?.farmId}`}
            </Text>
          </View>
        </View>
      </AppCard>

      {/* 1. Basic Information Section */}
      <AppCard style={styles.card} testID="basic-info-card">
        <Text style={styles.sectionHeader}>📋 Basic Information</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Animal Tag</Text>
            <Text style={styles.tableValue}>{animal?.animalTag}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Name</Text>
            <Text style={styles.tableValue}>{animal?.name || 'Not specified'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Breed</Text>
            <Text style={styles.tableValue}>{animal?.breed || 'Not specified'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Sex / Gender</Text>
            <Text style={styles.tableValue}>{animal?.gender}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Age / DOB</Text>
            <Text style={styles.tableValue}>{calculateAge(animal?.dateOfBirth)}</Text>
          </View>
        </View>
      </AppCard>

      {/* 2. Production Information Section */}
      <AppCard style={styles.card} testID="production-info-card">
        <Text style={styles.sectionHeader}>🥛 Production Information</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Weight</Text>
            <Text style={styles.tableValue}>
              {animal?.weight !== null && animal?.weight !== undefined
                ? `${animal.weight} kg`
                : 'Not recorded'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Lactation Stage</Text>
            <Text style={styles.tableValue}>
              {animal?.lactationStage || 'Not specified'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Days in Milk</Text>
            <Text style={styles.tableValue}>
              {animal?.daysInMilk !== null && animal?.daysInMilk !== undefined
                ? `${animal.daysInMilk} days`
                : 'Not recorded'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Milk Production</Text>
            <Text style={styles.tableValue}>
              {animal?.milkProductionPerDay !== null && animal?.milkProductionPerDay !== undefined
                ? `${animal.milkProductionPerDay} Liters / day`
                : 'Not recorded'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Pregnancy Status</Text>
            <Text style={styles.tableValue}>
              {animal?.pregnancyStatus === 'PREGNANT'
                ? '🤰 Pregnant'
                : animal?.pregnancyStatus === 'NOT_PREGNANT'
                ? 'Open (Not Pregnant)'
                : 'Unknown'}
            </Text>
          </View>
        </View>
      </AppCard>

      {/* 3. Feed Information Section */}
      <AppCard style={styles.card} testID="feed-info-card">
        <Text style={styles.sectionHeader}>🌾 Feed Information</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Feed Intake Status</Text>
            <Text style={styles.tableValue}>
              {animal?.feedIntakeStatus === 'NORMAL'
                ? '🟢 Normal'
                : animal?.feedIntakeStatus === 'REDUCED'
                ? '🟠 Reduced'
                : animal?.feedIntakeStatus === 'INCREASED'
                ? '🔵 Increased'
                : 'Unknown'}
            </Text>
          </View>
        </View>
      </AppCard>

      {/* 4. Integrated Decision Support & Livestock Care (M12) */}
      <AppCard style={styles.card} testID="animal-decision-support-card">
        <Text style={styles.sectionHeader}>🔬 Integrated Decision Support</Text>
        <Text style={styles.screeningDescription}>
          Connect live feed records, lab test results, risk screening, AI visual screening, feed plans, and expert consultations for this animal.
        </Text>

        <AppButton
          testID="evidence-summary-button"
          title="🔬 View Unified Evidence Summary →"
          onPress={() => {
            if (animal) {
              navigation.navigate('EvidenceSummary', { animalId: animal.id, title: `Evidence: ${animal.animalTag}` });
            }
          }}
          style={styles.primaryActionButton}
        />

        <View style={styles.quickAccessRow}>
          <AppButton
            testID="health-screening-button"
            title="🩺 Health Screening"
            variant="outline"
            onPress={() => {
              if (animal) {
                navigation.navigate('AnimalHealthScreening', { animalId: animal.id });
              }
            }}
            style={styles.halfButton}
          />
          <AppButton
            testID="feed-plans-button"
            title="📋 Feed Plans"
            variant="outline"
            onPress={() => {
              navigation.navigate('FeedPlanList');
            }}
            style={styles.halfButton}
          />
        </View>

        <View style={styles.quickAccessRow}>
          <AppButton
            testID="animal-analytics-button"
            title="📊 Historical Trends"
            variant="outline"
            onPress={() => {
              if (animal) {
                navigation.navigate('AnimalAnalytics', { animalId: animal.id, animalTag: animal.animalTag });
              }
            }}
            style={styles.halfButton}
          />
          <AppButton
            testID="animal-advisories-button"
            title="💡 Advisories"
            variant="outline"
            onPress={() => {
              if (animal) {
                navigation.navigate('AdvisoryList', { animalId: animal.id });
              }
            }}
            style={styles.halfButton}
          />
        </View>

        <AppButton
          testID="animal-consultations-button"
          title="💬 Consultations & Expert Advice"
          variant="outline"
          onPress={() => {
            navigation.navigate('ConsultationList');
          }}
          style={styles.quickActionButton}
        />
      </AppCard>

      {/* Actions */}
      <View style={styles.actionSection}>
        <AppButton
          testID="edit-animal-button"
          title="✏️ Edit Animal Profile"
          variant="secondary"
          onPress={handleEdit}
          disabled={isDeleting}
          style={styles.actionButton}
        />

        <AppButton
          testID="delete-animal-button"
          title="🗑️ Delete Animal"
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
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  heroInfo: {
    flex: 1,
  },
  tagTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  animalTag: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  animalName: {
    fontSize: typography.fontSize.subtitle,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  breedSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  farmAssocText: {
    fontSize: typography.fontSize.small,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  table: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tableLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  tableValue: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
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
  screeningDescription: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  screeningButton: {
    width: '100%',
  },
  primaryActionButton: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  halfButton: {
    flex: 1,
  },
  quickActionButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
});

export default AnimalDetailsScreen;
