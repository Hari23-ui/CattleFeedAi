import { apiClient } from './apiClient';
import { CreateSilageSampleRequest, SilageSample, UpdateSilageSampleRequest } from '../models/silage';
import { TestResult } from '../models/testResult';

/**
 * Silage Sample Service
 * Handles silage sample CRUD operations communicating with Spring Boot backend:
 * - POST   /api/silage-samples                       (Register silage sample)
 * - GET    /api/silage-samples                       (List silage samples, optionally ?farmId=X&animalId=Y)
 * - GET    /api/silage-samples/:id                   (Get silage sample by ID)
 * - PUT    /api/silage-samples/:id                   (Update silage sample)
 * - DELETE /api/silage-samples/:id                   (Delete silage sample & cascade test results)
 * - GET    /api/silage-samples/:sampleId/test-results (Get historical test results)
 */
export const silageService = {
  /**
   * Register a new silage sample under an owned farm.
   */
  async createSilageSample(request: CreateSilageSampleRequest): Promise<SilageSample> {
    return apiClient.post<SilageSample>('/api/silage-samples', request);
  },

  /**
   * Retrieve all silage samples accessible to the authenticated farmer,
   * optionally filtered by farmId or animalId.
   */
  async getAllSilageSamples(params?: { farmId?: number; animalId?: number }): Promise<SilageSample[]> {
    const queryParts: string[] = [];
    if (params?.farmId !== undefined && params.farmId !== null) {
      queryParts.push(`farmId=${encodeURIComponent(params.farmId)}`);
    }
    if (params?.animalId !== undefined && params.animalId !== null) {
      queryParts.push(`animalId=${encodeURIComponent(params.animalId)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiClient.get<SilageSample[]>(`/api/silage-samples${queryString}`);
  },

  /**
   * Retrieve a single silage sample by ID.
   */
  async getSilageSampleById(id: number): Promise<SilageSample> {
    return apiClient.get<SilageSample>(`/api/silage-samples/${id}`);
  },

  /**
   * Update an existing silage sample.
   */
  async updateSilageSample(id: number, request: UpdateSilageSampleRequest): Promise<SilageSample> {
    return apiClient.put<SilageSample>(`/api/silage-samples/${id}`, request);
  },

  /**
   * Delete a silage sample and its cascading test results.
   */
  async deleteSilageSample(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/silage-samples/${id}`);
  },

  /**
   * Retrieve historical test results recorded for this silage sample.
   */
  async getTestResultsForSilageSample(sampleId: number): Promise<TestResult[]> {
    return apiClient.get<TestResult[]>(`/api/silage-samples/${sampleId}/test-results`);
  },
};

export default silageService;
