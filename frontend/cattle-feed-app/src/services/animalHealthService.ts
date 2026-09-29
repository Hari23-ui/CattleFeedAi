import { apiClient } from './apiClient';
import { AnimalHealthScreeningResponse } from '../models/animalHealth';
import { FeedSample } from '../models/feed';
import { SilageSample } from '../models/silage';
import { AdvisoryResponse } from '../models/advisory';
import { TestResult } from '../models/testResult';

/**
 * Animal Health Screening Service
 * Communicates with backend endpoints:
 * - GET /api/assessments/animals/:id/health-screening
 * - GET /api/feed-samples?animalId=:id
 * - GET /api/silage-samples?animalId=:id
 * - GET /api/advisories?animalId=:id
 * - GET /api/test-results/feed-sample/:id
 * - GET /api/test-results/silage-sample/:id
 */
export const animalHealthService = {
  /**
   * Retrieves non-diagnostic health screening for an animal,
   * correlating lactation demands, feed test history, and observations.
   */
  async screenAnimalHealth(animalId: number): Promise<AnimalHealthScreeningResponse> {
    return apiClient.get<AnimalHealthScreeningResponse>(
      `/api/assessments/animals/${encodeURIComponent(animalId)}/health-screening`
    );
  },

  /**
   * Retrieves feed samples associated with this animal.
   */
  async getAnimalFeedSamples(animalId: number): Promise<FeedSample[]> {
    return apiClient.get<FeedSample[]>(
      `/api/feed-samples?animalId=${encodeURIComponent(animalId)}`
    );
  },

  /**
   * Retrieves silage samples associated with this animal.
   */
  async getAnimalSilageSamples(animalId: number): Promise<SilageSample[]> {
    return apiClient.get<SilageSample[]>(
      `/api/silage-samples?animalId=${encodeURIComponent(animalId)}`
    );
  },

  /**
   * Retrieves rule-derived advisories generated for this animal.
   */
  async getAnimalAdvisories(animalId: number): Promise<AdvisoryResponse[]> {
    return apiClient.get<AdvisoryResponse[]>(
      `/api/advisories?animalId=${encodeURIComponent(animalId)}`
    );
  },

  /**
   * Retrieves historical test results for a feed sample.
   */
  async getTestResultsByFeedSample(sampleId: number): Promise<TestResult[]> {
    return apiClient.get<TestResult[]>(
      `/api/test-results/feed-sample/${encodeURIComponent(sampleId)}`
    );
  },

  /**
   * Retrieves historical test results for a silage sample.
   */
  async getTestResultsBySilageSample(sampleId: number): Promise<TestResult[]> {
    return apiClient.get<TestResult[]>(
      `/api/test-results/silage-sample/${encodeURIComponent(sampleId)}`
    );
  },
};

export default animalHealthService;
