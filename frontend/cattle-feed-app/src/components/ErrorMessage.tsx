import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, typography } from '../constants/theme';

export interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  onRetry,
  style,
  testID,
}) => {
  if (!message) return null;

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.container, style]}
    >
      <View style={styles.textContainer}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.actionRow}>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retry request"
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
            style={styles.actionButton}
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: borderRadius.sm,
    padding: 12,
    marginVertical: 10,
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: typography.fontSize.small,
    color: colors.error,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.fontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    textDecorationLine: 'underline',
  },
  dismissText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});

export default ErrorMessage;
