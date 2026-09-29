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
import {
  FeedIntakeStatus,
  Gender,
  LactationStage,
  PregnancyStatus,
  UpdateAnimalRequest,
} from '../../models/animal';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { animalService } from '../../services/animalService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateAnimalForm } from '../../utils/validation';

export const EditAnimalScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'EditAnimal'>['route']>();
  const { animalId } = route.params;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form state
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
  const [animalTag, setAnimalTag] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [breed, setBreed] = useState<string>('');
  const [gender, setGender] = useState<Gender>('FEMALE');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [lactationStage, setLactationStage] = useState<LactationStage | undefined>(undefined);
  const [daysInMilk, setDaysInMilk] = useState<string>('');
  const [milkProduction, setMilkProduction] = useState<string>('');
  const [pregnancyStatus, setPregnancyStatus] = useState<PregnancyStatus | undefined>(undefined);
  const [feedIntakeStatus, setFeedIntakeStatus] = useState<FeedIntakeStatus | undefined>(undefined);

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const [animalData, userFarms] = await Promise.all([
        animalService.getAnimalById(animalId),
        farmService.getAllFarms().catch(() => [] as Farm[]),
      ]);

      setFarms(userFarms);
      setSelectedFarmId(animalData.farmId);
      setAnimalTag(animalData.animalTag);
      setName(animalData.name || '');
      setBreed(animalData.breed || '');
      setGender(animalData.gender);
      setDateOfBirth(animalData.dateOfBirth || '');
      setWeight(
        animalData.weight !== undefined && animalData.weight !== null
          ? String(animalData.weight)
          : ''
      );
      setLactationStage(animalData.lactationStage || undefined);
      setDaysInMilk(
        animalData.daysInMilk !== undefined && animalData.daysInMilk !== null
          ? String(animalData.daysInMilk)
          : ''
      );
      setMilkProduction(
        animalData.milkProductionPerDay !== undefined && animalData.milkProductionPerDay !== null
          ? String(animalData.milkProductionPerDay)
          : ''
      );
      setPregnancyStatus(animalData.pregnancyStatus || undefined);
      setFeedIntakeStatus(animalData.feedIntakeStatus || undefined);
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    const rawForm: Partial<UpdateAnimalRequest> = {
      farmId: selectedFarmId,
      animalTag: animalTag.trim(),
      name: name.trim() || undefined,
      breed: breed.trim() || undefined,
      gender,
      dateOfBirth: dateOfBirth.trim() || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      lactationStage,
      daysInMilk: daysInMilk ? parseInt(daysInMilk, 10) : undefined,
      milkProductionPerDay: milkProduction ? parseFloat(milkProduction) : undefined,
      pregnancyStatus,
      feedIntakeStatus,
    };

    const validation = validateAnimalForm(rawForm);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload: UpdateAnimalRequest = {
        farmId: selectedFarmId!,
        animalTag: animalTag.trim(),
        name: name.trim() || undefined,
        breed: breed.trim() || undefined,
        gender,
        dateOfBirth: dateOfBirth.trim() || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        lactationStage,
        daysInMilk: daysInMilk ? parseInt(daysInMilk, 10) : undefined,
        milkProductionPerDay: milkProduction ? parseFloat(milkProduction) : undefined,
        pregnancyStatus,
        feedIntakeStatus,
      };

      await animalService.updateAnimal(animalId, payload);
      navigation.goBack();
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Loading animal profile..." />;
  }

  const farmOptions = farms.map((f) => ({
    label: f.farmName,
    value: f.id,
    description: [f.district, f.state].filter(Boolean).join(', ') || undefined,
  }));

  const genderOptions: { label: string; value: Gender; icon: string }[] = [
    { label: 'Female (Cow/Heifer)', value: 'FEMALE', icon: '🐄' },
    { label: 'Male (Bull/Sire)', value: 'MALE', icon: '🐂' },
  ];

  const lactationOptions: { label: string; value: LactationStage }[] = [
    { label: 'Dry', value: 'DRY' },
    { label: 'Early', value: 'EARLY' },
    { label: 'Mid', value: 'MID' },
    { label: 'Late', value: 'LATE' },
  ];

  const pregnancyOptions: { label: string; value: PregnancyStatus }[] = [
    { label: 'Pregnant', value: 'PREGNANT' },
    { label: 'Not Pregnant (Open)', value: 'NOT_PREGNANT' },
    { label: 'Unknown', value: 'UNKNOWN' },
  ];

  const feedOptions: { label: string; value: FeedIntakeStatus }[] = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Reduced', value: 'REDUCED' },
    { label: 'Increased', value: 'INCREASED' },
    { label: 'Unknown', value: 'UNKNOWN' },
  ];

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Edit Animal Profile</Text>
      <Text style={styles.screenSubtitle}>
        Update livestock tag, breed, lactation, and production records.
      </Text>

      {apiError && (
        <ErrorMessage
          testID="edit-animal-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Target Farm */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>1. Assigned Farm</Text>
        <OptionSelector
          testID="edit-farm-selector"
          label="Farm"
          required={true}
          options={farmOptions}
          selectedValue={selectedFarmId}
          onSelect={(val) => {
            setSelectedFarmId(val);
            if (errors.farmId) setErrors((prev) => ({ ...prev, farmId: undefined }));
          }}
          error={errors.farmId}
        />
      </AppCard>

      {/* Identification */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>2. Identification</Text>

        <AppInput
          testID="edit-animal-tag-input"
          label="Ear Tag Number *"
          placeholder="e.g. IN-MH-1024 or TAG001"
          value={animalTag}
          onChangeText={(text) => {
            setAnimalTag(text);
            if (errors.animalTag) setErrors((prev) => ({ ...prev, animalTag: undefined }));
          }}
          error={errors.animalTag}
          autoCapitalize="characters"
          accessibilityLabel="Ear Tag Number"
        />

        <AppInput
          testID="edit-animal-name-input"
          label="Animal Name / Nickname (Optional)"
          placeholder="e.g. Ganga or Lakshmi"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          autoCapitalize="words"
          accessibilityLabel="Animal Name"
        />

        <AppInput
          testID="edit-animal-breed-input"
          label="Breed"
          placeholder="e.g. Holstein Friesian, Jersey, Gir"
          value={breed}
          onChangeText={(text) => {
            setBreed(text);
            if (errors.breed) setErrors((prev) => ({ ...prev, breed: undefined }));
          }}
          error={errors.breed}
          autoCapitalize="words"
          accessibilityLabel="Animal Breed"
        />

        <OptionSelector
          testID="edit-gender-selector"
          label="Sex / Gender"
          required={true}
          options={genderOptions}
          selectedValue={gender}
          onSelect={(val) => setGender(val)}
          error={errors.gender}
        />

        <AppInput
          testID="edit-animal-dob-input"
          label="Date of Birth (YYYY-MM-DD)"
          placeholder="e.g. 2023-04-15"
          value={dateOfBirth}
          onChangeText={(text) => {
            setDateOfBirth(text);
            if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
          }}
          error={errors.dateOfBirth}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel="Date of Birth"
        />
      </AppCard>

      {/* Production */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>3. Production & Health</Text>

        <AppInput
          testID="edit-animal-weight-input"
          label="Weight (kg)"
          placeholder="e.g. 450.5"
          value={weight}
          onChangeText={(text) => {
            setWeight(text);
            if (errors.weight) setErrors((prev) => ({ ...prev, weight: undefined }));
          }}
          error={errors.weight}
          keyboardType="decimal-pad"
          accessibilityLabel="Animal Weight"
        />

        {gender === 'FEMALE' && (
          <>
            <OptionSelector
              testID="edit-lactation-stage-selector"
              label="Lactation Stage"
              options={lactationOptions}
              selectedValue={lactationStage}
              onSelect={(val) => setLactationStage(val)}
            />

            <AppInput
              testID="edit-days-in-milk-input"
              label="Days in Milk"
              placeholder="e.g. 60"
              value={daysInMilk}
              onChangeText={(text) => {
                setDaysInMilk(text);
                if (errors.daysInMilk) setErrors((prev) => ({ ...prev, daysInMilk: undefined }));
              }}
              error={errors.daysInMilk}
              keyboardType="number-pad"
              accessibilityLabel="Days in Milk"
            />

            <AppInput
              testID="edit-milk-production-input"
              label="Milk Production (Liters / Day)"
              placeholder="e.g. 18.5"
              value={milkProduction}
              onChangeText={(text) => {
                setMilkProduction(text);
                if (errors.milkProductionPerDay) setErrors((prev) => ({ ...prev, milkProductionPerDay: undefined }));
              }}
              error={errors.milkProductionPerDay}
              keyboardType="decimal-pad"
              accessibilityLabel="Milk Production"
            />

            <OptionSelector
              testID="edit-pregnancy-status-selector"
              label="Pregnancy Status"
              options={pregnancyOptions}
              selectedValue={pregnancyStatus}
              onSelect={(val) => setPregnancyStatus(val)}
            />
          </>
        )}

        <OptionSelector
          testID="edit-feed-intake-selector"
          label="Feed Intake Status"
          options={feedOptions}
          selectedValue={feedIntakeStatus}
          onSelect={(val) => setFeedIntakeStatus(val)}
        />
      </AppCard>

      {/* Submit Buttons */}
      <View style={styles.buttonSection}>
        <AppButton
          testID="save-animal-button"
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

export default EditAnimalScreen;
