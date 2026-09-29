import { apiClient } from './apiClient';
import {
  AssessmentSummaryResponse,
  QualityAssessmentResponse,
} from '../models/assessment';
import { RiskAssessmentResponse } from '../models/risk';

/**
 * Assessment Service
 * Communicates with backend M5 endpoints:
 * - GET  /api/assessments/test-results/:id        (Quality assessment for a test result)
 * - GET  /api/assessments/test-results/:id/risk   (Risk screening for a test result)
 * - POST /api/assessments/test-results/:id        (Evaluate quality + risk & generate advisories)
 * - GET  /api/assessments/feed-samples/:id        (Latest quality assessment for feed sample)
 * - GET  /api/assessments/silage-samples/:id      (Latest quality assessment for silage sample)
 */
export const assessmentService = {
  /**
   * Evaluates parameters from a test result against backend rules
   * and returns structured quality status.
   */
  async getQualityAssessment(testResultId: number): Promise<QualityAssessmentResponse> {
    return apiClient.get<QualityAssessmentResponse>(
      `/api/assessments/test-results/${encodeURIComponent(testResultId)}`
    );
  },

  /**
   * Retrieves non-diagnostic risk screening for a test result.
   */
  async getRiskAssessment(testResultId: number): Promise<RiskAssessmentResponse> {
    return apiClient.get<RiskAssessmentResponse>(
      `/api/assessments/test-results/${encodeURIComponent(testResultId)}/risk`
    );
  },

  /**
   * Evaluates quality and risk layers and generates/persists advisories.
   */
  async evaluateAndGenerateAdvisories(
    testResultId: number
  ): Promise<AssessmentSummaryResponse> {
    return apiClient.post<AssessmentSummaryResponse>(
      `/api/assessments/test-results/${encodeURIComponent(testResultId)}`
    );
  },

  /**
   * Evaluates the most recent test result recorded for a feed sample.
   */
  async getLatestFeedSampleAssessment(
    feedSampleId: number
  ): Promise<QualityAssessmentResponse> {
    return apiClient.get<QualityAssessmentResponse>(
      `/api/assessments/feed-samples/${encodeURIComponent(feedSampleId)}`
    );
  },

  /**
   * Evaluates the most recent test result recorded for a silage sample.
   */
  async getLatestSilageSampleAssessment(
    silageSampleId: number
  ): Promise<QualityAssessmentResponse> {
    return apiClient.get<QualityAssessmentResponse>(
      `/api/assessments/silage-samples/${encodeURIComponent(silageSampleId)}`
    );
  },
};

export default assessmentService;
