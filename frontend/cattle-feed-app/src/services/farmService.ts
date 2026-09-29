import { apiClient } from './apiClient';
import { CreateFarmRequest, Farm, UpdateFarmRequest } from '../models/farm';

/**
 * Farm Service
 * Handles farm profile CRUD operations communicating with Spring Boot backend:
 * - POST   /api/farms     (Create farm)
 * - GET    /api/farms     (Get farmer's farms)
 * - GET    /api/farms/:id (Get farm by ID)
 * - PUT    /api/farms/:id (Update farm)
 * - DELETE /api/farms/:id (Delete farm)
 */
export const farmService = {
  /**
   * Create a new farm for the authenticated farmer.
   */
  async createFarm(request: CreateFarmRequest): Promise<Farm> {
    return apiClient.post<Farm>('/api/farms', request);
  },

  /**
   * Retrieve all farms belonging to the authenticated farmer.
   */
  async getAllFarms(): Promise<Farm[]> {
    return apiClient.get<Farm[]>('/api/farms');
  },

  /**
   * Retrieve single farm details by ID.
   */
  async getFarmById(id: number): Promise<Farm> {
    return apiClient.get<Farm>(`/api/farms/${id}`);
  },

  /**
   * Update an existing farm.
   */
  async updateFarm(id: number, request: UpdateFarmRequest): Promise<Farm> {
    return apiClient.put<Farm>(`/api/farms/${id}`, request);
  },

  /**
   * Delete an existing farm and associated cascade data.
   */
  async deleteFarm(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/farms/${id}`);
  },
};

export default farmService;
