/**
 * User Models
 * Maps to backend User entity and roles
 */

export type UserRole = 'FARMER' | 'VET' | 'ADMIN' | 'LAB_TECH';

export interface UserProfile {
  id?: number;
  username: string;
  email: string;
  phone?: string;
  role: UserRole | string;
  language?: string;
  createdAt?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  phone?: string;
  language?: string;
}

