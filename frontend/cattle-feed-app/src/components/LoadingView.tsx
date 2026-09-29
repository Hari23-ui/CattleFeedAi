import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, typography } from '../constants/theme';

export interface LoadingViewProps {
  message?: string;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Loading CattleFeedAI...',
  fullScreen = true,
  style,
  testID,
}) => {
  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={[
        fullScreen ? styles.fullScreen : styles.inline,
        style,
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  inline: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingView;
