import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, elevation, spacing } from '../constants/theme';

export interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  style,
  accessibilityLabel,
  testID,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.8}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, styles.interactive, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, style]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  interactive: {
    ...elevation.cardHover,
  },
});

export default AppCard;
