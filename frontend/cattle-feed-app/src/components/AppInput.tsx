import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, touchTarget, typography } from '../constants/theme';

export interface AppInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  secureTextEntry?: boolean;
  allowToggleSecure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  multiline?: boolean;
  numberOfLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  allowToggleSecure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  style,
  inputStyle,
  multiline = false,
  numberOfLines,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const shouldHideText = secureTextEntry && !isSecureVisible;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          multiline && { minHeight: 80, alignItems: 'flex-start' },
        ]}
      >
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={shouldHideText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          style={[styles.input, multiline && { minHeight: 70 }, inputStyle]}
        />
        {secureTextEntry && allowToggleSecure && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible((prev) => !prev)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>{isSecureVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && (
        <Text
          accessible={true}
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  errorText: {
    fontSize: typography.fontSize.caption,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default AppInput;
