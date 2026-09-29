import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  AppInput,
  ErrorMessage,
  LoadingView,
  OptionSelector,
  ScreenContainer,
} from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { CreateFeedSampleRequest, FeedType } from '../../models/feed';
import { Farm } from '../../models/farm';
import { Animal } from '../../models/animal';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { feedService } from '../../services/feedService';
import { farmService } from '../../services/farmService';
import { animalService } from '../../services/animalService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateFeedSampleForm } from '../../utils/validation';

const FEED_TYPE_OPTIONS: { label: string; value: FeedType; description: string }[] = [
  { label: 'Cattle Pellet', value: 'CATTLE_FEED_PELLET', description: 'Commercial compound feed' },
  { label: 'Feed Mash', value: 'FEED_MASH', description: 'Grain & concentrate mash mix' },
  { label: 'Mineral Mix', value: 'MINERAL_MIXTURE', description: 'Chelated minerals & vitamins' },
  { label: 'Green Fodder', value: 'GREEN_FODDER', description: 'Fresh green pasture/grass' },
  { label: 'Dry Fodder', value: 'DRY_FODDER', description: 'Straw, hay & stover' },
  { label: 'Other Feed', value: 'OTHER', description: 'Custom/by-product feed' },
];

export const AddFeedScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AddFeed'>['route']>();
  const initialFarmId = route.params?.farmId;
  const initialAnimalId = route.params?.animalId;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form state
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(initialFarmId);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | undefined>(initialAnimalId);
  const [sampleCode, setSampleCode] = useState<string>('');
  const [feedType, setFeedType] = useState<FeedType>('CATTLE_FEED_PELLET');
  const [sampleDate, setSampleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Fetch farmer's farms
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const userFarms = await farmService.getAllFarms();
        setFarms(userFarms);
        if (!selectedFarmId && userFarms.length > 0) {
          setSelectedFarmId(userFarms[0].id);
        }
      } catch (err) {
        setApiError(getFarmerFriendlyErrorMessage(err));
      } finally {
        setIsLoadingFarms(false);
      }
    };
    fetchFarms();
  }, [selectedFarmId]);

  // Fetch animals for selected farm
  useEffect(() => {
    if (!selectedFarmId) {
      setAnimals([]);
      return;
    }
    const fetchAnimals = async () => {
      try {
        const farmAnimals = await animalService.getAllAnimals(selectedFarmId);
        setAnimals(farmAnimals);
      } catch {
        setAnimals([]);
      }
    };
    fetchAnimals();
  }, [selectedFarmId]);

  const handleSubmit = async () => {
    const rawForm: Partial<CreateFeedSampleRequest> = {
      farmId: selectedFarmId,
      animalId: selectedAnimalId,
      sampleCode: sampleCode.trim(),
      feedType,
      sampleDate: sampleDate.trim(),
      source: source.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const validation = validateFeedSampleForm(rawForm);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload: CreateFeedSampleRequest = {
        farmId: selectedFarmId!,
        animalId: selectedAnimalId,
        sampleCode: sampleCode.trim(),
        feedType,
        sampleDate: sampleDate.trim(),
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const created = await feedService.createFeedSample(payload);
      navigation.replace('FeedDetails', { sampleId: created.id });
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingFarms) {
    return <LoadingView message="Loading farm profiles..." />;
  }

  if (farms.length === 0) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <AppCard style={styles.noFarmCard}>
          <Text style={styles.noFarmIcon}>🏡</Text>
          <Text style={styles.noFarmTitle}>No Farm Found</Text>
          <Text style={styles.noFarmSubtitle}>
            Feed samples must be registered under an existing farm profile. Please create a farm first.
          </Text>
          <AppButton
            title="+ Create a Farm First"
            onPress={() => navigation.navigate('AddFarm')}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  const farmOptions = farms.map((f) => ({
    label: f.farmName,
    value: f.id,
    description: [f.district, f.state].filter(Boolean).join(', ') || undefined,
  }));

  const animalOptions = [
    { label: 'None (Batch / Herd Sample)', value: 0 },
    ...animals.map((a) => ({
      label: `${a.animalTag}${a.name ? ` (${a.name})` : ''}`,
      value: a.id,
      description: a.breed || undefined,
    })),
  ];

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Register Feed Sample</Text>
      <Text style={styles.screenSubtitle}>
        Record sample information for cattle feed pellets, concentrate mash, or fodder.
      </Text>

      {apiError && (
        <ErrorMessage
          testID="add-feed-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Target Farm */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>1. Target Farm</Text>
        <OptionSelector
          testID="feed-farm-selector"
          label="Select Farm"
          required={true}
          options={farmOptions}
          selectedValue={selectedFarmId}
          onSelect={(val) => {
            setSelectedFarmId(val);
            setSelectedAnimalId(undefined);
            if (errors.farmId) setErrors((prev) => ({ ...prev, farmId: undefined }));
          }}
          error={errors.farmId}
        />

        {animals.length > 0 && (
          <OptionSelector
            testID="feed-animal-selector"
            label="Linked Animal (Optional)"
            options={animalOptions}
            selectedValue={selectedAnimalId || 0}
            onSelect={(val) => setSelectedAnimalId(val === 0 ? undefined : val)}
          />
        )}
      </AppCard>

      {/* Sample Information */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>2. Sample Information</Text>

        <AppInput
          testID="feed-sample-code-input"
          label="Sample Code / Batch ID *"
          placeholder="e.g. FEED-2026-001 or BATCH-A"
          value={sampleCode}
          onChangeText={(text) => {
            setSampleCode(text);
            if (errors.sampleCode) setErrors((prev) => ({ ...prev, sampleCode: undefined }));
          }}
          error={errors.sampleCode}
          autoCapitalize="characters"
          accessibilityLabel="Sample Code"
        />

        <OptionSelector
          testID="feed-type-selector"
          label="Feed Type"
          required={true}
          options={FEED_TYPE_OPTIONS}
          selectedValue={feedType}
          onSelect={(val) => {
            setFeedType(val);
            if (errors.feedType) setErrors((prev) => ({ ...prev, feedType: undefined }));
          }}
          error={errors.feedType}
        />

        <AppInput
          testID="feed-sample-date-input"
          label="Sample Collection Date (YYYY-MM-DD) *"
          placeholder="e.g. 2026-09-27"
          value={sampleDate}
          onChangeText={(text) => {
            setSampleDate(text);
            if (errors.sampleDate) setErrors((prev) => ({ ...prev, sampleDate: undefined }));
          }}
          error={errors.sampleDate}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel="Sample Collection Date"
        />

        <AppInput
          testID="feed-source-input"
          label="Source / Manufacturer / Supplier (Optional)"
          placeholder="e.g. Amul Feed Mill, Local Co-op, Farm Field 3"
          value={source}
          onChangeText={(text) => {
            setSource(text);
            if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
          }}
          error={errors.source}
          autoCapitalize="words"
          accessibilityLabel="Feed Source"
        />

        <AppInput
          testID="feed-notes-input"
          label="Notes / Observations (Optional)"
          placeholder="e.g. Fresh shipment, sealed 50kg bag, stored in dry shed"
          value={notes}
          onChangeText={setNotes}
          autoCapitalize="sentences"
          accessibilityLabel="Notes"
        />
      </AppCard>

      {/* Submit Buttons */}
      <View style={styles.buttonSection}>
        <AppButton
          testID="submit-feed-button"
          title="Register Feed Sample"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          accessibilityLabel="Register Feed Sample"
          style={styles.submitButton}
        />

        <AppButton
          title="Cancel"
          variant="text"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={styles.cancelButton}
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
  screenTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },
  buttonSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  submitButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
  noFarmCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  noFarmIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noFarmTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noFarmSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});

export default AddFeedScreen;
