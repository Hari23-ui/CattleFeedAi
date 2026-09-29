import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { borderRadius, colors, elevation, spacing, typography } from '../constants/theme';
import { AppSidebar } from './AppSidebar';
import { MobileDrawer } from './MobileDrawer';
import { navigate, navigationRef } from './navigationRef';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<string>('Dashboard');

  useEffect(() => {
    const updateRoute = () => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route?.name) {
          setCurrentRoute(route.name);
        }
      }
    };

    updateRoute();
    const unsubscribe = navigationRef.addListener('state', updateRoute);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleNavigate = (route: string, params?: any) => {
    navigate(route as any, params);
  };

  return (
    <View style={styles.container}>
      {/* Desktop/Tablet Left Sidebar */}
      {isDesktop && (
        <AppSidebar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />
      )}

      {/* Mobile Drawer Overlay */}
      {!isDesktop && (
        <MobileDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />
      )}

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Mobile Top App Bar (Hamburger + Brand) */}
        {!isDesktop && (
          <SafeAreaView style={styles.mobileTopBarSafeArea}>
            <View style={styles.mobileTopBar}>
              <TouchableOpacity
                style={styles.hamburgerButton}
                onPress={() => setDrawerOpen(true)}
                activeOpacity={0.7}
                testID="mobile-hamburger-button"
              >
                <Ionicons name="menu" size={26} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.mobileBrand}>
                <Ionicons name="nutrition" size={20} color={colors.primary} />
                <Text style={styles.mobileBrandText}>CattleFeedAI</Text>
              </View>

              <TouchableOpacity
                style={styles.mobileProfileButton}
                onPress={() => handleNavigate('Profile')}
                activeOpacity={0.7}
                testID="mobile-top-profile-button"
              >
                <Ionicons name="person-circle-outline" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}

        {/* Stack Screen Container */}
        <View style={styles.stackWrapper}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileTopBarSafeArea: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileTopBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  hamburgerButton: {
    padding: spacing.xs,
  },
  mobileBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  mobileBrandText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
  },
  mobileProfileButton: {
    padding: spacing.xs,
  },
  stackWrapper: {
    flex: 1,
  },
});

export default AppLayout;
