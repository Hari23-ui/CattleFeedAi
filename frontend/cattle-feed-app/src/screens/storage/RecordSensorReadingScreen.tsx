import React, { useState } from 'react';
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
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { SensorSource } from '../../models/sensorReading';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { storageUnitService } from '../../services/storageUnitService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const RecordSensorReadingScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'RecordSensorReading'>['route']>();
  const { storageUnitId, storageUnitName } = route.params;

  const [deviceId, setDeviceId] = useState<string>('ESP32-STORAGE-001');
  const [temperature, setTemperature] = useState<string>('');
  const [ph, setPh] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [source, setSource] = useState<SensorSource>('IOT');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validate inputs if provided
    let parsedTemp: number | null = null;
    let parsedPh: number | null = null;
    let parsedHumidity: number | null = null;

    if (temperature.trim()) {
      const num = parseFloat(temperature.trim());
      if (isNaN(num)) {
        setErrorMessage('Temperature must be a valid number (e.g. 28.4)');
        return;
      }
      parsedTemp = num;
    }

    if (ph.trim()) {
      const num = parseFloat(ph.trim());
      if (isNaN(num) || num < 0 || num > 14) {
        setErrorMessage('pH must be a valid number between 0 and 14 (e.g. 4.2)');
        return;
      }
      parsedPh = num;
    }

    if (humidity.trim()) {
      const num = parseFloat(humidity.trim());
      if (isNaN(num) || num < 0 || num > 100) {
        setErrorMessage('Humidity must be a percentage between 0 and 100 (e.g. 65.0)');
        return;
      }
      parsedHumidity = num;
    }

    if (parsedTemp === null && parsedPh === null && parsedHumidity === null) {
      setErrorMessage('Please provide at least one sensor measurement (Temperature, pH, or Humidity).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await storageUnitService.recordSensorReading(storageUnitId, {
        deviceId: deviceId.trim() || undefined,
        temperature: parsedTemp,
        ph: parsedPh,
        humidity: parsedHumidity,
        source,
      });

      navigation.goBack();
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="record-sensor-reading-screen">
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Target Storage Unit Header */}
      <AppCard style={styles.card}>
        <Text style={styles.cardTitle}>Target Storage Unit</Text>
        <Text style={styles.unitNameText}>{storageUnitName || `Storage Unit #${storageUnitId}`}</Text>
        <Text style={styles.unitDesc}>
          Telemetry data submitted here will be evaluated against configured thresholds to detect rapid condition changes.
        </Text>
      </AppCard>

      {/* Sensor Ingestion Parameters */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionHeader}>Sensor Telemetry Payload</Text>

        <Text style={styles.inputLabel}>Device Identifier</Text>
        <TextInput
          testID="sensor-device-input"
          style={styles.textInput}
          placeholder="e.g. ESP32-STORAGE-001"
          placeholderTextColor="#9CA3AF"
          value={deviceId}
          onChangeText={setDeviceId}
        />

        <Text style={styles.inputLabel}>Temperature (°C)</Text>
        <TextInput
          testID="sensor-temp-input"
          style={styles.textInput}
          placeholder="e.g. 28.4"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={temperature}
          onChangeText={setTemperature}
        />
        <Text style={styles.fieldHint}>Normal baseline: 5.0°C – 35.0°C. Sudden change alert triggers at ±3.0°C.</Text>

        <Text style={styles.inputLabel}>pH Measurement</Text>
        <TextInput
          testID="sensor-ph-input"
          style={styles.textInput}
          placeholder="e.g. 4.2"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={ph}
          onChangeText={setPh}
        />
        <Text style={styles.fieldHint}>Normal silage pH: 3.5 – 5.5. Sudden change alert triggers at ±0.5.</Text>

        <Text style={styles.inputLabel}>Relative Humidity (%) (Optional)</Text>
        <TextInput
          testID="sensor-humidity-input"
          style={styles.textInput}
          placeholder="e.g. 65.0"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={humidity}
          onChangeText={setHumidity}
        />

        {/* Source Radio Buttons */}
        <Text style={styles.inputLabel}>Data Source</Text>
        <View style={styles.sourceRow}>
          <TouchableOpacity
            testID="source-opt-iot"
            style={[styles.sourceOpt, source === 'IOT' && styles.sourceOptActive]}
            onPress={() => setSource('IOT')}
          >
            <Text style={[styles.sourceText, source === 'IOT' && styles.sourceTextActive]}>
              📶 Hardware / IoT (ESP32)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="source-opt-manual"
            style={[styles.sourceOpt, source === 'MANUAL' && styles.sourceOptActive]}
            onPress={() => setSource('MANUAL')}
          >
            <Text style={[styles.sourceText, source === 'MANUAL' && styles.sourceTextActive]}>
              ✍️ Manual Reading
            </Text>
          </TouchableOpacity>
        </View>
      </AppCard>

      <AppButton
        testID="submit-telemetry-btn"
        title={isSubmitting ? 'Ingesting Reading...' : 'Submit Sensor Telemetry'}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitBtn}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  unitNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  unitDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
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
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sourceOpt: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sourceOptActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  sourceText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sourceTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl * 2,
  },
});
