import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
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
import { StorageUnit, StorageType, MonitoringStatus, StorageMonitoringSummary } from '../../models/storageUnit';
import { Farm } from '../../models/farm';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { storageUnitService } from '../../services/storageUnitService';
import { farmService } from '../../services/farmService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  FEED_STORAGE: 'Feed Storage',
  SILAGE_STORAGE: 'Silage Bunker / Pit',
  MIXED_STORAGE: 'Mixed Storage',
  OTHER: 'Other Storage',
};

const STATUS_CONFIG: Record<MonitoringStatus, { label: string; bg: string; text: string }> = {
  MONITORING: { label: 'MONITORING', bg: '#EBF5FF', text: '#1E40AF' },
  NORMAL: { label: 'NORMAL', bg: '#DCFCE7', text: '#166534' },
  ATTENTION_REQUIRED: { label: '⚠ ATTENTION REQUIRED', bg: '#FEE2E2', text: '#991B1B' },
  NO_RECENT_DATA: { label: 'NO RECENT DATA', bg: '#F3F4F6', text: '#4B5563' },
  OFFLINE: { label: 'OFFLINE', bg: '#FEF3C7', text: '#92400E' },
};

export const StorageUnitListScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'StorageUnitList'>['route']>();
  const initialFarmId = route.params?.farmId;

  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [summary, setSummary] = useState<StorageMonitoringSummary | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(initialFarmId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [unitsData, farmData, summaryData] = await Promise.all([
        storageUnitService.getAllStorageUnits(selectedFarmId),
        farmService.getAllFarms().catch(() => [] as Farm[]),
        storageUnitService.getStorageMonitoringSummary().catch(() => null),
      ]);
      setUnits(unitsData);
      setFarms(farmData);
      setSummary(summaryData);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFarmId]);

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

  const handleUnitPress = (storageUnitId: number) => {
    navigation.navigate('StorageUnitDetails', { storageUnitId });
  };

  const handleAddUnit = () => {
    navigation.navigate('AddStorageUnit', { farmId: selectedFarmId });
  };

  const formatTemperature = (val?: number | null) => {
    if (val === null || val === undefined) return 'Not Available';
    return `${Number(val).toFixed(1)}°C`;
  };

  const formatPh = (val?: number | null) => {
    if (val === null || val === undefined) return 'Not Available';
    return Number(val).toFixed(2);
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Overview Metric Banner */}
      {summary && (
        <View style={styles.summaryBanner} testID="storage-summary-banner">
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{summary.totalStorageUnits}</Text>
            <Text style={styles.metricLabel}>Total Units</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: '#166534' }]}>{summary.monitoringUnits + summary.normalUnits}</Text>
            <Text style={styles.metricLabel}>Monitoring</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: summary.attentionRequiredUnits > 0 ? '#DC2626' : '#4B5563' }]}>
              {summary.attentionRequiredUnits}
            </Text>
            <Text style={styles.metricLabel}>Attention</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: '#B45309' }]}>{summary.offlineUnits}</Text>
            <Text style={styles.metricLabel}>Offline</Text>
          </View>
        </View>
      )}

      {/* Farm Filter Chips */}
      {farms.length > 1 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Farm:</Text>
          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[styles.chip, !selectedFarmId && styles.chipActive]}
              onPress={() => setSelectedFarmId(undefined)}
            >
              <Text style={[styles.chipText, !selectedFarmId && styles.chipTextActive]}>All Farms</Text>
            </TouchableOpacity>
            {farms.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.chip, selectedFarmId === f.id && styles.chipActive]}
                onPress={() => setSelectedFarmId(f.id)}
              >
                <Text style={[styles.chipText, selectedFarmId === f.id && styles.chipTextActive]}>
                  {f.farmName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.listHeaderRow}>
        <Text style={styles.listTitle}>
          Storage Units ({units.length})
        </Text>
        <AppButton
          testID="add-storage-unit-btn"
          title="+ Add Storage Unit"
          onPress={handleAddUnit}
          size="small"
        />
      </View>
    </View>
  );

  const renderStorageCard = ({ item }: { item: StorageUnit }) => {
    const statusCfg = STATUS_CONFIG[item.monitoringStatus] || STATUS_CONFIG.MONITORING;
    const hasAlerts = (item.unreadAlertCount ?? 0) > 0;

    return (
      <AppCard
        testID={`storage-card-${item.id}`}
        style={styles.card}
        onPress={() => handleUnitPress(item.id)}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {hasAlerts && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>🔔 {item.unreadAlertCount} Alert{item.unreadAlertCount! > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <Text style={styles.farmSubtext}>
          🏡 {item.farmName || `Farm #${item.farmId}`} • {STORAGE_TYPE_LABELS[item.storageType]}
        </Text>
        {item.location ? <Text style={styles.locationSubtext}>📍 {item.location}</Text> : null}

        {/* Telemetry Metrics Row */}
        <View style={styles.telemetryRow}>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Temperature</Text>
            <Text style={styles.telemetryVal}>{formatTemperature(item.latestTemperature)}</Text>
          </View>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>pH Level</Text>
            <Text style={styles.telemetryVal}>{formatPh(item.latestPh)}</Text>
          </View>
          <View style={styles.telemetryBox}>
            <Text style={styles.telemetryLabel}>Last Reading</Text>
            <Text style={styles.telemetrySubVal}>{formatTime(item.lastReadingTime)}</Text>
          </View>
        </View>

        {/* Device Information Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.deviceText}>
            Hardware: {item.deviceId ? `📶 ${item.deviceId}` : 'Manual Entry'}
          </Text>
          <Text style={styles.detailsArrow}>View Details →</Text>
        </View>
      </AppCard>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer} testID="storage-empty-state">
        <Text style={styles.emptyIcon}>🌡</Text>
        <Text style={styles.emptyTitle}>No Storage Units Monitored</Text>
        <Text style={styles.emptySubtitle}>
          Register your feed silos, silage pits, and bunkers to ingest hardware telemetry and receive condition change alerts.
        </Text>
        <AppButton
          title="Register First Storage Unit"
          onPress={handleAddUnit}
          style={styles.emptyBtn}
        />
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return <LoadingView message="Loading storage units & sensor telemetry..." />;
  }

  return (
    <ScreenContainer scrollable={false} testID="storage-unit-list-screen">
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={fetchData}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      <FlatList
        data={units}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderStorageCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm / 1.5,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm / 2,
  },
  nameRow: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
  farmSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  locationSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  telemetryRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm * 1.2,
    marginTop: spacing.sm,
    justifyContent: 'space-between',
  },
  telemetryBox: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  telemetryVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  telemetrySubVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deviceText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailsArrow: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    minWidth: 200,
  },
});
