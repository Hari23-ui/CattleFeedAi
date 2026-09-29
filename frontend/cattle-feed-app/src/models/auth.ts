/**
 * Authentication Data Models
 * Matches backend DTOs:
 * - LoginRequest.java
 * - RegisterRequest.java
 * - AuthResponse.java
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  language?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  email: string;
  role: string;
}

export interface AuthUser {
  email: string;
  role: string;
  username?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
