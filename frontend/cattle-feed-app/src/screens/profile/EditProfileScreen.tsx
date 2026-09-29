import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, elevation, spacing, typography } from '../../constants/theme';
import { AppNavigationProp } from '../../navigation/types';
import { userService } from '../../services/userService';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<AppNavigationProp>();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read-only values from backend
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');

  // Editable fields
  const [username, setUsername] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');

  // Field validation errors
  const [errors, setErrors] = useState<{ username?: string; phone?: string }>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await userService.getProfile();
      setUserId(data.id);
      setEmail(data.email);
      setRole(data.role);
      setUsername(data.username || '');
      setPhone(data.phone || '');
      setLanguage(data.language || 'en');
    } catch (err: any) {
      if (err.status === 401) {
        setErrorMessage('Session expired. Please sign in again.');
      } else if (err.status === 403) {
        setErrorMessage('Access denied: You do not have permission to view or edit this profile.');
      } else {
        setErrorMessage(err.message || 'Failed to load profile. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { username?: string; phone?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    }

    if (phone.trim() && !/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (e.g. +91 9876543210)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await userService.updateProfile({
        username: username.trim(),
        phone: phone.trim() || undefined,
        language: language.trim() || undefined,
      });

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (err: any) {
      if (err.status === 401) {
        setErrorMessage('Unauthorized: Session expired. Please log in again.');
      } else if (err.status === 403) {
        setErrorMessage('Forbidden: You are not authorized to update this profile.');
      } else if (err.status === 409 || err.message?.includes('already taken')) {
        setErrorMessage('That username is already taken. Please choose another.');
      } else {
        setErrorMessage(err.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Farmer Profile</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading profile data...</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {successMessage && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              )}

              {/* Immutable Security Fields */}
              <View style={styles.readOnlySection}>
                <Text style={styles.sectionHeader}>System Identity (Protected)</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Farmer ID</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={userId ? `#${userId}` : '—'}
                    editable={false}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={email}
                    editable={false}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Account Role</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={role}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Editable Fields */}
              <Text style={styles.sectionHeader}>Editable Information</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Username *</Text>
                <TextInput
                  style={[styles.input, errors.username ? styles.inputError : null]}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  placeholder="Enter username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  testID="edit-profile-username-input"
                />
                {errors.username && <Text style={styles.errorFieldText}>{errors.username}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phone ? styles.inputError : null]}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+91-9876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  testID="edit-profile-phone-input"
                />
                {errors.phone && <Text style={styles.errorFieldText}>{errors.phone}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Preferred Language</Text>
                <View style={styles.languageOptions}>
                  <TouchableOpacity
                    style={[
                      styles.langChip,
                      language === 'en' && styles.langChipActive,
                    ]}
                    onPress={() => setLanguage('en')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        language === 'en' && styles.langChipTextActive,
                      ]}
                    >
                      English (en)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.langChip,
                      language === 'hi' && styles.langChipActive,
                    ]}
                    onPress={() => setLanguage('hi')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        language === 'hi' && styles.langChipTextActive,
                      ]}
                    >
                      हिन्दी (hi)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={submitting}
                  activeOpacity={0.85}
                  testID="edit-profile-save-button"
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color={colors.textInverse} />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  sectionHeader: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  readOnlySection: {
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.caption + 1,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputDisabled: {
    backgroundColor: '#EEF2F6',
    color: colors.textSecondary,
    borderColor: '#E2E8F0',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorFieldText: {
    color: colors.error,
    fontSize: typography.fontSize.caption,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  langChip: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langChipText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  langChipTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.fontWeight.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: typography.fontSize.small,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  successBannerText: {
    color: colors.primaryDark,
    fontSize: typography.fontSize.small,
    flex: 1,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default EditProfileScreen;
