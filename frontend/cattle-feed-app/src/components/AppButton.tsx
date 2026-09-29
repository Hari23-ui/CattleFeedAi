import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, touchTarget, typography } from '../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

export type ButtonSize = 'small' | 'medium' | 'large';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'text' ? colors.primary : colors.textInverse}
        />
      ) : (
        <Text
          style={[
            styles.textBase,
            styles[`${variant}Text` as keyof typeof styles],
            styles[`textSize_${size}`],
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minHeight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  disabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  textBase: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.textInverse,
  },
  outlineText: {
    color: colors.primary,
  },
  textText: {
    color: colors.primary,
  },
  size_small: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  size_medium: {
    minHeight: touchTarget.minHeight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
  },
  size_large: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
  },
  textSize_small: {
    fontSize: typography.fontSize.small,
  },
  textSize_medium: {
    fontSize: typography.fontSize.body,
  },
  textSize_large: {
    fontSize: typography.fontSize.subtitle,
  },
  disabledText: {
    color: '#9E9E9E',
  },
});

export default AppButton;
