import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, spacing, typography } from '../constants/theme';
import { AlertSeverity, AlertType } from '../models/alert';

interface AlertSeverityBadgeProps {
  severity?: AlertSeverity | null;
  alertType?: AlertType | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface SeverityConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

const SEVERITY_CONFIGS: Record<AlertSeverity, SeverityConfig> = {
  CRITICAL: {
    label: 'CRITICAL',
    bg: '#FFEBEE',
    text: '#C62828',
    border: '#EF9A9A',
    icon: '⛔',
  },
  HIGH: {
    label: 'HIGH RISK',
    bg: '#FFF3E0',
    text: '#D84315',
    border: '#FFAB91',
    icon: '⚠️',
  },
  WARNING: {
    label: 'WARNING',
    bg: '#FFF8E1',
    text: '#F57F17',
    border: '#FFE082',
    icon: '⚡',
  },
  NORMAL: {
    label: 'NORMAL',
    bg: '#E8F5E9',
    text: '#2E7D32',
    border: '#A5D6A7',
    icon: '✓',
  },
  INFO: {
    label: 'INFO',
    bg: '#E1F5FE',
    text: '#0277BD',
    border: '#81D4FA',
    icon: 'ℹ',
  },
};

const DEFAULT_SEVERITY: SeverityConfig = {
  label: 'ALERT',
  bg: '#ECEFF1',
  text: '#455A64',
  border: '#CFD8DC',
  icon: '🔔',
};

export const getAlertTypeIcon = (type?: AlertType | null): string => {
  if (!type) return '🔔';
  switch (type) {
    case 'FEED_QUALITY':
      return '🌾';
    case 'SILAGE_QUALITY':
      return '🌿';
    case 'STORAGE':
      return '🏭';
    case 'HEALTH_RISK':
      return '🩺';
    case 'CONSULTATION':
      return '👨‍⚕️';
    case 'GENERAL':
    default:
      return '🔔';
  }
};

export const getAlertTypeName = (type?: AlertType | null): string => {
  if (!type) return 'General';
  switch (type) {
    case 'FEED_QUALITY':
      return 'Feed Quality';
    case 'SILAGE_QUALITY':
      return 'Silage Quality';
    case 'STORAGE':
      return 'Storage & Bunker';
    case 'HEALTH_RISK':
      return 'Herd Health Risk';
    case 'CONSULTATION':
      return 'Expert Advice';
    case 'GENERAL':
    default:
      return 'General Alert';
  }
};

export const AlertSeverityBadge: React.FC<AlertSeverityBadgeProps> = ({
  severity,
  alertType,
  style,
  testID = 'alert-severity-badge',
}) => {
  const config = severity ? SEVERITY_CONFIGS[severity] || DEFAULT_SEVERITY : DEFAULT_SEVERITY;
  const typeIcon = alertType ? getAlertTypeIcon(alertType) : null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }, style]} testID={testID}>
      {typeIcon && <Text style={styles.typeIcon}>{typeIcon}</Text>}
      <Text style={[styles.iconText, { color: config.text }]}>{config.icon}</Text>
      <Text style={[styles.labelText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  typeIcon: {
    fontSize: 12,
  },
  iconText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  labelText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
});

export default AlertSeverityBadge;
