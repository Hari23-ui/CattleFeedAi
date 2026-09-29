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
import {
  CreateAnimalRequest,
  FeedIntakeStatus,
  Gender,
  LactationStage,
  PregnancyStatus,
} from '../../models/animal';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { animalService } from '../../services/animalService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateAnimalForm } from '../../utils/validation';

export const AddAnimalScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AddAnimal'>['route']>();
  const initialFarmId = route.params?.farmId;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form state
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(initialFarmId);
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

  const handleSubmit = async () => {
    const rawForm: Partial<CreateAnimalRequest> = {
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

      const payload: CreateAnimalRequest = {
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

      const created = await animalService.createAnimal(payload);
      navigation.replace('AnimalDetails', { animalId: created.id });
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingFarms) {
    return <LoadingView message="Loading farm records..." />;
  }

  if (farms.length === 0) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <AppCard style={styles.noFarmCard}>
          <Text style={styles.noFarmIcon}>🏡</Text>
          <Text style={styles.noFarmTitle}>No Farm Found</Text>
          <Text style={styles.noFarmSubtitle}>
            Animals must be registered under an existing farm. Please create a farm first.
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
      <Text style={styles.screenTitle}>Register New Animal</Text>
      <Text style={styles.screenSubtitle}>
        Add livestock to your farm herd with ear tag, breed, and production metrics.
      </Text>

      {apiError && (
        <ErrorMessage
          testID="add-animal-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Target Farm Section */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>1. Target Farm</Text>
        <OptionSelector
          testID="farm-selector"
          label="Select Farm"
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

      {/* Basic Profile Section */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>2. Basic Identification</Text>

        <AppInput
          testID="animal-tag-input"
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
          testID="animal-name-input"
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
          testID="animal-breed-input"
          label="Breed"
          placeholder="e.g. Holstein Friesian, Jersey, Gir, Murrah"
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
          testID="gender-selector"
          label="Sex / Gender"
          required={true}
          options={genderOptions}
          selectedValue={gender}
          onSelect={(val) => setGender(val)}
          error={errors.gender}
        />

        <AppInput
          testID="animal-dob-input"
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

      {/* Production & Health Section */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>3. Production Information</Text>

        <AppInput
          testID="animal-weight-input"
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
              testID="lactation-stage-selector"
              label="Lactation Stage"
              options={lactationOptions}
              selectedValue={lactationStage}
              onSelect={(val) => setLactationStage(val)}
            />

            <AppInput
              testID="days-in-milk-input"
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
              testID="milk-production-input"
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
              testID="pregnancy-status-selector"
              label="Pregnancy Status"
              options={pregnancyOptions}
              selectedValue={pregnancyStatus}
              onSelect={(val) => setPregnancyStatus(val)}
            />
          </>
        )}

        <OptionSelector
          testID="feed-intake-selector"
          label="Feed Intake Status"
          options={feedOptions}
          selectedValue={feedIntakeStatus}
          onSelect={(val) => setFeedIntakeStatus(val)}
        />
      </AppCard>

      {/* Submit Buttons */}
      <View style={styles.buttonSection}>
        <AppButton
          testID="submit-animal-button"
          title="Register Animal"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          accessibilityLabel="Register Animal"
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

export default AddAnimalScreen;
