import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { NAV_GROUPS, NavItemConfig } from './NavGroups';

interface AppSidebarProps {
  currentRoute: string;
  onNavigate: (route: string, params?: any) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ currentRoute, onNavigate }) => {
  const { logout, user } = useAuth();

  const isRouteActive = (item: NavItemConfig) => {
    if (currentRoute === item.route) return true;
    // Map alternative aliases
    if (item.route === 'FarmList' && (currentRoute === 'Farms' || currentRoute === 'FarmDetails' || currentRoute === 'AddFarm')) return true;
    if (item.route === 'AnimalList' && (currentRoute === 'Animals' || currentRoute === 'AnimalDetails' || currentRoute === 'AddAnimal')) return true;
    if (item.route === 'FeedList' && (currentRoute === 'Feed' || currentRoute === 'FeedDetails' || currentRoute === 'AddFeed')) return true;
    if (item.route === 'SilageList' && (currentRoute === 'Silage' || currentRoute === 'SilageDetails' || currentRoute === 'AddSilage')) return true;
    if (item.route === 'TestResultList' && (currentRoute === 'TestResultDetails' || currentRoute === 'AddTestResult')) return true;
    if (item.route === 'Assessments' && (currentRoute === 'AssessmentResult' || currentRoute === 'AdvisoryList' || currentRoute === 'Advisories')) return true;
    if (item.route === 'StorageUnitList' && (currentRoute === 'StorageUnits' || currentRoute === 'StorageUnitDetails' || currentRoute === 'AddStorageUnit')) return true;
    if (item.route === 'FeedPlanList' && (currentRoute === 'FeedPlans' || currentRoute === 'FeedPlanDetails' || currentRoute === 'AddFeedPlan')) return true;
    if (item.route === 'AlertList' && (currentRoute === 'Alerts' || currentRoute === 'AlertDetails')) return true;
    if (item.route === 'ConsultationList' && (currentRoute === 'Consultations' || currentRoute === 'ConsultationDetails' || currentRoute === 'RequestConsultation')) return true;
    if (item.route === 'AnalyticsDashboard' && (currentRoute === 'Analytics' || currentRoute === 'AnimalAnalytics' || currentRoute === 'FeedHistory' || currentRoute === 'SilageHistory')) return true;
    if (item.route === 'Profile' && currentRoute === 'EditProfile') return true;
    return false;
  };

  return (
    <View style={styles.sidebarContainer}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge}>
          <Ionicons name="nutrition" size={24} color={colors.primary} />
        </View>
        <View style={styles.brandTextWrapper}>
          <Text style={styles.brandTitle}>CattleFeedAI</Text>
          <Text style={styles.brandTagline}>Feed & Silage Intelligence</Text>
        </View>
      </View>

      {/* User Mini Bar */}
      <View style={styles.userBar}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={16} color={colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || 'Farmer Account'}
          </Text>
          <Text style={styles.userRoleBadge}>{user?.role || 'FARMER'}</Text>
        </View>
      </View>

      {/* Scrollable Navigation Groups */}
      <ScrollView
        style={styles.navScrollView}
        contentContainerStyle={styles.navScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {NAV_GROUPS.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item, itemIndex) => {
              const active = isRouteActive(item);
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => onNavigate(item.route, item.params)}
                  activeOpacity={0.7}
                  testID={item.testID}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? colors.primary : colors.textSecondary}
                    style={styles.navItemIcon}
                  />
                  <Text style={[styles.navItemText, active && styles.navItemTextActive]}>
                    {item.name}
                  </Text>
                  {active && <View style={styles.activePill} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Separated Logout */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.75}
          testID="sidebar-logout-button"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 256,
    height: '100%',
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flexDirection: 'column',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextWrapper: {
    flex: 1,
  },
  brandTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: typography.fontSize.caption - 1,
    color: colors.textSecondary,
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  userRoleBadge: {
    fontSize: typography.fontSize.caption - 2,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  navScrollView: {
    flex: 1,
  },
  navScrollContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  groupContainer: {
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: typography.fontSize.caption - 1,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: 0.8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: colors.primaryLight,
  },
  navItemIcon: {
    marginRight: spacing.sm + 2,
    width: 22,
    textAlign: 'center',
  },
  navItemText: {
    flex: 1,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  navItemTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.bold,
  },
  activePill: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  footerContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
});

export default AppSidebar;
