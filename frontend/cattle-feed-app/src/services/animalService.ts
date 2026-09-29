import { apiClient } from './apiClient';
import { Animal, CreateAnimalRequest, UpdateAnimalRequest } from '../models/animal';

/**
 * Animal Service
 * Handles livestock CRUD operations communicating with Spring Boot backend:
 * - POST   /api/animals            (Register animal)
 * - GET    /api/animals            (Get user's animals, optionally ?farmId=X)
 * - GET    /api/animals/:id        (Get animal by ID)
 * - PUT    /api/animals/:id        (Update animal)
 * - DELETE /api/animals/:id        (Delete animal)
 */
export const animalService = {
  /**
   * Register a new animal under an owned farm.
   */
  async createAnimal(request: CreateAnimalRequest): Promise<Animal> {
    return apiClient.post<Animal>('/api/animals', request);
  },

  /**
   * Retrieve all animals accessible to the farmer, optionally filtered by farm ID.
   */
  async getAllAnimals(farmId?: number): Promise<Animal[]> {
    const query = farmId !== undefined && farmId !== null ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return apiClient.get<Animal[]>(`/api/animals${query}`);
  },

  /**
   * Retrieve single animal details by ID.
   */
  async getAnimalById(id: number): Promise<Animal> {
    return apiClient.get<Animal>(`/api/animals/${id}`);
  },

  /**
   * Update an existing animal profile.
   */
  async updateAnimal(id: number, request: UpdateAnimalRequest): Promise<Animal> {
    return apiClient.put<Animal>(`/api/animals/${id}`, request);
  },

  /**
   * Delete an animal profile.
   */
  async deleteAnimal(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/animals/${id}`);
  },
};

export default animalService;
