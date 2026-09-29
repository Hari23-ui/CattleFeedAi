import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, elevation, spacing, typography } from '../../constants/theme';

interface LandingScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const CAPABILITIES = [
  {
    icon: 'business-outline' as const,
    title: 'Farm & Animal Management',
    desc: 'Organize multi-farm inventories, track cattle profiles, breeds, lactation, and nutritional statuses.',
  },
  {
    icon: 'flask-outline' as const,
    title: 'Feed & Silage Testing',
    desc: 'Record comprehensive nutritional parameters (CP, NDF, ADF, pH, moisture, aflatoxin) with standard verification.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Quality & Risk Assessment',
    desc: 'Instant rule-based safety classifications, toxicity risk flags, and veterinary nutritional advisories.',
  },
  {
    icon: 'scan-outline' as const,
    title: 'Visual AI Screening',
    desc: 'Computer vision surface screening for mold, discoloration, and foreign matter before laboratory analysis.',
  },
  {
    icon: 'hardware-chip-outline' as const,
    title: 'Storage Unit Monitoring',
    desc: 'Continuous environmental telemetry for silage pits and feed godowns with anomaly detection and alerts.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Expert Consultation',
    desc: 'Connect with verified veterinary nutritionists and agronomy specialists with evidence attachments.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Historical Analytics',
    desc: 'Longitudinal nutritional trends, seasonal variation analysis, and actionable farm-level insights.',
  },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Brand */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="nutrition" size={32} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>CattleFeedAI</Text>
          <Text style={styles.brandSubtitle}>
            Digital Cattle Feed & Silage Quality Assessment and Advisory System
          </Text>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroHeading}>
            Empowering Dairy Farmers with Precision Feed Intelligence
          </Text>
          <Text style={styles.heroDescription}>
            A comprehensive, scientifically backed platform bridging visual surface screening,
            chemical laboratory verification, and real-time environmental storage monitoring
            to protect herd health and maximize milk yield.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onNavigateToRegister}
              activeOpacity={0.85}
              testID="landing-get-started-button"
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
            </TouchableOpacity>

            <View style={styles.secondaryButtonGroup}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onNavigateToLogin}
                activeOpacity={0.8}
                testID="landing-sign-in-button"
              >
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, styles.signUpButton]}
                onPress={onNavigateToRegister}
                activeOpacity={0.8}
                testID="landing-sign-up-button"
              >
                <Text style={styles.secondaryButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Major Capabilities Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Core System Capabilities</Text>
          <Text style={styles.sectionSubtitle}>
            Integrated tools designed for modern livestock feeding and agronomy
          </Text>
        </View>

        <View style={styles.capabilitiesGrid}>
          {CAPABILITIES.map((cap, index) => (
            <View key={index} style={styles.capabilityCard}>
              <View style={styles.capabilityIconWrapper}>
                <Ionicons name={cap.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.capabilityTextWrapper}>
                <Text style={styles.capabilityTitle}>{cap.title}</Text>
                <Text style={styles.capabilityDesc}>{cap.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Scientific Boundary Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            Scientific Note: CattleFeedAI provides screening, risk assessment, and decision support.
            Camera AI performs surface screening only; laboratory testing provides definitive nutritional
            analysis; sensor readings monitor environmental conditions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 540,
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...elevation.card,
  },
  heroHeading: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  heroDescription: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionButtonGroup: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryButtonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  signUpButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  capabilitiesGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  capabilityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...elevation.card,
  },
  capabilityIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilityTextWrapper: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  capabilityDesc: {
    fontSize: typography.fontSize.caption + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default LandingScreen;
