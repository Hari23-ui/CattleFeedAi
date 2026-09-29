import { UpdateProfileRequest, UserProfile } from '../models/user';
import { apiClient } from './apiClient';

/**
 * Service for fetching and updating the authenticated farmer's profile.
 * Integrates directly with /api/users/me on the Spring Boot backend.
 */
export const userService = {
  /**
   * Fetch authenticated user's profile from the backend.
   * GET /api/users/me
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/api/users/me');
  },

  /**
   * Update authenticated user's profile.
   * Only allows updating supported non-security fields: username, phone, language.
   * PUT /api/users/me
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const payload: UpdateProfileRequest = {
      username: data.username?.trim(),
      phone: data.phone?.trim() || undefined,
      language: data.language?.trim() || undefined,
    };
    return apiClient.put<UserProfile>('/api/users/me', payload);
  },
};

export default userService;
