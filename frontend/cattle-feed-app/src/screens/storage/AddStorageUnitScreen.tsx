import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
import { StorageType } from '../../models/storageUnit';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { storageUnitService } from '../../services/storageUnitService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const STORAGE_TYPES: { type: StorageType; label: string; desc: string }[] = [
  { type: 'SILAGE_STORAGE', label: 'Silage Bunker / Pit', desc: 'Fermented silage clamps, bunkers, or plastic wrapped pits.' },
  { type: 'FEED_STORAGE', label: 'Feed Silo / Storage Room', desc: 'Dry grain bins, pellet silos, concentrate storage.' },
  { type: 'MIXED_STORAGE', label: 'Mixed Feed & Silage', desc: 'Combined multi-commodity feed store.' },
  { type: 'OTHER', label: 'Other Storage Container', desc: 'Temporary bags, drums, or auxiliary feed containers.' },
];

export const AddStorageUnitScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AddStorageUnit'>['route']>();
  const defaultFarmId = route.params?.farmId;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(defaultFarmId);
  const [name, setName] = useState<string>('');
  const [storageType, setStorageType] = useState<StorageType>('SILAGE_STORAGE');
  const [location, setLocation] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');

  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    farmService.getAllFarms()
      .then((data) => {
        setFarms(data);
        if (!selectedFarmId && data.length > 0) {
          setSelectedFarmId(data[0].id);
        }
      })
      .catch((err) => setErrorMessage(getFarmerFriendlyErrorMessage(err)))
      .finally(() => setIsLoadingFarms(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedFarmId) {
      setErrorMessage('Please select a farm.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Storage unit name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const created = await storageUnitService.createStorageUnit({
        farmId: selectedFarmId,
        name: name.trim(),
        storageType,
        location: location.trim() || undefined,
        capacity: capacity.trim() || undefined,
        deviceId: deviceId.trim() || undefined,
      });

      navigation.replace('StorageUnitDetails', { storageUnitId: created.id });
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  if (isLoadingFarms) {
    return <LoadingView message="Loading farms..." />;
  }

  return (
    <ScreenContainer scrollable={true} testID="add-storage-unit-screen">
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Farm Selection */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>1. Target Farm *</Text>
        <Text style={styles.sectionSubtitle}>
          Select which of your owned farms this storage unit belongs to.
        </Text>

        <View style={styles.farmChipsRow}>
          {farms.map((f) => (
            <TouchableOpacity
              key={f.id}
              testID={`farm-chip-${f.id}`}
              style={[
                styles.farmChip,
                selectedFarmId === f.id && styles.farmChipSelected,
              ]}
              onPress={() => setSelectedFarmId(f.id)}
            >
              <Text
                style={[
                  styles.farmChipText,
                  selectedFarmId === f.id && styles.farmChipTextSelected,
                ]}
              >
                🏡 {f.farmName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppCard>

      {/* Storage Type */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>2. Storage Type *</Text>
        <View style={styles.typeList}>
          {STORAGE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.type}
              testID={`type-opt-${t.type}`}
              style={[
                styles.typeOption,
                storageType === t.type && styles.typeOptionSelected,
              ]}
              onPress={() => setStorageType(t.type)}
            >
              <View style={styles.typeRadio}>
                {storageType === t.type && <View style={styles.typeRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeLabel}>{t.label}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </AppCard>

      {/* Specifications */}
      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. Storage Unit Details</Text>

        <Text style={styles.inputLabel}>Storage Unit Name *</Text>
        <TextInput
          testID="storage-name-input"
          style={styles.textInput}
          placeholder="e.g. Maize Silage Bunker 01, North Pit"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Location / Sector (Optional)</Text>
        <TextInput
          testID="storage-location-input"
          style={styles.textInput}
          placeholder="e.g. North Field Sector 2, Barn East"
          placeholderTextColor="#9CA3AF"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.inputLabel}>Storage Capacity (Optional)</Text>
        <TextInput
          testID="storage-capacity-input"
          style={styles.textInput}
          placeholder="e.g. 50 Metric Tons, 2000 Quintals"
          placeholderTextColor="#9CA3AF"
          value={capacity}
          onChangeText={setCapacity}
        />

        <Text style={styles.inputLabel}>Hardware Sensor Device ID (Optional)</Text>
        <TextInput
          testID="storage-device-input"
          style={styles.textInput}
          placeholder="e.g. ESP32-STORAGE-001"
          placeholderTextColor="#9CA3AF"
          value={deviceId}
          onChangeText={setDeviceId}
        />
        <Text style={styles.fieldHint}>
          If an ESP32 or wireless IoT sensor is deployed in this bunker, enter its device identifier.
        </Text>
      </AppCard>

      <AppButton
        testID="submit-storage-unit-btn"
        title={isSubmitting ? 'Registering...' : 'Register Storage Unit'}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitBtn}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  farmChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  farmChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  farmChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  farmChipText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  farmChipTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  typeList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm * 1.2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  typeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  typeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm * 1.2,
    fontSize: 14,
    color: colors.textPrimary,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl * 2,
  },
});
