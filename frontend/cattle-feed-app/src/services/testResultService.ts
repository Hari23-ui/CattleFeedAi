import { apiClient } from './apiClient';
import { CreateTestResultRequest, TestResult } from '../models/testResult';

/**
 * Test Result Service
 * Handles test result recording and retrieval communicating with Spring Boot backend:
 * - POST /api/test-results
 * - GET  /api/test-results/:id
 * - GET  /api/test-results/feed-sample/:sampleId
 * - GET  /api/test-results/silage-sample/:sampleId
 */
export const testResultService = {
  /**
   * Record a new physical, chemical, or sensory test result for a feed or silage sample.
   */
  async createTestResult(request: CreateTestResultRequest): Promise<TestResult> {
    return apiClient.post<TestResult>('/api/test-results', request);
  },

  /**
   * Retrieve single test result details by ID.
   */
  async getTestResultById(id: number): Promise<TestResult> {
    return apiClient.get<TestResult>(`/api/test-results/${id}`);
  },

  /**
   * Retrieve all historical test results for a feed sample.
   */
  async getTestResultsByFeedSampleId(feedSampleId: number): Promise<TestResult[]> {
    return apiClient.get<TestResult[]>(`/api/test-results/feed-sample/${feedSampleId}`);
  },

  /**
   * Retrieve all historical test results for a silage sample.
   */
  async getTestResultsBySilageSampleId(silageSampleId: number): Promise<TestResult[]> {
    return apiClient.get<TestResult[]>(`/api/test-results/silage-sample/${silageSampleId}`);
  },
};

export default testResultService;
