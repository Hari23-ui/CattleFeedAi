import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants/config';
import { AuthUser } from '../models/auth';

/**
 * Secure Token and Authentication Storage
 *
 * Uses expo-secure-store on native platforms (iOS Keychain / Android Keystore)
 * with an in-memory / localStorage fallback for web environments and automated testing.
 *
 * Passwords are NEVER stored.
 * Tokens are NEVER logged to console.
 */

// Memory fallback store for environments without native SecureStore (e.g., node test environment, SSR, web)
const memoryStorage: Record<string, string> = {};

const isSecureStoreAvailableAsync = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Save JWT token securely
 */
export const saveToken = async (token: string): Promise<void> => {
  if (!token) return;

  try {
    const isAvailable = await isSecureStoreAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      memoryStorage[STORAGE_KEYS.AUTH_TOKEN] = token;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[tokenStorage] Error saving token to secure store, using memory fallback');
    }
    memoryStorage[STORAGE_KEYS.AUTH_TOKEN] = token;
  }
};

/**
 * Retrieve JWT token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const isAvailable = await isSecureStoreAvailableAsync();
    if (isAvailable) {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      return token || memoryStorage[STORAGE_KEYS.AUTH_TOKEN] || null;
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || memoryStorage[STORAGE_KEYS.AUTH_TOKEN] || null;
    } else {
      return memoryStorage[STORAGE_KEYS.AUTH_TOKEN] || null;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[tokenStorage] Error reading token from secure store, checking memory fallback');
    }
    return memoryStorage[STORAGE_KEYS.AUTH_TOKEN] || null;
  }
};

/**
 * Remove JWT token
 */
export const removeToken = async (): Promise<void> => {
  try {
    const isAvailable = await isSecureStoreAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[tokenStorage] Error deleting token from secure store');
    }
  } finally {
    delete memoryStorage[STORAGE_KEYS.AUTH_TOKEN];
  }
};

/**
 * Save user metadata (email, role)
 */
export const saveUser = async (user: AuthUser): Promise<void> => {
  const serialized = JSON.stringify(user);
  try {
    const isAvailable = await isSecureStoreAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_USER, serialized);
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, serialized);
    } else {
      memoryStorage[STORAGE_KEYS.AUTH_USER] = serialized;
    }
  } catch {
    memoryStorage[STORAGE_KEYS.AUTH_USER] = serialized;
  }
};

/**
 * Retrieve user metadata
 */
export const getUser = async (): Promise<AuthUser | null> => {
  try {
    let serialized: string | null = null;
    const isAvailable = await isSecureStoreAvailableAsync();
    if (isAvailable) {
      serialized = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_USER);
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      serialized = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    }
    if (!serialized) {
      serialized = memoryStorage[STORAGE_KEYS.AUTH_USER] || null;
    }
    if (serialized) {
      return JSON.parse(serialized) as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Clear all authentication data (token and user info)
 */
export const clearAuthentication = async (): Promise<void> => {
  await removeToken();
  try {
    const isAvailable = await isSecureStoreAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_USER);
    } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  } catch {
    // Ignore error on clearing
  } finally {
    delete memoryStorage[STORAGE_KEYS.AUTH_USER];
  }
};

export default {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  clearAuthentication,
};
