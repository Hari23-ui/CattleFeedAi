import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, spacing, typography } from '../constants/theme';
import { EvidenceSourceType } from '../models/evidence';

interface EvidenceSourceBadgeProps {
  source?: EvidenceSourceType | string | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface SourceConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  LABORATORY_DATA: {
    label: 'Laboratory Test Result',
    bg: '#E3F2FD',
    text: '#1565C0',
    border: '#90CAF9',
    icon: '🔬',
  },
  RECORDED_DATA: {
    label: 'Recorded Data',
    bg: '#F3E5F5',
    text: '#7B1FA2',
    border: '#CE93D8',
    icon: '📋',
  },
  AI_VISUAL_SCREENING: {
    label: 'AI Visual Screening (Physical Surface Only)',
    bg: '#E0F2F1',
    text: '#00695C',
    border: '#80CBC4',
    icon: '📷',
  },
  DETERMINISTIC_VISUAL_SCREENING: {
    label: 'Rule-Based Visual Screening',
    bg: '#E8F5E9',
    text: '#2E7D32',
    border: '#A5D6A7',
    icon: '👁️',
  },
  RULE_BASED_QUALITY_ASSESSMENT: {
    label: 'Rule-Based Quality Assessment',
    bg: '#FFF8E1',
    text: '#F57F17',
    border: '#FFE082',
    icon: '⚖️',
  },
  RISK_SCREENING: {
    label: 'Risk Screening',
    bg: '#FFF3E0',
    text: '#E65100',
    border: '#FFCC80',
    icon: '⚠️',
  },
  ANIMAL_HEALTH_SCREENING: {
    label: 'Animal Health Screening',
    bg: '#EDE7F6',
    text: '#512DA8',
    border: '#B39DDB',
    icon: '🩺',
  },
  FARMER_RECORDED_INFORMATION: {
    label: 'Farmer-Recorded Information',
    bg: '#F5F5F5',
    text: '#424242',
    border: '#E0E0E0',
    icon: '📝',
  },
  EXPERT_RESPONSE: {
    label: 'Professional Expert Response',
    bg: '#E8EAF6',
    text: '#283593',
    border: '#9FA8DA',
    icon: '👨‍⚕️',
  },
  HISTORICAL_ANALYTICS: {
    label: 'Historical Analytics',
    bg: '#ECEFF1',
    text: '#37474F',
    border: '#B0BEC5',
    icon: '📊',
  },
};

const DEFAULT_CONFIG: SourceConfig = {
  label: 'Evidence Record',
  bg: '#F5F5F5',
  text: '#616161',
  border: '#E0E0E0',
  icon: 'ℹ️',
};

export const EvidenceSourceBadge: React.FC<EvidenceSourceBadgeProps> = ({
  source,
  style,
  testID = 'evidence-source-badge',
}) => {
  const config = (source && SOURCE_CONFIGS[source]) || DEFAULT_CONFIG;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }, style]} testID={testID}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default EvidenceSourceBadge;
