import { Platform } from 'react-native';

describe('CattleFeedAI Frontend Configuration & Environment Resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('resolves API_BASE_URL from EXPO_PUBLIC_API_BASE_URL when present', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.cattlefeedai.production.com';
    const { API_BASE_URL } = require('../constants/config');
    expect(API_BASE_URL).toBe('https://api.cattlefeedai.production.com');
  });

  it('falls back to local development URL when env var is not set on web/iOS', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    (Platform as any).OS = 'web';
    const { API_BASE_URL } = require('../constants/config');
    expect(API_BASE_URL).toBe('http://localhost:8080');
  });

  it('falls back to 10.0.2.2 on Android emulator when env var is not set', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'android',
        select: (objs: any) => objs.android || objs.default,
      },
    }));
    const { API_BASE_URL } = require('../constants/config');
    expect(API_BASE_URL).toBe('http://10.0.2.2:8080');
  });

  it('resolves AI_SERVICE_URL from EXPO_PUBLIC_AI_SERVICE_URL when present', () => {
    process.env.EXPO_PUBLIC_AI_SERVICE_URL = 'https://ai.cattlefeedai.production.com';
    const { AI_SERVICE_URL } = require('../constants/config');
    expect(AI_SERVICE_URL).toBe('https://ai.cattlefeedai.production.com');
  });
});
