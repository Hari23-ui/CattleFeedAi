import { AuthState } from '../models/auth';

/**
 * Route decider logic mapping auth state to active navigator
 */
export const getActiveNavigator = (state: AuthState): 'LOADING' | 'APP' | 'AUTH' => {
  if (state.isLoading) {
    return 'LOADING';
  }
  if (state.isAuthenticated && state.token) {
    return 'APP';
  }
  return 'AUTH';
};

describe('Navigation State Routing', () => {
  it('should route to LOADING when state is loading on startup', () => {
    const state: AuthState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    };
    expect(getActiveNavigator(state)).toBe('LOADING');
  });

  it('should route to AUTH navigator when user is unauthenticated', () => {
    const state: AuthState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
    expect(getActiveNavigator(state)).toBe('AUTH');
  });

  it('should route to APP navigator when user is authenticated with valid token', () => {
    const state: AuthState = {
      user: { email: 'farmer@greenpastures.com', role: 'FARMER' },
      token: 'valid.jwt.token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
    expect(getActiveNavigator(state)).toBe('APP');
  });

  it('should route back to AUTH navigator when user logs out', () => {
    let state: AuthState = {
      user: { email: 'farmer@greenpastures.com', role: 'FARMER' },
      token: 'valid.jwt.token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
    expect(getActiveNavigator(state)).toBe('APP');

    // Simulate logout
    state = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
    expect(getActiveNavigator(state)).toBe('AUTH');
  });
});
