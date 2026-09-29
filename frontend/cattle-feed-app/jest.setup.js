/* eslint-disable no-undef */
global.__DEV__ = true;

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (objs) => objs.ios || objs.default,
  },
}));

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));
