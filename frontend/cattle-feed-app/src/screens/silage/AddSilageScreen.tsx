import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
import { CreateSilageSampleRequest, SilageType } from '../../models/silage';
import { Farm } from '../../models/farm';
import { Animal } from '../../models/animal';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { silageService } from '../../services/silageService';
import { farmService } from '../../services/farmService';
import { animalService } from '../../services/animalService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateSilageSampleForm } from '../../utils/validation';

const SILAGE_TYPE_OPTIONS: { label: string; value: SilageType; description: string }[] = [
  { label: 'Maize Silage', value: 'MAIZE', description: 'Whole plant corn / maize forage' },
  { label: 'Sorghum Silage', value: 'SORGHUM', description: 'Forage sorghum / jowar silage' },
  { label: 'Napier Grass', value: 'NAPIER', description: 'Hybrid Napier / elephant grass silage' },
  { label: 'Mixed Forage', value: 'MIXED', description: 'Legume-cereal / mixed grass silage' },
  { label: 'Other Silage', value: 'OTHER', description: 'Sugarcane tops, oats, or custom silage' },
];

export const AddSilageScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AddSilage'>['route']>();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

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
  const [silageType, setSilageType] = useState<SilageType>('MAIZE');
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
    const rawForm: Partial<CreateSilageSampleRequest> = {
      farmId: selectedFarmId,
      animalId: selectedAnimalId && selectedAnimalId !== 0 ? selectedAnimalId : null,
      sampleCode: sampleCode.trim(),
      silageType,
      sampleDate: sampleDate.trim(),
      source: source.trim() ? source.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    };

    const validation = validateSilageSampleForm(rawForm);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload: CreateSilageSampleRequest = {
        farmId: selectedFarmId!,
        animalId: selectedAnimalId && selectedAnimalId !== 0 ? selectedAnimalId : null,
        sampleCode: sampleCode.trim(),
        silageType,
        sampleDate: sampleDate.trim(),
        source: source.trim() ? source.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      };

      const created = await silageService.createSilageSample(payload);
      navigation.replace('SilageDetails', { sampleId: created.id });
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
      <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
        <AppCard style={styles.noFarmCard}>
          <Text style={styles.noFarmIcon}>🏡</Text>
          <Text style={styles.noFarmTitle}>No Farm Found</Text>
          <Text style={styles.noFarmSubtitle}>
            Silage samples must be registered under an existing farm profile. Please create a farm first.
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
    { label: 'None (Bunker / Pit Sample)', value: 0 },
    ...animals.map((a) => ({
      label: `${a.animalTag}${a.name ? ` (${a.name})` : ''}`,
      value: a.id,
      description: `${a.breed || 'Cattle'} • ${a.gender}`,
    })),
  ];

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Register Silage Sample</Text>
      <Text style={styles.screenSubtitle}>
        Log a silage pit, bunker, or bale sample for fermentation & quality testing
      </Text>

      {apiError && (
        <ErrorMessage
          testID="add-silage-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* ──────────────────────────────────────────────────────────
          1. Target Farm
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>1. Target Farm</Text>
        <Text style={styles.sectionHint}>
          Select the farm owning this silage batch and designate an optional animal if feeding a specific cattle unit.
        </Text>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <OptionSelector
              testID="silage-farm-selector"
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
          </View>

          {animals.length > 0 && (
            <View style={isWide ? styles.gridCol : styles.gridColFull}>
              <OptionSelector
                testID="silage-animal-selector"
                label="Designated Animal (Optional)"
                options={animalOptions}
                selectedValue={selectedAnimalId || 0}
                onSelect={(val) => setSelectedAnimalId(val === 0 ? undefined : val)}
              />
            </View>
          )}
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          2. Sample Information
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>2. Sample Information</Text>
        <Text style={styles.sectionHint}>
          Enter core batch tracking details, crop variety, collection date, and storage pit location.
        </Text>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="silage-sample-code-input"
              label="Sample Code / ID *"
              placeholder="e.g. SIL-2026-PIT1-01"
              value={sampleCode}
              onChangeText={(text) => {
                setSampleCode(text);
                if (errors.sampleCode) setErrors((prev) => ({ ...prev, sampleCode: undefined }));
              }}
              error={errors.sampleCode}
              autoCapitalize="characters"
              accessibilityLabel="Sample Code"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <OptionSelector
              testID="silage-type-selector"
              label="Silage Type"
              required={true}
              options={SILAGE_TYPE_OPTIONS}
              selectedValue={silageType}
              onSelect={(val) => {
                setSilageType(val);
                if (errors.silageType) setErrors((prev) => ({ ...prev, silageType: undefined }));
              }}
              error={errors.silageType}
            />
          </View>
        </View>

        <View style={isWide ? styles.gridRow : styles.gridColLayout}>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="silage-sample-date-input"
              label="Sampling Date (YYYY-MM-DD) *"
              placeholder="e.g. 2026-09-29"
              value={sampleDate}
              onChangeText={(text) => {
                setSampleDate(text);
                if (errors.sampleDate) setErrors((prev) => ({ ...prev, sampleDate: undefined }));
              }}
              error={errors.sampleDate}
              accessibilityLabel="Sampling Date"
            />
          </View>
          <View style={isWide ? styles.gridCol : styles.gridColFull}>
            <AppInput
              testID="silage-source-input"
              label="Storage Pit / Bunker / Source (Optional)"
              placeholder="e.g. Trench Pit #2, North Bunker, Silo Bag 4"
              value={source}
              onChangeText={(text) => {
                setSource(text);
                if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
              }}
              error={errors.source}
              autoCapitalize="words"
              accessibilityLabel="Storage Source"
            />
          </View>
        </View>
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          3. Additional Silage Information
          ────────────────────────────────────────────────────────── */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>3. Additional Silage Information</Text>
        <Text style={styles.sectionHint}>
          Record sensory observations such as fermentation smell, color, packing compaction, or ensiling period.
        </Text>

        <AppInput
          testID="silage-notes-input"
          label="Observations & Fermentation Notes (Optional)"
          placeholder="e.g. Fermented 45 days, pleasant aroma, olive-green color, tight bunker packing"
          value={notes}
          onChangeText={setNotes}
          accessibilityLabel="Fermentation Notes"
          multiline={true}
          numberOfLines={3}
        />
      </AppCard>

      {/* ──────────────────────────────────────────────────────────
          4. Submit Actions
          ────────────────────────────────────────────────────────── */}
      <View style={styles.buttonSection}>
        <AppButton
          testID="silage-submit-button"
          title={isSubmitting ? 'Registering...' : 'Save Silage Sample'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
        />
        <AppButton
          testID="silage-cancel-button"
          title="Cancel"
          variant="outline"
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
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
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
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridColLayout: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  gridCol: {
    flex: 1,
  },
  gridColFull: {
    width: '100%',
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

export default AddSilageScreen;
