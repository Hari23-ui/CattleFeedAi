import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import { MonitoringStatus, StorageType, StorageUnit } from '../../models/storageUnit';
import { SensorReading } from '../../models/sensorReading';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { storageUnitService } from '../../services/storageUnitService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  FEED_STORAGE: 'Feed Storage',
  SILAGE_STORAGE: 'Silage Bunker / Pit',
  MIXED_STORAGE: 'Mixed Storage',
  OTHER: 'Other Storage',
};

const STATUS_CONFIG: Record<MonitoringStatus, { label: string; bg: string; text: string; desc: string }> = {
  MONITORING: {
    label: 'MONITORING',
    bg: '#EBF5FF',
    text: '#1E40AF',
    desc: 'Actively monitoring environmental conditions.',
  },
  NORMAL: {
    label: 'NORMAL',
    bg: '#DCFCE7',
    text: '#166534',
    desc: 'Telemetry parameters within configured thresholds.',
  },
  ATTENTION_REQUIRED: {
    label: '⚠ ATTENTION REQUIRED',
    bg: '#FEE2E2',
    text: '#991B1B',
    desc: 'Sudden temperature/pH change or threshold violation detected.',
  },
  NO_RECENT_DATA: {
    label: 'NO RECENT DATA',
    bg: '#F3F4F6',
    text: '#4B5563',
    desc: 'No telemetry received within the last 24 hours.',
  },
  OFFLINE: {
    label: 'OFFLINE',
    bg: '#FEF3C7',
    text: '#92400E',
    desc: 'Hardware device is currently unresponsive or offline.',
  },
};

