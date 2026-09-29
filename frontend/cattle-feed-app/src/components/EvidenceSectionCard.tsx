import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../constants/theme';
import EvidenceSourceBadge from './EvidenceSourceBadge';

interface EvidenceSectionCardProps {
  title: string;
  subtitle?: string;
  source?: string;
  statusBadge?: React.ReactNode;
  children?: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EvidenceSectionCard: React.FC<EvidenceSectionCardProps> = ({
  title,
  subtitle,
  source,
  statusBadge,
  children,
  emptyMessage = 'Not Available',
  isEmpty = false,
  style,
  testID = 'evidence-section-card',
}) => {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {statusBadge ? <View style={styles.badgeContainer}>{statusBadge}</View> : null}
      </View>

      {/* Evidence Source Badge */}
      {source ? (
        <View style={styles.sourceRow}>
          <EvidenceSourceBadge source={source} />
        </View>
      ) : null}

      {/* Content or Empty State */}
      <View style={styles.body}>
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  sourceRow: {
    marginVertical: spacing.xs,
  },
  body: {
    marginTop: spacing.xs,
  },
  emptyContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default EvidenceSectionCard;
