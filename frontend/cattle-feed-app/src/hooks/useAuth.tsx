import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthState, AuthUser, LoginRequest, RegisterRequest } from '../models/auth';
import { apiClient, setOnUnauthorizedListener } from '../services/apiClient';
import { authService } from '../services/authService';
import { clearAuthentication, getToken, getUser } from '../storage/tokenStorage';
import { getFarmerFriendlyErrorMessage } from '../utils/errorHandler';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      await clearAuthentication();
    } finally {
      setToken(null);
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  // Listen to 401 Unauthorized responses from ApiClient
  useEffect(() => {
    setOnUnauthorizedListener(() => {
      logout();
    });
    return () => {
      setOnUnauthorizedListener(null);
    };
  }, [logout]);

  // Restore authentication state on startup
  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          const storedUser = await getUser();
          if (isMounted) {
            setToken(storedToken);
            setUser(storedUser);
          }
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[AuthProvider] Failed to restore auth state:', err);
        }
        await clearAuthentication();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser({
        email: response.email,
        role: response.role,
      });
    } catch (err: unknown) {
      const friendlyMsg = getFarmerFriendlyErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      setToken(response.token);
      setUser({
        email: response.email,
        role: response.role,
        username: data.username,
      });
    } catch (err: unknown) {
      const friendlyMsg = getFarmerFriendlyErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, token, isLoading, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
