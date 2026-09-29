import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { AppNavigationProp } from '../../navigation/types';
import { farmService } from '../../services/farmService';
import { animalService } from '../../services/animalService';
import { feedService } from '../../services/feedService';
import { silageService } from '../../services/silageService';
import { alertService } from '../../services/alertService';
import { feedPlanService } from '../../services/feedPlanService';
import { analyticsService } from '../../services/analyticsService';
import { consultationService } from '../../services/consultationService';
import { storageUnitService } from '../../services/storageUnitService';
import { FeedPlan } from '../../models/feedPlan';
import { Alert } from '../../models/alert';
import { FarmAnalyticsSummary } from '../../models/analytics';
import { ConsultationResponse } from '../../models/consultation';
import { StorageMonitoringSummary } from '../../models/storageUnit';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { user, logout, isLoading: isAuthLoading } = useAuth();

  // Live Counts & State
  const [farmCount, setFarmCount] = useState<number | null>(null);
  const [animalCount, setAnimalCount] = useState<number | null>(null);
  const [feedCount, setFeedCount] = useState<number | null>(null);
  const [silageCount, setSilageCount] = useState<number | null>(null);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [feedPlans, setFeedPlans] = useState<FeedPlan[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<FarmAnalyticsSummary | null>(null);
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([]);
  const [storageSummary, setStorageSummary] = useState<StorageMonitoringSummary | null>(null);

  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [
        farms,
        animals,
        feeds,
        silages,
        unreadAlertsRes,
        alertsList,
        plans,
        analytics,
        consultationList,
        storageSum,
      ] = await Promise.all([
        farmService.getAllFarms().catch(() => []),
        animalService.getAllAnimals().catch(() => []),
        feedService.getAllFeedSamples().catch(() => []),
        silageService.getAllSilageSamples().catch(() => []),
        alertService.getUnreadCount().catch(() => ({ unreadCount: 0 })),
        alertService.getAlerts().catch(() => [] as Alert[]),
        feedPlanService.getAllFeedPlans().catch(() => [] as FeedPlan[]),
        analyticsService.getFarmSummary().catch(() => null),
        consultationService.getConsultations().catch(() => [] as ConsultationResponse[]),
        storageUnitService.getStorageMonitoringSummary().catch(() => null),
      ]);

      setFarmCount(farms.length);
      setAnimalCount(animals.length);
      setFeedCount(feeds.length);
      setSilageCount(silages.length);
      setUnreadAlertCount(unreadAlertsRes.unreadCount ?? 0);
      setRecentAlerts(alertsList.slice(0, 2));
      setFeedPlans(plans);
      setAnalyticsSummary(analytics);
      setConsultations(consultationList);
      setStorageSummary(storageSum);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoadingCounts(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refetch counts whenever dashboard comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    return unsubscribe;
  }, [navigation, fetchDashboardData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Navigation Handlers
  const handleOpenFarms = () => navigation.navigate('FarmList');
  const handleOpenAnimals = () => navigation.navigate('AnimalList');
  const handleOpenFeed = () => navigation.navigate('FeedList');
  const handleOpenSilage = () => navigation.navigate('SilageList');
  const handleOpenFeedPlans = () => navigation.navigate('FeedPlanList');
  const handleOpenAlerts = () => navigation.navigate('AlertList');
  const handleOpenConsultations = () => navigation.navigate('ConsultationList');
  const handleOpenAnalytics = () => navigation.navigate('AnalyticsDashboard');
  const handleOpenAdvisories = () => navigation.navigate('AdvisoryList');

  const handleAddFarm = () => navigation.navigate('AddFarm');
  const handleAddAnimal = () => navigation.navigate('AddAnimal');
  const handleAddFeed = () => navigation.navigate('AddFeed');
  const handleAddSilage = () => navigation.navigate('AddSilage');
  const handleAddFeedPlan = () => navigation.navigate('AddFeedPlan');
  const handleOpenTestResults = () => navigation.navigate('TestResultList');
  const handleOpenStorageUnits = () => navigation.navigate('StorageUnitList');

  const activePlans = feedPlans.filter((p) => (p.status || '').toUpperCase() === 'ACTIVE');

  return (
    <ScreenContainer
      scrollable={true}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* 1. Header & Live Notification Indicator */}
      <View style={styles.welcomeBanner}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarText}>🐄</Text>
        </View>
        <View style={styles.welcomeTextGroup}>
          <Text style={styles.greeting}>Welcome, Farmer</Text>
          <Text style={styles.userEmail}>{user?.email || 'Authenticated User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'FARMER'}</Text>
          </View>
        </View>

        {/* Live Unread Notification Bell Button */}
        <TouchableOpacity
          testID="dashboard-notification-bell"
          style={styles.notificationBellButton}
          onPress={handleOpenAlerts}
          accessibilityLabel={`Notifications: ${unreadAlertCount !== null ? unreadAlertCount : 0} unread. Tap to open alerts.`}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadAlertCount !== null && unreadAlertCount > 0 && (
            <View style={styles.unreadBadge} testID="dashboard-unread-badge">
              <Text style={styles.unreadBadgeText} testID="dashboard-unread-count">
                {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <ErrorMessage
          testID="dashboard-error"
          message={errorMessage}
          onRetry={fetchDashboardData}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* 2. Farm & Herd Overview */}
      <View style={styles.overviewSection}>
        <Text style={styles.sectionHeader}>Farm & Herd Overview</Text>

        <View style={styles.gridRow}>
          {/* Farms Card */}
          <AppCard
            testID="dashboard-farms-card"
            style={styles.summaryCard}
            onPress={handleOpenFarms}
            accessibilityLabel={`My Farms: ${farmCount !== null ? farmCount : 'Loading'}. Tap to manage.`}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.summaryIcon}>🏡</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText} testID="dashboard-farm-count">
                  {isLoadingCounts && farmCount === null ? '...' : farmCount ?? 0}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryTitle}>My Farms</Text>
            <Text style={styles.summarySubtitle}>Manage dairy locations</Text>
          </AppCard>

          {/* Animals Card */}
          <AppCard
            testID="dashboard-animals-card"
            style={styles.summaryCard}
            onPress={handleOpenAnimals}
            accessibilityLabel={`My Livestock: ${animalCount !== null ? animalCount : 'Loading'}. Tap to manage.`}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.summaryIcon}>🐄</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText} testID="dashboard-animal-count">
                  {isLoadingCounts && animalCount === null ? '...' : animalCount ?? 0}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryTitle}>My Livestock</Text>
            <Text style={styles.summarySubtitle}>Tags, breeds & lactation</Text>
          </AppCard>
        </View>

        {/* 3. Feed & Silage Counts Row */}
        <View style={styles.gridRow}>
          {/* Feed Samples Card */}
          <AppCard
            testID="dashboard-feed-card"
            style={styles.summaryCard}
            onPress={handleOpenFeed}
            accessibilityLabel={`Feed Samples: ${feedCount !== null ? feedCount : 'Loading'}. Tap to manage.`}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.summaryIcon}>🌾</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {isLoadingCounts && feedCount === null ? '...' : feedCount ?? 0}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryTitle}>Feed Samples</Text>
            <Text style={styles.summarySubtitle}>Pellets, mash & fodder</Text>
          </AppCard>

          {/* Silage Samples Card */}
          <AppCard
            testID="dashboard-silage-card"
            style={styles.summaryCard}
            onPress={handleOpenSilage}
            accessibilityLabel={`Silage Samples: ${silageCount !== null ? silageCount : 'Loading'}. Tap to manage.`}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.summaryIcon}>🌿</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {isLoadingCounts && silageCount === null ? '...' : silageCount ?? 0}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryTitle}>Silage Samples</Text>
            <Text style={styles.summarySubtitle}>Maize, pit & bunker bales</Text>
          </AppCard>
        </View>

        {/* Quick Management Buttons */}
        <View style={styles.quickActionRow}>
          <AppButton
            testID="dashboard-add-farm-button"
            title="+ Add Farm"
            variant="outline"
            size="small"
            onPress={handleAddFarm}
            style={styles.quickButton}
          />
          <AppButton
            testID="dashboard-add-animal-button"
            title="+ Add Animal"
            variant="outline"
            size="small"
            onPress={handleAddAnimal}
            style={styles.quickButton}
          />
        </View>
        <View style={styles.quickActionRow}>
          <AppButton
            title="+ Add Feed"
            variant="outline"
            size="small"
            onPress={handleAddFeed}
            style={styles.quickButton}
          />
          <AppButton
            title="+ Add Silage"
            variant="outline"
            size="small"
            onPress={handleAddSilage}
            style={styles.quickButton}
          />
        </View>
      </View>

      {/* 4. Quality & Risk Summary (M6.4) */}
      <Text style={styles.sectionHeader}>Quality & Risk Overview</Text>
      <AppCard
        testID="dashboard-m64-module"
        style={styles.moduleCard}
        onPress={handleOpenAdvisories}
        accessibilityLabel="Quality and Risk Advisories Module, Active. Tap to open."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>🛡️</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Quality & Risk Advisories</Text>
            <Text style={styles.moduleSub}>
              {analyticsSummary
                ? `${analyticsSummary.totalActiveAdvisories ?? 0} active advisory recommendations`
                : 'Rule-derived safety screening & prioritized recommendations'}
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        </View>

        {analyticsSummary && (
          <View style={styles.riskBadgeRow}>
            <View style={[styles.miniStatBadge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.miniStatLabel, { color: '#2E7D32' }]}>Safe / Good</Text>
              <Text style={[styles.miniStatValue, { color: '#2E7D32' }]}>
                {analyticsSummary.qualityStatusDistribution?.GOOD ??
                  analyticsSummary.qualityStatusDistribution?.SAFE ??
                  0}
              </Text>
            </View>
            <View style={[styles.miniStatBadge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.miniStatLabel, { color: '#E65100' }]}>Attention</Text>
              <Text style={[styles.miniStatValue, { color: '#E65100' }]}>
                {analyticsSummary.qualityStatusDistribution?.NEEDS_ATTENTION ??
                  analyticsSummary.qualityStatusDistribution?.CAUTION ??
                  0}
              </Text>
            </View>
            <View style={[styles.miniStatBadge, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.miniStatLabel, { color: '#C62828' }]}>Unsafe / High Risk</Text>
              <Text style={[styles.miniStatValue, { color: '#C62828' }]}>
                {analyticsSummary.qualityStatusDistribution?.UNSAFE ??
                  analyticsSummary.riskDistribution?.HIGH ??
                  0}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          <AppButton
            title="View Advisories"
            variant="outline"
            size="small"
            onPress={handleOpenAdvisories}
            style={styles.quickButton}
          />
          <AppButton
            title="Test Results"
            variant="outline"
            size="small"
            onPress={handleOpenTestResults}
            style={styles.quickButton}
          />
        </View>
      </AppCard>

      {/* 5. Feed Planning Section (M11) */}
      <Text style={styles.sectionHeader}>Feed Planning & Management</Text>
      <AppCard
        testID="dashboard-feed-plans-card"
        style={styles.moduleCard}
        onPress={handleOpenFeedPlans}
        accessibilityLabel="Feed Planning Module. Tap to view active feed plans."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>📋</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Herd Feed Plans</Text>
            <Text style={styles.moduleSub}>
              {activePlans.length > 0
                ? `${activePlans.length} active plan${activePlans.length > 1 ? 's' : ''} currently running`
                : 'Plan rations, schedules & monitor nutrition context'}
            </Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
            <Text style={[styles.activeBadgeText, { color: '#2E7D32' }]}>
              {activePlans.length} ACTIVE
            </Text>
          </View>
        </View>

        {activePlans.length > 0 ? (
          <View style={styles.previewList}>
            {activePlans.slice(0, 2).map((plan) => (
              <View key={plan.id} style={styles.previewItem}>
                <Text style={styles.previewItemTitle}>• {plan.planName}</Text>
                <Text style={styles.previewItemSub}>
                  🐄 {plan.animal?.animalTag || 'Animal'} | {plan.plannedQuantity ? `${plan.plannedQuantity} kg` : ''}{' '}
                  {plan.frequency ? `(${plan.frequency})` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyCardText}>No active feeding plans. Set up feeding for your herd.</Text>
        )}

        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          <AppButton
            testID="dashboard-create-feed-plan-button"
            title="+ Create Feed Plan"
            variant="outline"
            size="small"
            onPress={handleAddFeedPlan}
            style={styles.quickButton}
          />
          <AppButton
            testID="dashboard-view-feed-plans-button"
            title="View All Plans"
            variant="outline"
            size="small"
            onPress={handleOpenFeedPlans}
            style={styles.quickButton}
          />
        </View>
      </AppCard>

      {/* 6. Notifications & Alerts (M10) */}
      <Text style={styles.sectionHeader}>Notifications & Alerts</Text>
      <AppCard
        testID="dashboard-m10-module"
        style={styles.moduleCard}
        onPress={handleOpenAlerts}
        accessibilityLabel="Notifications & Alerts Module, Active. Tap to open."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>🔔</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Alerts & Notifications</Text>
            <Text style={styles.moduleSub}>
              {unreadAlertCount !== null && unreadAlertCount > 0
                ? `${unreadAlertCount} unread alert${unreadAlertCount > 1 ? 's' : ''} require immediate attention`
                : 'Feed safety hazards, risk thresholds & urgent advisories'}
            </Text>
          </View>
          {unreadAlertCount !== null && unreadAlertCount > 0 ? (
            <View style={[styles.activeBadge, { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A' }]}>
              <Text style={[styles.activeBadgeText, { color: '#C62828' }]}>
                {unreadAlertCount} NEW
              </Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        {recentAlerts.length > 0 && (
          <View style={styles.previewList}>
            {recentAlerts.map((a) => (
              <View key={a.id} style={styles.previewItem}>
                <Text style={styles.previewItemTitle}>
                  {a.severity === 'CRITICAL' ? '⛔' : a.severity === 'HIGH' ? '⚠️' : 'ℹ️'} {a.title}
                </Text>
                <Text style={styles.previewItemSub} numberOfLines={1}>
                  {a.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          <AppButton
            testID="dashboard-view-alerts-button"
            title={
              unreadAlertCount && unreadAlertCount > 0
                ? `View Alerts (${unreadAlertCount} New)`
                : 'Open Alerts Inbox'
            }
            variant="outline"
            size="small"
            onPress={handleOpenAlerts}
            style={styles.quickButton}
          />
        </View>
      </AppCard>

      {/* 7. Expert Consultations (M8) */}
      <Text style={styles.sectionHeader}>Expert Consultations</Text>
      <AppCard
        testID="dashboard-consultation-module"
        style={styles.moduleCard}
        onPress={handleOpenConsultations}
        accessibilityLabel="Expert Consultation Advisory Workflow. Tap to open."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>👨‍⚕️</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>
              {user?.role === 'EXPERT' ? 'Consultation Requests' : 'Veterinary & Nutrition Advisory'}
            </Text>
            <Text style={styles.moduleSub}>
              {consultations.length > 0
                ? `${consultations.length} recorded consultation${consultations.length > 1 ? 's' : ''}`
                : 'Direct professional guidance from certified veterinarians'}
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          {user?.role === 'EXPERT' ? (
            <AppButton
              testID="dashboard-expert-consultations-button"
              title="Review Requests"
              variant="outline"
              size="small"
              onPress={handleOpenConsultations}
              style={styles.quickButton}
            />
          ) : (
            <>
              <AppButton
                testID="dashboard-request-consultation-button"
                title="+ Request Consultation"
                variant="outline"
                size="small"
                onPress={() => navigation.navigate('RequestConsultation')}
                style={styles.quickButton}
              />
              <AppButton
                testID="dashboard-my-consultations-button"
                title="My Consultations"
                variant="outline"
                size="small"
                onPress={handleOpenConsultations}
                style={styles.quickButton}
              />
            </>
          )}
        </View>
      </AppCard>

      {/* 8. Historical Analytics & Trends (M9) */}
      <Text style={styles.sectionHeader}>Historical Analytics</Text>
      <AppCard
        testID="dashboard-m9-module"
        style={styles.moduleCard}
        onPress={handleOpenAnalytics}
        accessibilityLabel="Analytics and Historical Trends Module, Active. Tap to open."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>📊</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Historical Analytics & Trends</Text>
            <Text style={styles.moduleSub}>
              Quality progression, risk distributions, and herd test tracking
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        </View>
        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          <AppButton
            testID="dashboard-view-analytics-button"
            title="Open Analytics Dashboard"
            variant="outline"
            size="small"
            onPress={handleOpenAnalytics}
            style={styles.quickButton}
          />
        </View>
      </AppCard>

      {/* 9. Integrated Decision Support (M12) */}
      <Text style={styles.sectionHeader}>Integrated Decision Support</Text>
      <AppCard
        testID="dashboard-evidence-module"
        style={styles.moduleCard}
        onPress={() => {
          if (consultations.length > 0) {
            navigation.navigate('EvidenceSummary', { consultationId: consultations[0].id });
          } else {
            navigation.navigate('AnimalList');
          }
        }}
        accessibilityLabel="Integrated Decision Support Evidence. Tap to review."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>🔬</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Unified Evidence View</Text>
            <Text style={styles.moduleSub}>
              Aggregated lab tests, AI visual screening, health screenings, and professional advisories
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          <AppButton
            testID="dashboard-review-evidence-button"
            title="Review Evidence"
            variant="outline"
            size="small"
            onPress={() => {
              if (consultations.length > 0) {
                navigation.navigate('EvidenceSummary', { consultationId: consultations[0].id });
              } else {
                navigation.navigate('AnimalList');
              }
            }}
            style={styles.quickButton}
          />
        </View>
      </AppCard>

      {/* 10. Storage Unit Monitoring (Post-M13 Module) */}
      <Text style={styles.sectionHeader}>Storage Unit Monitoring</Text>
      <AppCard
        testID="dashboard-storage-monitoring-card"
        style={styles.moduleCard}
        onPress={handleOpenStorageUnits}
        accessibilityLabel="Storage Unit Monitoring Module. Tap to view storage units."
      >
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleIcon}>🌡️</Text>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>Storage Monitoring</Text>
            <Text style={styles.moduleSub}>
              {storageSummary && storageSummary.totalStorageUnits > 0
                ? `${storageSummary.totalStorageUnits} unit${storageSummary.totalStorageUnits === 1 ? '' : 's'} (${storageSummary.monitoringUnits + storageSummary.normalUnits} monitoring, ${storageSummary.attentionRequiredUnits} attention)`
                : 'Real-time telemetry, temperature & pH change detection'}
            </Text>
          </View>
          <View
            style={[
              styles.activeBadge,
              storageSummary && storageSummary.attentionRequiredUnits > 0
                ? { backgroundColor: '#FEE2E2' }
                : { backgroundColor: '#DCFCE7' },
            ]}
          >
            <Text
              style={[
                styles.activeBadgeText,
                storageSummary && storageSummary.attentionRequiredUnits > 0
                  ? { color: '#991B1B' }
                  : { color: '#166534' },
              ]}
            >
              {storageSummary && storageSummary.attentionRequiredUnits > 0
                ? '⚠ ATTENTION'
                : 'MONITORING'}
            </Text>
          </View>
        </View>

        {storageSummary && (
          <View style={styles.riskBadgeRow}>
            <View style={[styles.miniStatBadge, { backgroundColor: '#EBF5FF' }]}>
              <Text style={[styles.miniStatLabel, { color: '#1E40AF' }]}>Total Units</Text>
              <Text style={[styles.miniStatValue, { color: '#1E40AF' }]}>
                {storageSummary.totalStorageUnits}
              </Text>
            </View>
            <View style={[styles.miniStatBadge, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.miniStatLabel, { color: '#166534' }]}>Monitoring</Text>
              <Text style={[styles.miniStatValue, { color: '#166534' }]}>
                {storageSummary.monitoringUnits + storageSummary.normalUnits}
              </Text>
            </View>
            <View
              style={[
                styles.miniStatBadge,
                { backgroundColor: storageSummary.attentionRequiredUnits > 0 ? '#FEE2E2' : '#F3F4F6' },
              ]}
            >
              <Text
                style={[
                  styles.miniStatLabel,
                  { color: storageSummary.attentionRequiredUnits > 0 ? '#991B1B' : '#4B5563' },
                ]}
              >
                Attention Req.
              </Text>
              <Text
                style={[
                  styles.miniStatValue,
                  { color: storageSummary.attentionRequiredUnits > 0 ? '#991B1B' : '#4B5563' },
                ]}
              >
                {storageSummary.attentionRequiredUnits}
              </Text>
            </View>
            <View style={[styles.miniStatBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.miniStatLabel, { color: '#92400E' }]}>Offline</Text>
              <Text style={[styles.miniStatValue, { color: '#92400E' }]}>
                {storageSummary.offlineUnits}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.quickActionRow, { marginTop: spacing.sm }]}>
          <AppButton
            testID="dashboard-view-storage-button"
            title="View Storage Units →"
            variant="outline"
            size="small"
            onPress={handleOpenStorageUnits}
            style={styles.quickButton}
          />
        </View>
      </AppCard>

      {/* 11. Non-diagnostic Safety Disclaimer */}
      <View style={styles.safetyDisclaimerBox}>
        <Text style={styles.safetyDisclaimerIcon}>🩺</Text>
        <Text style={styles.safetyDisclaimerText}>
          Non-diagnostic decision support. All diet formulas, quality scores, and health screenings
          must be reviewed by a certified Veterinarian or Animal Nutrition Expert before medical intervention.
        </Text>
      </View>

      {/* 10. Logout Action */}
      <View style={styles.logoutSection}>
        <AppButton
          testID="sign-out-button"
          title="Sign Out of Farm"
          variant="outline"
          onPress={logout}
          loading={isAuthLoading}
          disabled={isAuthLoading}
          accessibilityLabel="Sign Out of Farm Button"
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 26,
  },
  welcomeTextGroup: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  roleText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  notificationBellButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  overviewSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryIcon: {
    fontSize: 24,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  countText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  summaryTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quickButton: {
    flex: 1,
  },
  moduleCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  moduleIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  moduleSub: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
  },
  riskBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  miniStatBadge: {
    flex: 1,
    padding: spacing.xs,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
  },
  miniStatValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    marginTop: 1,
  },
  previewList: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewItem: {
    paddingVertical: 3,
  },
  previewItemTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  previewItemSub: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  emptyCardText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: spacing.xs,
  },
  safetyDisclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  safetyDisclaimerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  safetyDisclaimerText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: '#795548',
    lineHeight: 18,
  },
  logoutSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

export default DashboardScreen;
