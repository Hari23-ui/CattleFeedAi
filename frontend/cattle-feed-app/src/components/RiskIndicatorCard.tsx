import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AppCard } from './AppCard';
import { borderRadius, colors, spacing, typography } from '../constants/theme';
import { RiskIndicatorDto, Severity } from '../models/risk';

interface RiskIndicatorCardProps {
  risk: RiskIndicatorDto;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SEVERITY_THEME: Record<
  Severity,
  { bg: string; text: string; border: string; label: string }
> = {
  CRITICAL: {
    bg: '#FFEBEE',
    text: '#C62828',
    border: '#EF9A9A',
    label: 'Critical Hazard',
  },
  HIGH: {
    bg: '#FBE9E7',
    text: '#D84315',
    border: '#FFAB91',
    label: 'High Risk',
  },
  WARNING: {
    bg: '#FFF8E1',
    text: '#E65100',
    border: '#FFE082',
    label: 'Warning Indicator',
  },
  NORMAL: {
    bg: '#E8F5E9',
    text: '#2E7D32',
    border: '#A5D6A7',
    label: 'Normal Baseline',
  },
  INFO: {
    bg: '#E3F2FD',
    text: '#1565C0',
    border: '#90CAF9',
    label: 'Observation',
  },
};

/**
 * Reusable Card for rendering a backend-derived RiskIndicatorDto.
 * Displays only fields populated by the backend.
 * DOES NOT evaluate scientific thresholds locally.
 */
export const RiskIndicatorCard: React.FC<RiskIndicatorCardProps> = ({
  risk,
  style,
  testID = 'risk-indicator-card',
}) => {
  const theme = SEVERITY_THEME[risk.severity] || SEVERITY_THEME.WARNING;

  return (
    <AppCard style={[styles.card, style]} testID={testID}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{risk.category}</Text>
        </View>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.severityText, { color: theme.text }]}>
            {theme.label}
          </Text>
        </View>
      </View>

      {/* Risk Title */}
      <Text style={styles.titleText}>{risk.riskTitle}</Text>

      {/* Description */}
      {risk.description ? (
        <Text style={styles.descriptionText}>{risk.description}</Text>
      ) : null}

      {/* Detected Parameter */}
      {risk.detectedParameter ? (
        <View style={styles.parameterRow}>
          <Text style={styles.parameterLabel}>Detected Indicator:</Text>
          <Text style={styles.parameterValue}>{risk.detectedParameter}</Text>
        </View>
      ) : null}

      {/* Mitigation Action / Recommendation */}
      {risk.mitigationRecommendation ? (
        <View style={styles.mitigationBox}>
          <Text style={styles.mitigationHeader}>💡 Recommended Action:</Text>
          <Text style={styles.mitigationText}>
            {risk.mitigationRecommendation}
          </Text>
        </View>
      ) : null}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: '#455A64',
    textTransform: 'uppercase',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  severityText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  titleText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  parameterLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
  },
  parameterValue: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  mitigationBox: {
    backgroundColor: '#F9FBE7',
    borderColor: '#E6EE9C',
    borderWidth: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  mitigationHeader: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#33691E',
    marginBottom: 2,
  },
  mitigationText: {
    fontSize: typography.fontSize.small,
    color: '#33691E',
    lineHeight: 18,
  },
});

export default RiskIndicatorCard;
