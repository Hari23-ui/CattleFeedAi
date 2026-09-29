import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  AppInput,
  ErrorMessage,
  ScreenContainer,
} from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { CreateFarmRequest } from '../../models/farm';
import { AppNavigationProp } from '../../navigation/types';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateFarmForm } from '../../utils/validation';

export const AddFarmScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();

  const [form, setForm] = useState<CreateFarmRequest>({
    farmName: '',
    location: '',
    district: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateFarmRequest, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (field: keyof CreateFarmRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handleSubmit = async () => {
    // Validate form locally
    const validation = validateFarmForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload: CreateFarmRequest = {
        farmName: form.farmName.trim(),
        location: form.location?.trim() || undefined,
        district: form.district?.trim() || undefined,
        state: form.state?.trim() || undefined,
        pincode: form.pincode?.trim() || undefined,
      };

      const createdFarm = await farmService.createFarm(payload);

      // Navigate to Farm Details for the newly created farm
      navigation.replace('FarmDetails', { farmId: createdFarm.id });
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Register New Farm</Text>
      <Text style={styles.screenSubtitle}>
        Add details about your dairy farm location. You can register multiple farms.
      </Text>

      {apiError && (
        <ErrorMessage
          testID="add-farm-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      <AppCard style={styles.card}>
        <AppInput
          testID="farm-name-input"
          label="Farm Name *"
          placeholder="e.g. Green Pastures Dairy"
          value={form.farmName}
          onChangeText={(text) => handleChange('farmName', text)}
          error={errors.farmName}
          autoCapitalize="words"
          accessibilityLabel="Farm Name"
        />

        <AppInput
          testID="farm-location-input"
          label="Village / Town / Address"
          placeholder="e.g. Village Rampur, Post Box 12"
          value={form.location || ''}
          onChangeText={(text) => handleChange('location', text)}
          error={errors.location}
          autoCapitalize="sentences"
          accessibilityLabel="Farm Location"
        />

        <AppInput
          testID="farm-district-input"
          label="District"
          placeholder="e.g. Anand"
          value={form.district || ''}
          onChangeText={(text) => handleChange('district', text)}
          error={errors.district}
          autoCapitalize="words"
          accessibilityLabel="District"
        />

        <AppInput
          testID="farm-state-input"
          label="State"
          placeholder="e.g. Gujarat"
          value={form.state || ''}
          onChangeText={(text) => handleChange('state', text)}
          error={errors.state}
          autoCapitalize="words"
          accessibilityLabel="State"
        />

        <AppInput
          testID="farm-pincode-input"
          label="Pincode"
          placeholder="e.g. 388001"
          value={form.pincode || ''}
          onChangeText={(text) => handleChange('pincode', text)}
          error={errors.pincode}
          keyboardType="numeric"
          accessibilityLabel="Pincode"
        />

        <View style={styles.buttonSection}>
          <AppButton
            testID="submit-farm-button"
            title="Create Farm"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="Create Farm"
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
      </AppCard>
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
    padding: spacing.lg,
  },
  buttonSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  submitButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

export default AddFarmScreen;
