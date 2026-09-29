import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Alert } from '../../models/alert';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { storageUnitService } from '../../services/storageUnitService';
import { alertService } from '../../services/alertService';
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

  // Judge Demo & Storage Alerts State
  const [unitAlerts, setUnitAlerts] = useState<Alert[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [unitData, historyData, allAlerts] = await Promise.all([
        storageUnitService.getStorageUnitById(storageUnitId),
        storageUnitService.getSensorReadings(storageUnitId).catch(() => [] as SensorReading[]),
        alertService.getAlerts().catch(() => [] as Alert[]),
      ]);
      setUnit(unitData);
      setHistory(historyData);
      const filtered = allAlerts.filter(
        (a) => a.relatedEntityType === 'STORAGE_UNIT' && Number(a.relatedEntityId) === Number(storageUnitId)
      );
      setUnitAlerts(filtered);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [storageUnitId]);

  const handleSimulateTelemetry = async (temp: number, ph: number, humidity: number, label: string) => {
    try {
      setSimulating(true);
      setErrorMessage(null);
      setSimulationSuccess(null);

      await storageUnitService.recordSensorReading(storageUnitId, {
        temperature: temp,
        ph: ph,
        humidity: humidity,
        readingTime: new Date().toISOString(),
      });

      setSimulationSuccess(`Telemetry ingested via backend API: ${label}. Condition evaluated by StorageMonitoringService.`);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setSimulating(false);
    }
  };

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

      {/* Telemetry Classification & Judge Simulation Panel */}
      <AppCard style={styles.demoSimCard}>
        <View style={styles.demoSimHeader}>
          {unit.deviceId === 'ESP32-DEMO-001' || unit.name?.toLowerCase().includes('demo') ? (
            <View style={styles.demoTag}>
              <Text style={styles.demoTagText}>DEMO TELEMETRY • ESP32-DEMO-001</Text>
            </View>
          ) : (
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>LIVE IOT TELEMETRY • {unit.deviceId || 'MANUAL SENSOR'}</Text>
            </View>
          )}
          <Text style={styles.demoSimTitle}>Evaluator Simulation Pipeline</Text>
        </View>

        <Text style={styles.demoSimNotice}>
          Hardware Ready: The current project is ready for physical ESP32 connection; in software demo testing,
          simulated telemetry passes through the exact same backend ingestion API, monitoring engine, and India DLT SMS architecture.
        </Text>

        {simulationSuccess && (
          <View style={styles.simSuccessBanner}>
            <Text style={styles.simSuccessText}>{simulationSuccess}</Text>
          </View>
        )}

        <Text style={styles.simSubheader}>Inject Test Telemetry via Backend Engine:</Text>
        <View style={styles.simButtonsRow}>
          <TouchableOpacity
            style={styles.simChipNormal}
            onPress={() => handleSimulateTelemetry(24.0, 4.0, 65.0, 'Normal (24°C, pH 4.0)')}
            disabled={simulating}
            activeOpacity={0.8}
            testID="sim-normal-btn"
          >
            <Text style={styles.simChipTextNormal}>🟢 Normal (24°C, pH 4.0)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simChipWarn}
            onPress={() => handleSimulateTelemetry(35.8, 4.2, 70.0, 'Elevated Temp (35.8°C)')}
            disabled={simulating}
            activeOpacity={0.8}
            testID="sim-temp-anomaly-btn"
          >
            <Text style={styles.simChipTextWarn}>⚠️ Temp Rise (35.8°C)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.simButtonsRow}>
          <TouchableOpacity
            style={styles.simChipWarn}
            onPress={() => handleSimulateTelemetry(26.0, 5.8, 68.0, 'Abnormal pH (5.8)')}
            disabled={simulating}
            activeOpacity={0.8}
            testID="sim-ph-anomaly-btn"
          >
            <Text style={styles.simChipTextWarn}>⚠️ High pH (5.8)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.simChipDanger}
            onPress={() => handleSimulateTelemetry(Number(unit.latestTemperature || 25) + 6.0, 4.5, 75.0, 'Sudden Rise (+6°C)')}
            disabled={simulating}
            activeOpacity={0.8}
            testID="sim-rapid-heat-btn"
          >
            <Text style={styles.simChipTextDanger}>🔥 Rapid Rise (+6°C)</Text>
          </TouchableOpacity>
        </View>

        {simulating && (
          <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              Ingesting telemetry and evaluating monitoring thresholds...
            </Text>
          </View>
        )}
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

      {/* 5. Recent Storage Condition Alerts */}
      <Text style={styles.sectionTitle}>Recent Condition Alerts ({unitAlerts.length})</Text>
      {unitAlerts.length === 0 ? (
        <AppCard style={styles.emptyAlertsCard}>
          <Text style={styles.emptyAlertsText}>
            ✅ No active condition alerts recorded for this storage unit. Monitored parameters are within normal baseline thresholds.
          </Text>
        </AppCard>
      ) : (
        unitAlerts.slice(0, 5).map((alert) => (
          <AppCard key={alert.id} style={styles.alertCardItem}>
            <View style={styles.alertHeaderRow}>
              <View
                style={[
                  styles.severityBadge,
                  alert.severity === 'CRITICAL' ? styles.severityCritical : styles.severityWarning,
                ]}
              >
                <Text style={styles.severityBadgeText}>{alert.severity}</Text>
              </View>
              <Text style={styles.alertTimeText}>{formatTime(alert.createdAt)}</Text>
            </View>
            <Text style={styles.alertCardTitle}>{alert.title}</Text>
            <Text style={styles.alertCardMessage}>{alert.message}</Text>
            <Text style={styles.alertComplianceNotice}>
              Safe Advisory: Storage condition change detected. Please inspect temperature, humidity, and ventilation.
            </Text>
          </AppCard>
        ))
      )}

      {/* 6. Scientific Boundary & Disclaimer Notice */}
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
  demoSimCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: spacing.lg,
  },
  demoSimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  demoTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  demoTagText: {
    color: '#1E40AF',
    fontSize: 10,
    fontWeight: '700',
  },
  liveTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  liveTagText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '600',
  },
  demoSimTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  demoSimNotice: {
    fontSize: 11,
    color: '#2563EB',
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  simSuccessBanner: {
    backgroundColor: '#DCFCE7',
    padding: spacing.sm,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: spacing.sm,
  },
  simSuccessText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
  },
  simSubheader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: spacing.xs,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  simChipNormal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  simChipTextNormal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  simChipWarn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EA580C',
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  simChipTextWarn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  simChipDanger: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  simChipTextDanger: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  emptyAlertsCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyAlertsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  alertCardItem: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  severityWarning: {
    backgroundColor: '#FEF3C7',
  },
  severityCritical: {
    backgroundColor: '#FEE2E2',
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  alertTimeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  alertCardMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  alertComplianceNotice: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
