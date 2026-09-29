import { apiClient } from './apiClient';
import { FeedPlan, FeedPlanRequest } from '../models/feedPlan';

/**
 * Service for interacting with Feed Planning & Management REST API (M11).
 *
 * Endpoints:
 * - GET /api/feed-plans
 * - GET /api/feed-plans/{id}
 * - POST /api/feed-plans
 * - PUT /api/feed-plans/{id}
 * - DELETE /api/feed-plans/{id}
 */
export const feedPlanService = {
  /**
   * Fetch all feed plans for the authenticated farmer.
   */
  async getAllFeedPlans(): Promise<FeedPlan[]> {
    return apiClient.get<FeedPlan[]>('/api/feed-plans');
  },

  /**
   * Fetch a specific feed plan by ID with animal, feed/silage, quality/risk and advisory context.
   */
  async getFeedPlanById(id: number): Promise<FeedPlan> {
    return apiClient.get<FeedPlan>(`/api/feed-plans/${id}`);
  },

  /**
   * Create a new feed plan.
   */
  async createFeedPlan(data: FeedPlanRequest): Promise<FeedPlan> {
    return apiClient.post<FeedPlan>('/api/feed-plans', data);
  },

  /**
   * Update an existing feed plan.
   */
  async updateFeedPlan(id: number, data: FeedPlanRequest): Promise<FeedPlan> {
    return apiClient.put<FeedPlan>(`/api/feed-plans/${id}`, data);
  },

  /**
   * Delete a feed plan by ID.
   */
  async deleteFeedPlan(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/feed-plans/${id}`);
  },
};

export default feedPlanService;