export const StorageUnitDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'StorageUnitDetails'>['route']>();
  const { storageUnitId } = route.params;

  const [unit, setUnit] = useState<StorageUnit | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [unitData, historyData] = await Promise.all([
        storageUnitService.getStorageUnitById(storageUnitId),
        storageUnitService.getSensorReadings(storageUnitId).catch(() => [] as SensorReading[]),
      ]);
      setUnit(unitData);
      setHistory(historyData);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [storageUnitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatTemperature = (val?: number | null) => {
    if (val === null || val === undefined) return 'Not Available';
    return `${Number(val).toFixed(1)}°C`;
  };

  const formatPh = (val?: number | null) => {
    if (val === null || val === undefined) return 'Not Available';
    return Number(val).toFixed(2);
  };

  const formatHumidity = (val?: number | null) => {
    if (val === null || val === undefined) return 'Not Available';
    return `${Number(val).toFixed(1)}%`;
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Not Available';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading && !isRefreshing) {
    return <LoadingView message="Loading storage unit details & sensor telemetry..." />;
  }

  if (!unit) {
    return (
      <ScreenContainer>
        <ErrorMessage
          message={errorMessage || 'Storage unit not found.'}
          onRetry={fetchData}
        />
      </ScreenContainer>
    );
  }

  const statusCfg = STATUS_CONFIG[unit.monitoringStatus] || STATUS_CONFIG.MONITORING;

  return (
    <ScreenContainer
      scrollable={true}
      testID="storage-unit-details-screen"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={fetchData}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* 1. Header & Monitoring Status Card */}
      <AppCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleText}>{unit.name}</Text>
            <Text style={styles.subtext}>
              🏡 {unit.farmName || `Farm #${unit.farmId}`} • {STORAGE_TYPE_LABELS[unit.storageType]}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        <Text style={styles.statusDescription}>{statusCfg.desc}</Text>

        <View style={styles.actionButtonsRow}>
          <AppButton
            testID="record-sensor-btn"
            title="+ Ingest Telemetry"
            onPress={() => navigation.navigate('RecordSensorReading', { storageUnitId: unit.id, storageUnitName: unit.name })}
            size="small"
            style={styles.actionBtn}
          />
          <AppButton
            testID="view-alerts-btn"
            title="View Alerts"
            variant="outline"
            onPress={() => navigation.navigate('AlertList')}
            size="small"
            style={styles.actionBtn}
          />
        </View>
      </AppCard>

      {/* 2. Latest Sensor Telemetry Panel */}
      <Text style={styles.sectionTitle}>Current Sensor Readings</Text>
      <View style={styles.metricsGrid}>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricIcon}>🌡</Text>
          <Text style={styles.metricTitle}>Temperature</Text>
          <Text style={styles.metricValue}>{formatTemperature(unit.latestTemperature)}</Text>
          <Text style={styles.metricHint}>Target: 5.0°C – 35.0°C</Text>
        </AppCard>

        <AppCard style={styles.metricCard}>
          <Text style={styles.metricIcon}>🧪</Text>
          <Text style={styles.metricTitle}>pH Level</Text>
          <Text style={styles.metricValue}>{formatPh(unit.latestPh)}</Text>
          <Text style={styles.metricHint}>Target: 3.5 – 5.5</Text>
        </AppCard>
      </View>

      <View style={styles.metricsGrid}>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricIcon}>💧</Text>
          <Text style={styles.metricTitle}>Relative Humidity</Text>
          <Text style={styles.metricValue}>{formatHumidity(unit.latestHumidity)}</Text>
          <Text style={styles.metricHint}>Storage atmosphere</Text>
        </AppCard>

        <AppCard style={styles.metricCard}>
          <Text style={styles.metricIcon}>🕒</Text>
          <Text style={styles.metricTitle}>Last Updated</Text>
          <Text style={[styles.metricValue, { fontSize: 14, marginTop: 4 }]}>
            {formatTime(unit.lastReadingTime)}
          </Text>
          <Text style={styles.metricHint}>
            {unit.deviceId ? `Device: ${unit.deviceId}` : 'Manual Entry'}
          </Text>
        </AppCard>
      </View>

      {/* 3. Storage Unit Specifications */}
      <Text style={styles.sectionTitle}>Storage Unit Specifications</Text>
      <AppCard style={styles.detailsCard}>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Storage Type:</Text>
          <Text style={styles.specValue}>{STORAGE_TYPE_LABELS[unit.storageType]}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Location / Pit:</Text>
          <Text style={styles.specValue}>{unit.location || 'Not Specified'}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Capacity:</Text>
          <Text style={styles.specValue}>{unit.capacity || 'Not Specified'}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Hardware Device ID:</Text>
          <Text style={styles.specValue}>{unit.deviceId || 'No hardware device paired'}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Registered On:</Text>
          <Text style={styles.specValue}>{formatTime(unit.createdAt)}</Text>
        </View>
      </AppCard>

      {/* 4. Sensor History Table */}
      <View style={styles.historyHeaderRow}>
        <Text style={styles.sectionTitle}>Sensor Reading History</Text>
        <Text style={styles.historyCountText}>{history.length} Readings</Text>
      </View>

      {history.length === 0 ? (
        <AppCard style={styles.emptyHistoryCard}>
          <Text style={styles.emptyHistoryText}>No sensor readings recorded yet.</Text>
          <Text style={styles.emptyHistorySubtext}>
            Connect an ESP32 telemetry hardware sensor or submit a manual measurement.
          </Text>
        </AppCard>
      ) : (
        <AppCard style={styles.historyTableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, { flex: 1.8 }]}>Time</Text>
            <Text style={[styles.tableColHeader, { flex: 1.4 }]}>Temp</Text>
            <Text style={[styles.tableColHeader, { flex: 1.1 }]}>pH</Text>
            <Text style={[styles.tableColHeader, { flex: 1.1 }]}>Hum</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>Source</Text>
          </View>

          {history.map((reading, index) => {
            // Calculate delta with older consecutive reading
            const olderReading = history[index + 1];
            let tempDeltaStr = '';
            let phDeltaStr = '';

            if (olderReading && reading.temperature != null && olderReading.temperature != null) {
              const diff = Number(reading.temperature) - Number(olderReading.temperature);
              if (Math.abs(diff) >= 0.05) {
                tempDeltaStr = ` (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`;
              }
            }

            if (olderReading && reading.ph != null && olderReading.ph != null) {
              const diff = Number(reading.ph) - Number(olderReading.ph);
              if (Math.abs(diff) >= 0.05) {
                phDeltaStr = ` (${diff >= 0 ? '+' : ''}${diff.toFixed(1)})`;
              }
            }

            return (
              <View
                key={reading.id}
                style={[
                  styles.tableDataRow,
                  index % 2 === 1 && styles.tableDataRowEven,
                ]}
              >
                <Text style={[styles.tableColText, { flex: 1.8, fontSize: 11 }]}>
                  {formatTime(reading.readingTime)}
                </Text>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.tableColText}>
                    {formatTemperature(reading.temperature)}
                  </Text>
                  {tempDeltaStr ? (
                    <Text
                      style={[
                        styles.deltaText,
                        { color: tempDeltaStr.includes('+') ? '#DC2626' : '#2563EB' },
                      ]}
                    >
                      {tempDeltaStr}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flex: 1.1 }}>
                  <Text style={styles.tableColText}>
                    {formatPh(reading.ph)}
                  </Text>
                  {phDeltaStr ? (
                    <Text
                      style={[
                        styles.deltaText,
                        { color: phDeltaStr.includes('+') ? '#D97706' : '#2563EB' },
                      ]}
                    >
                      {phDeltaStr}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.tableColText, { flex: 1.1 }]}>
                  {formatHumidity(reading.humidity)}
                </Text>
                <Text style={[styles.tableColText, { flex: 1, fontSize: 11 }]}>
                  {reading.source || (reading.deviceId ? 'IOT' : 'MANUAL')}
                </Text>
              </View>
            );
          })}
        </AppCard>
      )}

      {/* 5. Scientific Boundary & Disclaimer Notice */}
      <View style={styles.boundaryCard}>
        <Text style={styles.boundaryTitle}>ℹ️ Storage Condition Monitoring Notice</Text>
        <Text style={styles.boundaryText}>
          Temperature and pH readings are environmental measurements from connected hardware sensors.
          Anomalous changes indicate potential storage conditions requiring inspection. These evaluations
          do not represent definitive veterinary diagnoses or laboratory replacements. Review physical feed
          conditions before feeding livestock.
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm * 1.2,
    paddingVertical: spacing.sm / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm / 2,
  },
  actionBtn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  metricHint: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  detailsCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm / 1.5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  specLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  historyTableCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableDataRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableColText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyHistoryCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyHistorySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  boundaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: spacing.xxl * 2,
  },
  boundaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  boundaryText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 18,
  },
});
