import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../models/auth';
import { clearAuthentication, saveToken, saveUser } from '../storage/tokenStorage';
import { apiClient } from './apiClient';

/**
 * CattleFeedAI Authentication Service
 * Communicates with Spring Boot backend endpoints under /api/auth
 */

export const authService = {
  /**
   * Log in user with email and password
   * POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials, {
      skipAuth: true,
    });

    if (response?.token) {
      await saveToken(response.token);
      const user: AuthUser = {
        email: response.email,
        role: response.role,
      };
      await saveUser(user);
    }

    return response;
  },

  /**
   * Register a new farmer account
   * POST /api/auth/register
   * Normal farmer self-registration creates FARMER role.
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const payload: RegisterRequest = {
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
      phone: data.phone?.trim() || undefined,
      language: data.language?.trim() || 'en',
    };

    const response = await apiClient.post<AuthResponse>('/api/auth/register', payload, {
      skipAuth: true,
    });

    if (response?.token) {
      await saveToken(response.token);
      const user: AuthUser = {
        email: response.email,
        role: response.role,
        username: data.username,
      };
      await saveUser(user);
    }

    return response;
  },

  /**
   * Log out current user and clear local secure tokens
   */
  async logout(): Promise<void> {
    await clearAuthentication();
  },
};

export default authService;
