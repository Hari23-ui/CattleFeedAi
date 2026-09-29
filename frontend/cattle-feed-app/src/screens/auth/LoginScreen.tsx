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
import { validateLoginForm } from '../../utils/validation';

export interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login, isLoading, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({});

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearError();

    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      await login({
        email: email.trim(),
        password,
      });
      // Navigation is automatically handled by RootNavigator observing auth state
    } catch {
      // Error is caught and surfaced in auth context
    }
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

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🌾</Text>
        </View>
        <Text style={styles.appName}>CattleFeedAI</Text>
        <Text style={styles.tagline}>Smart Feed Safety & Animal Nutrition</Text>
      </View>

      {/* Login Card */}
      <AppCard style={styles.card}>
        <Text style={styles.title}>Farmer Login</Text>
        <Text style={styles.subtitle}>
          Sign in to manage your livestock, feed tests, and safety advisories
        </Text>

        <ErrorMessage
          message={authError}
          onDismiss={clearError}
          testID="login-error-message"
        />

        <AppInput
          testID="login-email-input"
          label="Email Address"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="e.g. farmer@dairyfarm.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={fieldErrors.email}
          accessibilityLabel="Email Address Input"
          accessibilityHint="Enter the email address registered with your CattleFeedAI account"
        />

        <AppInput
          testID="login-password-input"
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Enter your password"
          secureTextEntry={true}
          allowToggleSecure={true}
          autoCapitalize="none"
          error={fieldErrors.password}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          accessibilityLabel="Password Input"
          accessibilityHint="Enter your account password"
        />

        <AppButton
          testID="login-submit-button"
          title="Sign In to Farm"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
          accessibilityLabel="Sign In to Farm Button"
        />
      </AppCard>

      {/* Switch to Register */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerPrompt}>New to CattleFeedAI?</Text>
        <TouchableOpacity
          onPress={onNavigateToRegister}
          disabled={isLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Create a new farm account"
          style={styles.registerLink}
        >
          <Text style={styles.registerLinkText}>Register New Account</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginTop: 4,
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
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  registerPrompt: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    marginRight: 6,
  },
  registerLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  registerLinkText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
