import { apiClient } from './apiClient';
import { CreateFeedSampleRequest, FeedSample, UpdateFeedSampleRequest } from '../models/feed';
import { TestResult } from '../models/testResult';

/**
 * Feed Sample Service
 * Handles feed sample CRUD operations communicating with Spring Boot backend:
 * - POST   /api/feed-samples                     (Register feed sample)
 * - GET    /api/feed-samples                     (List feed samples, optionally ?farmId=X&animalId=Y)
 * - GET    /api/feed-samples/:id                 (Get feed sample by ID)
 * - PUT    /api/feed-samples/:id                 (Update feed sample)
 * - DELETE /api/feed-samples/:id                 (Delete feed sample & cascade test results)
 * - GET    /api/feed-samples/:sampleId/test-results (Get historical test results)
 */
export const feedService = {
  /**
   * Register a new feed sample under an owned farm.
   */
  async createFeedSample(request: CreateFeedSampleRequest): Promise<FeedSample> {
    return apiClient.post<FeedSample>('/api/feed-samples', request);
  },

  /**
   * Retrieve all feed samples accessible to the authenticated farmer,
   * optionally filtered by farmId or animalId.
   */
  async getAllFeedSamples(params?: { farmId?: number; animalId?: number }): Promise<FeedSample[]> {
    const queryParts: string[] = [];
    if (params?.farmId !== undefined && params.farmId !== null) {
      queryParts.push(`farmId=${encodeURIComponent(params.farmId)}`);
    }
    if (params?.animalId !== undefined && params.animalId !== null) {
      queryParts.push(`animalId=${encodeURIComponent(params.animalId)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiClient.get<FeedSample[]>(`/api/feed-samples${queryString}`);
  },

  /**
   * Retrieve a single feed sample by ID.
   */
  async getFeedSampleById(id: number): Promise<FeedSample> {
    return apiClient.get<FeedSample>(`/api/feed-samples/${id}`);
  },

  /**
   * Update an existing feed sample.
   */
  async updateFeedSample(id: number, request: UpdateFeedSampleRequest): Promise<FeedSample> {
    return apiClient.put<FeedSample>(`/api/feed-samples/${id}`, request);
  },

  /**
   * Delete a feed sample and its cascading test results.
   */
  async deleteFeedSample(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/feed-samples/${id}`);
  },

  /**
   * Retrieve historical test results recorded for this feed sample.
   */
  async getTestResultsForFeedSample(sampleId: number): Promise<TestResult[]> {
    return apiClient.get<TestResult[]>(`/api/feed-samples/${sampleId}/test-results`);
  },
};

export default feedService;
