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
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Animal } from '../../models/animal';
import { FeedSample } from '../../models/feed';
import { SilageSample } from '../../models/silage';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { animalService } from '../../services/animalService';
import { feedService } from '../../services/feedService';
import { silageService } from '../../services/silageService';
import { feedPlanService } from '../../services/feedPlanService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const FREQUENCY_OPTIONS = [
  { label: 'Daily (Once)', value: 'DAILY' },
  { label: 'Twice Daily', value: 'TWICE_DAILY' },
  { label: 'Thrice Daily', value: 'THRICE_DAILY' },
  { label: 'Every 2 Days', value: 'EVERY_OTHER_DAY' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export const EditFeedPlanScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'EditFeedPlan'>['route']>();
  const { planId } = route.params;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [feedSamples, setFeedSamples] = useState<FeedSample[]>([]);
  const [silageSamples, setSilageSamples] = useState<SilageSample[]>([]);

  // Form states
  const [planName, setPlanName] = useState<string>('');
  const [animalId, setAnimalId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [plannedQuantity, setPlannedQuantity] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('TWICE_DAILY');
  const [feedSampleId, setFeedSampleId] = useState<number | undefined>(undefined);
  const [silageSampleId, setSilageSampleId] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    const loadPlanAndDropdowns = async () => {
      try {
        const [planData, animalsData, feedsData, silagesData] = await Promise.all([
          feedPlanService.getFeedPlanById(planId),
          animalService.getAllAnimals().catch(() => [] as Animal[]),
          feedService.getAllFeedSamples().catch(() => [] as FeedSample[]),
          silageService.getAllSilageSamples().catch(() => [] as SilageSample[]),
        ]);

        setPlanName(planData.planName);
        setAnimalId(planData.animal?.id);
        setStartDate(planData.startDate);
        setEndDate(planData.endDate || '');
        setPlannedQuantity(planData.plannedQuantity ? String(planData.plannedQuantity) : '');
        setFrequency(planData.frequency || 'TWICE_DAILY');
        setFeedSampleId(planData.feedSample?.id);
        setSilageSampleId(planData.silageSample?.id);
        setDescription(planData.description || '');
        setNotes(planData.notes || '');
        setStatus(planData.status || 'ACTIVE');

        setAnimals(animalsData);
        setFeedSamples(feedsData);
        setSilageSamples(silagesData);
      } catch (err) {
        setApiError(getFarmerFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadPlanAndDropdowns();
  }, [planId]);

  const validateForm = (): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (!planName.trim()) {
      errs.planName = 'Plan name is required';
    }
    if (!animalId) {
      errs.animalId = 'Animal selection is required';
    }
    if (!startDate.trim()) {
      errs.startDate = 'Start date is required (YYYY-MM-DD)';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      errs.startDate = 'Date format must be YYYY-MM-DD';
    }
    if (endDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
        errs.endDate = 'Date format must be YYYY-MM-DD';
      } else if (endDate.trim() < startDate.trim()) {
        errs.endDate = 'End date cannot be before start date';
      }
    }
    if (plannedQuantity.trim()) {
      const q = parseFloat(plannedQuantity);
      if (isNaN(q) || q <= 0) {
        errs.plannedQuantity = 'Quantity must be a positive number';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setApiError(null);
      await feedPlanService.updateFeedPlan(planId, {
        planName: planName.trim(),
        animalId: animalId!,
        startDate: startDate.trim(),
        endDate: endDate.trim() ? endDate.trim() : undefined,
        plannedQuantity: plannedQuantity.trim() ? parseFloat(plannedQuantity) : undefined,
        frequency,
        feedSampleId: feedSampleId || undefined,
        silageSampleId: silageSampleId || undefined,
        description: description.trim() ? description.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        status,
      });
      navigation.navigate('FeedPlanDetails', { planId });
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const animalOptions = animals.map((a) => ({
    label: `${a.animalTag}${a.name ? ` (${a.name})` : ''} - ${a.breed || 'Cattle'}`,
    value: a.id,
  }));

  const feedOptions = [
    { label: 'None (No Feed Batch Linked)', value: 0 },
    ...feedSamples.map((f) => ({
      label: `${f.sampleCode} - ${f.feedType || 'Feed'}`,
      value: f.id,
    })),
  ];

  const silageOptions = [
    { label: 'None (No Silage Batch Linked)', value: 0 },
    ...silageSamples.map((s) => ({
      label: `${s.sampleCode} - ${s.silageType || 'Silage'}`,
      value: s.id,
    })),
  ];

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} contentContainerStyle={styles.centerContainer}>
        <LoadingView message="Loading plan..." testID="edit-plan-loading" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Feed Plan</Text>
      <Text style={styles.subtitle}>Modify feeding ration, status, or assigned animal</Text>

      {apiError && (
        <ErrorMessage
          testID="edit-plan-api-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      <AppCard style={styles.formCard}>
        <AppInput
          testID="edit-plan-name-input"
          label="Plan Name *"
          placeholder="e.g. Early Lactation Diet"
          value={planName}
          onChangeText={(val) => {
            setPlanName(val);
            if (errors.planName) setErrors((prev) => ({ ...prev, planName: undefined }));
          }}
          error={errors.planName}
        />

        {animalOptions.length > 0 && (
          <OptionSelector
            testID="edit-plan-animal-selector"
            label="Target Animal *"
            options={animalOptions}
            selectedValue={animalId}
            onSelect={(val) => {
              setAnimalId(val);
              if (errors.animalId) setErrors((prev) => ({ ...prev, animalId: undefined }));
            }}
            error={errors.animalId}
            required={true}
          />
        )}

        <AppInput
          testID="edit-plan-start-date-input"
          label="Start Date (YYYY-MM-DD) *"
          placeholder="2026-10-01"
          value={startDate}
          onChangeText={(val) => {
            setStartDate(val);
            if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }));
          }}
          error={errors.startDate}
        />

        <AppInput
          testID="edit-plan-end-date-input"
          label="End Date (YYYY-MM-DD, optional)"
          placeholder="2026-10-31"
          value={endDate}
          onChangeText={(val) => {
            setEndDate(val);
            if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
          }}
          error={errors.endDate}
        />

        <AppInput
          testID="edit-plan-quantity-input"
          label="Planned Quantity (kg / day)"
          placeholder="e.g. 5.5"
          value={plannedQuantity}
          keyboardType="numeric"
          onChangeText={(val) => {
            setPlannedQuantity(val);
            if (errors.plannedQuantity) setErrors((prev) => ({ ...prev, plannedQuantity: undefined }));
          }}
          error={errors.plannedQuantity}
        />

        <OptionSelector
          testID="edit-plan-frequency-selector"
          label="Feeding Frequency"
          options={FREQUENCY_OPTIONS}
          selectedValue={frequency}
          onSelect={(val) => setFrequency(val)}
        />

        {feedOptions.length > 1 && (
          <OptionSelector
            testID="edit-plan-feed-selector"
            label="Link Feed Sample Batch (Optional)"
            options={feedOptions}
            selectedValue={feedSampleId || 0}
            onSelect={(val) => setFeedSampleId(val === 0 ? undefined : val)}
          />
        )}

        {silageOptions.length > 1 && (
          <OptionSelector
            testID="edit-plan-silage-selector"
            label="Link Silage Sample Batch (Optional)"
            options={silageOptions}
            selectedValue={silageSampleId || 0}
            onSelect={(val) => setSilageSampleId(val === 0 ? undefined : val)}
          />
        )}

        <OptionSelector
          testID="edit-plan-status-selector"
          label="Plan Status"
          options={STATUS_OPTIONS}
          selectedValue={status}
          onSelect={(val) => setStatus(val)}
        />

        <AppInput
          testID="edit-plan-description-input"
          label="Ration Composition / Instructions"
          placeholder="e.g. Morning: 3kg pellet, Evening: 2.5kg mash"
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={3}
        />

        <AppInput
          testID="edit-plan-notes-input"
          label="Farmer Notes / Observations"
          placeholder="e.g. Monitor intake alongside silage transition"
          value={notes}
          onChangeText={setNotes}
          multiline={true}
          numberOfLines={2}
        />
      </AppCard>

      <View style={styles.actionRow}>
        <AppButton
          testID="save-changes-button"
          title="Save Changes"
          onPress={handleUpdate}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.actionButton}
        />
        <AppButton
          testID="cancel-edit-button"
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
          style={styles.actionButton}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
