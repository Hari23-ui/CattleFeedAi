import React, { useCallback, useEffect, useState } from 'react';
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
import { FeedType, UpdateFeedSampleRequest } from '../../models/feed';
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

export const EditFeedScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'EditFeed'>['route']>();
  const { sampleId } = route.params;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form state
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | undefined>(undefined);
  const [sampleCode, setSampleCode] = useState<string>('');
  const [feedType, setFeedType] = useState<FeedType>('CATTLE_FEED_PELLET');
  const [sampleDate, setSampleDate] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const [sampleData, userFarms] = await Promise.all([
        feedService.getFeedSampleById(sampleId),
        farmService.getAllFarms().catch(() => [] as Farm[]),
      ]);

      setFarms(userFarms);
      setSelectedFarmId(sampleData.farmId);
      setSelectedAnimalId(sampleData.animalId || undefined);
      setSampleCode(sampleData.sampleCode);
      setFeedType(sampleData.feedType);
      setSampleDate(sampleData.sampleDate);
      setSource(sampleData.source || '');
      setNotes(sampleData.notes || '');

      if (sampleData.farmId) {
        try {
          const farmAnimals = await animalService.getAllAnimals(sampleData.farmId);
          setAnimals(farmAnimals);
        } catch {
          setAnimals([]);
        }
      }
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [sampleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    const rawForm: Partial<UpdateFeedSampleRequest> = {
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

      const payload: UpdateFeedSampleRequest = {
        farmId: selectedFarmId!,
        animalId: selectedAnimalId,
        sampleCode: sampleCode.trim(),
        feedType,
        sampleDate: sampleDate.trim(),
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await feedService.updateFeedSample(sampleId, payload);
      navigation.goBack();
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Loading feed sample details..." />;
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
      <Text style={styles.screenTitle}>Edit Feed Sample</Text>
      <Text style={styles.screenSubtitle}>
        Update sample batch identification, feed type, or supplier details.
      </Text>

      {apiError && (
        <ErrorMessage
          testID="edit-feed-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Farm Selection */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>1. Target Farm</Text>
        <OptionSelector
          testID="edit-feed-farm-selector"
          label="Assigned Farm"
          required={true}
          options={farmOptions}
          selectedValue={selectedFarmId}
          onSelect={(val) => {
            setSelectedFarmId(val);
            if (errors.farmId) setErrors((prev) => ({ ...prev, farmId: undefined }));
          }}
          error={errors.farmId}
        />

        {animals.length > 0 && (
          <OptionSelector
            testID="edit-feed-animal-selector"
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
          testID="edit-feed-sample-code-input"
          label="Sample Code / Batch ID *"
          placeholder="e.g. FEED-2026-001"
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
          testID="edit-feed-type-selector"
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
          testID="edit-feed-sample-date-input"
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
          testID="edit-feed-source-input"
          label="Source / Manufacturer / Supplier (Optional)"
          placeholder="e.g. Local Co-op, Farm Field 3"
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
          testID="edit-feed-notes-input"
          label="Notes / Observations (Optional)"
          placeholder="e.g. Stored in dry shed"
          value={notes}
          onChangeText={setNotes}
          autoCapitalize="sentences"
          accessibilityLabel="Notes"
        />
      </AppCard>

      {/* Submit Buttons */}
      <View style={styles.buttonSection}>
        <AppButton
          testID="save-feed-button"
          title="Save Changes"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          accessibilityLabel="Save Changes"
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
});

export default EditFeedScreen;
