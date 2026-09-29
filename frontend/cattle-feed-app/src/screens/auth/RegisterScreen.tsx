import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppButton,
  AppCard,
  AppInput,
  ErrorMessage,
  ScreenContainer,
} from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { RegisterRequest } from '../../models/auth';
import { validateRegisterForm } from '../../utils/validation';

export interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const { register, isLoading, error: authError, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterRequest, string>>>({});

  const handleRegister = async () => {
    Keyboard.dismiss();
    clearError();

    const payload: RegisterRequest = {
      username: username.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      language: language.trim() || 'en',
    };

    const validation = validateRegisterForm(payload);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      await register(payload);
      // Backend automatically sets role to FARMER and returns AuthResponse with JWT
      // Navigation is automatically handled by RootNavigator observing auth state
    } catch {
      // Error is caught and surfaced in auth context
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
    }
    if (authError) clearError();
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (authError) clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (authError) clearError();
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    }
    if (authError) clearError();
  };

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🌾</Text>
        </View>
        <Text style={styles.appName}>CattleFeedAI</Text>
        <Text style={styles.tagline}>Join the Intelligent Livestock Management Network</Text>
      </View>

      {/* Register Card */}
      <AppCard style={styles.card}>
        <Text style={styles.title}>Create Farmer Account</Text>
        <Text style={styles.subtitle}>
          Sign up to begin recording feed samples, testing silage, and receiving nutritional alerts.
        </Text>

        <ErrorMessage
          message={authError}
          onDismiss={clearError}
          testID="register-error-message"
        />

        <AppInput
          testID="register-username-input"
          label="Farmer Username *"
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="e.g. greenvalley_farm"
          autoCapitalize="none"
          error={fieldErrors.username}
          accessibilityLabel="Farmer Username Input"
          accessibilityHint="Choose a unique username between 3 and 50 characters"
        />

        <AppInput
          testID="register-email-input"
          label="Email Address *"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="e.g. farmer@dairyfarm.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={fieldErrors.email}
          accessibilityLabel="Email Address Input"
          accessibilityHint="Enter your email address for account access and alerts"
        />

        <AppInput
          testID="register-password-input"
          label="Password * (min. 6 characters)"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Create a secure password"
          secureTextEntry={true}
          allowToggleSecure={true}
          autoCapitalize="none"
          error={fieldErrors.password}
          accessibilityLabel="Password Input"
          accessibilityHint="Create a password with at least 6 characters"
        />

        <AppInput
          testID="register-phone-input"
          label="Phone Number (Optional)"
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="e.g. +1 555-0199"
          keyboardType="phone-pad"
          autoCapitalize="none"
          error={fieldErrors.phone}
          accessibilityLabel="Phone Number Input"
          accessibilityHint="Enter your mobile phone number for SMS emergency feed alerts"
        />

        <AppButton
          testID="register-submit-button"
          title="Create Account"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
          accessibilityLabel="Create Account Button"
        />
      </AppCard>

      {/* Switch to Login */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginPrompt}>Already have an account?</Text>
        <TouchableOpacity
          onPress={onNavigateToLogin}
          disabled={isLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Navigate to Sign In screen"
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoIcon: {
    fontSize: 28,
  },
  appName: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  tagline: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.header,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.small,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loginPrompt: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    marginRight: 6,
  },
  loginLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  loginLinkText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
