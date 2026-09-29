import { Platform } from 'react-native';

/**
 * CattleFeedAI Environment & Network Configuration
 *
 * Designed to seamlessly support:
 * - Android Emulator (uses 10.0.2.2 to reach host machine loopback)
 * - iOS Simulator (uses localhost:8080)
 * - Physical Phone / LAN (via EXPO_PUBLIC_API_BASE_URL)
 * - Web (uses window.location / localhost)
 * - Production Server
 */

// Determine appropriate default host based on platform
const getDefaultApiHost = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator loopback alias to host machine
    return 'http://10.0.2.2:8080';
  }
  // iOS simulator, macOS, Windows, and Web
  return 'http://localhost:8080';
};

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiHost();

export const AI_SERVICE_URL: string =
  process.env.EXPO_PUBLIC_AI_SERVICE_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

export const API_TIMEOUT_MS = 15000;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cattlefeed_auth_token',
  AUTH_USER: 'cattlefeed_auth_user',
} as const;

export const APP_CONFIG = {
  appName: 'CattleFeedAI',
  version: '1.0.0',
  isDevelopment: __DEV__,
} as const;

export default {
  API_BASE_URL,
  AI_SERVICE_URL,
  API_TIMEOUT_MS,
  STORAGE_KEYS,
  APP_CONFIG,
};
