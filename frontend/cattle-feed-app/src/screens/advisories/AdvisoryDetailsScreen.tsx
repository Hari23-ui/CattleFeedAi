import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { AdvisoryResponse, Priority } from '../../models/advisory';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { advisoryService } from '../../services/advisoryService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

const PRIORITY_THEME: Record<
  Priority,
  { bg: string; text: string; label: string }
> = {
  HIGH: { bg: '#FFEBEE', text: '#C62828', label: 'HIGH PRIORITY' },
  MEDIUM: { bg: '#FFF8E1', text: '#F57F17', label: 'MEDIUM PRIORITY' },
  LOW: { bg: '#E8F5E9', text: '#2E7D32', label: 'LOW PRIORITY' },
};

export const AdvisoryDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AdvisoryDetails'>['route']>();
  const { advisoryId } = route.params;

  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingRead, setIsMarkingRead] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await advisoryService.getAdvisoryById(advisoryId);
      setAdvisory(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [advisoryId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleMarkAsRead = async () => {
    try {
      setIsMarkingRead(true);
      const updated = await advisoryService.markAsRead(advisoryId);
      setAdvisory(updated);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsMarkingRead(false);
    }
  };

  if (isLoading) {
    return <LoadingView message="Loading advisory details..." />;
  }

  if (errorMessage && !advisory) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="advisory-details-error"
          message={errorMessage}
          onRetry={fetchDetails}
          onDismiss={() => setErrorMessage(null)}
        />
        <AppButton
          title="Back to Advisories"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  if (!advisory) {
    return null;
  }

  const priorityTheme = advisory.priority
    ? PRIORITY_THEME[advisory.priority] || PRIORITY_THEME.LOW
    : PRIORITY_THEME.LOW;

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {errorMessage && (
        <ErrorMessage
          testID="advisory-action-error"
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Header Badges */}
      <View style={styles.topBar}>
        <View style={styles.badgeGroup}>
          {advisory.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{advisory.category}</Text>
            </View>
          )}
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityTheme.bg },
            ]}
          >
            <Text style={[styles.priorityBadgeText, { color: priorityTheme.text }]}>
              {priorityTheme.label}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.readStatusBadge,
            advisory.isRead ? styles.readBadge : styles.unreadBadge,
          ]}
        >
          <Text
            style={[
              styles.readStatusText,
              advisory.isRead ? styles.readText : styles.unreadText,
            ]}
          >
            {advisory.isRead ? 'READ' : 'UNREAD'}
          </Text>
        </View>
      </View>

      {/* Advisory Title */}
      <Text style={styles.advisoryTitle}>{advisory.title}</Text>
      <Text style={styles.metaText}>
        Recorded on:{' '}
        {advisory.createdAt
          ? new Date(advisory.createdAt).toLocaleString()
          : 'N/A'}
      </Text>

      {/* Animal Association Card */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Animal Association</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Target Cattle:</Text>
          <Text style={styles.infoValue}>
            {advisory.animalTag ? `Tag: ${advisory.animalTag}` : 'General Herd / All Animals'}
          </Text>
        </View>
        {advisory.animalId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Animal Record ID:</Text>
            <Text style={styles.infoValue}>#{advisory.animalId}</Text>
          </View>
        )}
      </AppCard>

      {/* Message Card */}
      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Advisory Message</Text>
        <Text style={styles.messageText}>{advisory.message}</Text>
      </AppCard>

      {/* Recommended Action Card */}
      {advisory.recommendedAction ? (
        <AppCard style={[styles.card, styles.actionCard]}>
          <Text style={styles.actionSectionTitle}>💡 Recommended Farmer Action</Text>
          <Text style={styles.actionText}>{advisory.recommendedAction}</Text>
        </AppCard>
      ) : null}

      {/* Disclaimer */}
      <Text style={styles.disclaimerText}>
        Screening Disclaimer: Advisories provide management guidance based on
        configured baseline rules. They do not substitute for on-site veterinary
        consultation or definitive clinical diagnosis.
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        {!advisory.isRead && (
          <AppButton
            testID="mark-read-button"
            title={isMarkingRead ? 'Updating...' : 'Mark as Read ✓'}
            onPress={handleMarkAsRead}
            loading={isMarkingRead}
            disabled={isMarkingRead}
            style={styles.actionButton}
          />
        )}
        <AppButton
          title="← Back to Advisories"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#ECEFF1',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: '#455A64',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  priorityBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  readStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  readBadge: {
    backgroundColor: '#E8F5E9',
  },
  unreadBadge: {
    backgroundColor: '#FFF3E0',
  },
  readStatusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
  },
  readText: {
    color: '#2E7D32',
  },
  unreadText: {
    color: '#E65100',
  },
  advisoryTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionCard: {
    backgroundColor: '#F1F8E9',
    borderColor: '#C5E1A5',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.xs,
  },
  actionSectionTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: '#2E7D32',
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  messageText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionText: {
    fontSize: typography.fontSize.body,
    color: '#1B5E20',
    lineHeight: 22,
    fontWeight: typography.fontWeight.medium,
  },
  disclaimerText: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  buttonGroup: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
  backButton: {
    width: '100%',
  },
});

export default AdvisoryDetailsScreen;
