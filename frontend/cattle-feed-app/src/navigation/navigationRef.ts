import { createNavigationContainerRef } from '@react-navigation/native';
import { AppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function navigate(name: keyof AppStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  }
}

export function getCurrentRouteName(): string {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name || 'Dashboard';
  }
  return 'Dashboard';
}
