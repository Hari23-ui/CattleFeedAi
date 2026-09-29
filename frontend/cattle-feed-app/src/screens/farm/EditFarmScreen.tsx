import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  AppInput,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { UpdateFarmRequest } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';
import { validateFarmForm } from '../../utils/validation';

export const EditFarmScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'EditFarm'>['route']>();
  const { farmId } = route.params;

  const [form, setForm] = useState<UpdateFarmRequest>({
    farmName: '',
    location: '',
    district: '',
    state: '',
    pincode: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateFarmRequest, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const loadFarm = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const farm = await farmService.getFarmById(farmId);
      setForm({
        farmName: farm.farmName,
        location: farm.location || '',
        district: farm.district || '',
        state: farm.state || '',
        pincode: farm.pincode || '',
      });
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  const handleChange = (field: keyof UpdateFarmRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handleSubmit = async () => {
    const validation = validateFarmForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const payload: UpdateFarmRequest = {
        farmName: form.farmName.trim(),
        location: form.location?.trim() || undefined,
        district: form.district?.trim() || undefined,
        state: form.state?.trim() || undefined,
        pincode: form.pincode?.trim() || undefined,
      };

      await farmService.updateFarm(farmId, payload);
      navigation.goBack();
    } catch (err) {
      setApiError(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Loading farm details..." />;
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Edit Farm Profile</Text>
      <Text style={styles.screenSubtitle}>
        Update location and identification details for this farm.
      </Text>

      {apiError && (
        <ErrorMessage
          testID="edit-farm-error"
          message={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      <AppCard style={styles.card}>
        <AppInput
          testID="edit-farm-name-input"
          label="Farm Name *"
          placeholder="e.g. Green Pastures Dairy"
          value={form.farmName}
          onChangeText={(text) => handleChange('farmName', text)}
          error={errors.farmName}
          autoCapitalize="words"
          accessibilityLabel="Farm Name"
        />

        <AppInput
          testID="edit-farm-location-input"
          label="Village / Town / Address"
          placeholder="e.g. Village Rampur, Post Box 12"
          value={form.location || ''}
          onChangeText={(text) => handleChange('location', text)}
          error={errors.location}
          autoCapitalize="sentences"
          accessibilityLabel="Farm Location"
        />

        <AppInput
          testID="edit-farm-district-input"
          label="District"
          placeholder="e.g. Anand"
          value={form.district || ''}
          onChangeText={(text) => handleChange('district', text)}
          error={errors.district}
          autoCapitalize="words"
          accessibilityLabel="District"
        />

        <AppInput
          testID="edit-farm-state-input"
          label="State"
          placeholder="e.g. Gujarat"
          value={form.state || ''}
          onChangeText={(text) => handleChange('state', text)}
          error={errors.state}
          autoCapitalize="words"
          accessibilityLabel="State"
        />

        <AppInput
          testID="edit-farm-pincode-input"
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
            testID="save-farm-button"
            title="Save Changes"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="Save Changes"
            style={styles.saveButton}
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
  saveButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

export default EditFarmScreen;
