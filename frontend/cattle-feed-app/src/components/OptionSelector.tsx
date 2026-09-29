import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, touchTarget, typography } from '../constants/theme';

export interface OptionItem<T extends string | number> {
  label: string;
  value: T;
  icon?: string;
  description?: string;
}

export interface OptionSelectorProps<T extends string | number> {
  label: string;
  options: OptionItem<T>[];
  selectedValue: T | undefined | null;
  onSelect: (value: T) => void;
  error?: string | null;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OptionSelector<T extends string | number>({
  label,
  options,
  selectedValue,
  onSelect,
  error,
  required = false,
  style,
  testID,
}: OptionSelectorProps<T>) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>

      <View style={styles.optionsGrid}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              testID={`${testID || 'option'}-${String(opt.value)}`}
              activeOpacity={0.7}
              onPress={() => onSelect(opt.value)}
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${opt.label}${isSelected ? ', selected' : ''}`}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
              ]}
            >
              <View style={styles.optionContent}>
                {opt.icon && <Text style={styles.optionIcon}>{opt.icon}</Text>}
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              {opt.description ? (
                <Text
                  style={[
                    styles.optionDesc,
                    isSelected && styles.optionDescSelected,
                  ]}
                >
                  {opt.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
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
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: colors.error,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    minHeight: touchTarget.minHeight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 4,
  },
  optionDesc: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionDescSelected: {
    color: colors.primaryDark,
  },
  errorText: {
    fontSize: typography.fontSize.caption,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default OptionSelector;
