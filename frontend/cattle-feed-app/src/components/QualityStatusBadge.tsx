import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, spacing, typography } from '../constants/theme';
import { QualityStatus } from '../models/assessment';

interface QualityStatusBadgeProps {
  status?: QualityStatus | null;
  showDescription?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface StatusConfig {
  label: string;
  description: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

const STATUS_CONFIGS: Record<QualityStatus, StatusConfig> = {
  GOOD: {
    label: 'Good Quality',
    description: 'Available measurements did not trigger the configured quality rules.',
    bg: '#E8F5E9',
    text: '#2E7D32',
    border: '#A5D6A7',
    icon: '✓',
  },
  ACCEPTABLE: {
    label: 'Acceptable',
    description: 'Some measurements may require attention.',
    bg: '#FFF8E1',
    text: '#F57F17',
    border: '#FFE082',
    icon: 'ℹ',
  },
  NEEDS_ATTENTION: {
    label: 'Needs Attention',
    description: 'One or more quality indicators require attention.',
    bg: '#FFF3E0',
    text: '#E65100',
    border: '#FFCC80',
    icon: '⚠️',
  },
  UNSAFE: {
    label: 'Potential Hazard / Unsafe',
    description: 'One or more configured safety rules were triggered.',
    bg: '#FFEBEE',
    text: '#C62828',
    border: '#EF9A9A',
    icon: '⛔',
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    description: 'More measurements are required for a complete assessment.',
    bg: '#ECEFF1',
    text: '#546E7A',
    border: '#CFD8DC',
    icon: '❓',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: 'Not Available',
  description: 'Assessment status has not been evaluated.',
  bg: '#F5F5F5',
  text: '#757575',
  border: '#E0E0E0',
  icon: '•',
};

/**
 * Reusable Quality Status Badge
 * Receives ONLY a backend-calculated QualityStatus enum.
 * DOES NOT calculate or evaluate status locally.
 */
export const QualityStatusBadge: React.FC<QualityStatusBadgeProps> = ({
  status,
  showDescription = false,
  style,
  testID = 'quality-status-badge',
}) => {
  const config = status ? STATUS_CONFIGS[status] || DEFAULT_CONFIG : DEFAULT_CONFIG;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View
        style={[
          styles.badge,
          { backgroundColor: config.bg, borderColor: config.border },
        ]}
      >
        <Text style={[styles.badgeIcon, { color: config.text }]}>{config.icon}</Text>
        <Text style={[styles.badgeText, { color: config.text }]}>
          {config.label}
        </Text>
      </View>
      {showDescription && (
        <Text style={styles.descriptionText}>{config.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  badgeIcon: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  badgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: typography.fontSize.small,
    color: '#616161',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});

export default QualityStatusBadge;
