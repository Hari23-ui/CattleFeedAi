import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AlertSeverityBadge,
  AppButton,
  AppCard,
  ErrorMessage,
  LoadingView,
  ScreenContainer,
} from '../../components';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { Alert } from '../../models/alert';
import { AppNavigationProp, ScreenProps } from '../../navigation/types';
import { alertService } from '../../services/alertService';
import { getFarmerFriendlyErrorMessage } from '../../utils/errorHandler';

export const AlertDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<ScreenProps<'AlertDetails'>['route']>();
  const alertId = route.params?.alertId;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingRead, setIsMarkingRead] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAlertDetails = useCallback(async () => {
    if (!alertId) {
      setErrorMessage('Invalid alert identifier');
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      setIsLoading(true);
      const data = await alertService.getAlertById(alertId);
      setAlert(data);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    fetchAlertDetails();
  }, [fetchAlertDetails]);

  const handleMarkAsRead = async () => {
    if (!alertId || !alert) return;

    try {
      setIsMarkingRead(true);
      const updated = await alertService.markAsRead(alertId);
      setAlert(updated);
    } catch (err) {
      setErrorMessage(getFarmerFriendlyErrorMessage(err));
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingView message="Loading alert details..." testID="alert-details-loading" />
      </ScreenContainer>
    );
  }

  if (errorMessage || !alert) {
    return (
      <ScreenContainer contentContainerStyle={styles.container}>
        <ErrorMessage
          testID="alert-details-error"
          message={errorMessage || 'Alert not found'}
          onRetry={fetchAlertDetails}
        />
        <AppButton
          title="Back to Alerts"
          variant="outline"
          onPress={handleGoBack}
          style={styles.backButton}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {/* Alert Header Card */}
      <AppCard style={styles.card} testID="alert-details-card">
        <View style={styles.headerRow}>
          <AlertSeverityBadge
            severity={alert.severity}
            alertType={alert.alertType}
            testID="alert-details-severity-badge"
          />
          <View
            style={[
              styles.statusPill,
              alert.isRead ? styles.statusReadPill : styles.statusUnreadPill,
            ]}
            testID="alert-details-read-status"
          >
            <Text
              style={[
                styles.statusText,
                alert.isRead ? styles.statusReadText : styles.statusUnreadText,
              ]}
            >
              {alert.isRead ? 'READ' : 'UNREAD'}
            </Text>
          </View>
        </View>

        <Text style={styles.alertTitle} testID="alert-details-title">{alert.title}</Text>
        <Text style={styles.alertTimestamp} testID="alert-details-timestamp">
          {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : ''}
        </Text>

        <View style={styles.divider} />

        {/* Full Message */}
        <Text style={styles.sectionHeader}>Alert Description</Text>
        <Text style={styles.alertMessage} testID="alert-details-message">{alert.message}</Text>

        {/* Related Entity Information */}
        {alert.relatedEntityType && (
          <View style={styles.relatedInfoBox} testID="alert-details-related-info">
            <Text style={styles.relatedInfoLabel}>Related Resource</Text>
            <Text style={styles.relatedInfoValue}>
              {alert.relatedEntityType} {alert.relatedEntityId ? `#${alert.relatedEntityId}` : ''}
            </Text>
          </View>
        )}
      </AppCard>

      {/* Safety Notice */}
      <View style={styles.safetyBox}>
        <Text style={styles.safetyTitle}>⚠️ Advisory Notice</Text>
        <Text style={styles.safetyText}>
          Notifications and alerts are communication and screening tools. They do not constitute
          veterinary medical diagnoses. For clinical herd issues, always consult a certified
          Veterinarian or Veterinary Nutritionist.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {!alert.isRead && (
          <AppButton
            testID="alert-details-mark-read-button"
            title="Mark as Read"
            variant="primary"
            onPress={handleMarkAsRead}
            loading={isMarkingRead}
            style={styles.actionBtn}
          />
        )}
        <AppButton
          testID="alert-details-back-button"
          title="Back to Alerts"
          variant="outline"
          onPress={handleGoBack}
          style={styles.actionBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusUnreadPill: {
    backgroundColor: colors.primaryLight,
  },
  statusReadPill: {
    backgroundColor: '#ECEFF1',
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  statusUnreadText: {
    color: colors.primary,
  },
  statusReadText: {
    color: '#546E7A',
  },
  alertTitle: {
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  alertTimestamp: {
    fontSize: typography.fontSize.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  alertMessage: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  relatedInfoBox: {
    backgroundColor: '#F5F5F5',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  relatedInfoLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  relatedInfoValue: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  safetyBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: spacing.lg,
  },
  safetyTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#8D6E63',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: typography.fontSize.caption,
    color: '#5D4037',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
  backButton: {
    marginTop: spacing.md,
  },
});

export default AlertDetailsScreen;
