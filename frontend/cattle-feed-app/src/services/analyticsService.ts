import { apiClient } from './apiClient';
import {
  AnimalAnalytics,
  FarmAnalyticsSummary,
  SampleHistoricalTrends,
} from '../models/analytics';

/**
 * Analytics and Historical Trends Service
 * Communicates with backend endpoints:
 * - GET /api/analytics/summary
 * - GET /api/analytics/animals/:animalId
 * - GET /api/analytics/animals/:animalId/history
 * - GET /api/analytics/feed-samples/:feedSampleId
 * - GET /api/analytics/silage-samples/:silageSampleId
 */
export const analyticsService = {
  /**
   * Retrieve aggregate farm analytics summary with optional days filter.
   */
  async getFarmSummary(days?: number): Promise<FarmAnalyticsSummary> {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<FarmAnalyticsSummary>(`/api/analytics/summary${query}`);
  },

  /**
   * Retrieve historical analytics and test history for a specific animal.
   */
  async getAnimalAnalytics(animalId: number, days?: number): Promise<AnimalAnalytics> {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<AnimalAnalytics>(`/api/analytics/animals/${animalId}${query}`);
  },

  /**
   * Retrieve historical analytics (alias endpoint) for a specific animal.
   */
  async getAnimalHistory(animalId: number, days?: number): Promise<AnimalAnalytics> {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<AnimalAnalytics>(`/api/analytics/animals/${animalId}/history${query}`);
  },

  /**
   * Retrieve chronological test trends for a feed sample.
   */
  async getFeedSampleHistory(feedSampleId: number, days?: number): Promise<SampleHistoricalTrends> {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<SampleHistoricalTrends>(`/api/analytics/feed-samples/${feedSampleId}${query}`);
  },

  /**
   * Retrieve chronological test trends for a silage sample.
   */
  async getSilageSampleHistory(silageSampleId: number, days?: number): Promise<SampleHistoricalTrends> {
    const query = days ? `?days=${days}` : '';
    return apiClient.get<SampleHistoricalTrends>(`/api/analytics/silage-samples/${silageSampleId}${query}`);
  },
};

export default analyticsService;
