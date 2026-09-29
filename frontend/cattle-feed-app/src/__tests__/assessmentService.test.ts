import { apiClient } from '../services/apiClient';
import { assessmentService } from '../services/assessmentService';
import {
  AssessmentSummaryResponse,
  QualityAssessmentResponse,
} from '../models/assessment';
import { RiskAssessmentResponse } from '../models/risk';
import { AppApiError } from '../models/api';

describe('Assessment Service (M5 Backend Integration)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockQualityResponse: QualityAssessmentResponse = {
    testResultId: 101,
    sampleType: 'FEED',
    sampleId: 10,
    sampleCode: 'FS-TEST-001',
    qualityStatus: 'GOOD',
    explanation: 'Sample assessed as GOOD: All evaluated parameters are within normal baseline thresholds.',
    parameters: [
      {
        parameter: 'MOISTURE',
        measuredValue: 12.0,
        unit: '%',
        status: 'NORMAL',
        evaluationNote: 'Within normal baseline screening threshold',
      },
      {
        parameter: 'CRUDE_PROTEIN',
        measuredValue: 18.5,
        unit: '%',
        status: 'NORMAL',
        evaluationNote: 'Within normal baseline screening threshold',
      },
      {
        parameter: 'AFLATOXIN',
        measuredValue: null,
        unit: 'ppb',
        status: 'NOT_AVAILABLE',
        evaluationNote: 'Parameter not provided in test result',
      },
    ],
    triggeredRulesCount: 0,
    evaluationTimestamp: '2026-09-27T12:00:00',
    disclaimer: 'Quality assessment uses configurable screening rules.',
  };

  const mockRiskResponse: RiskAssessmentResponse = {
    testResultId: 101,
    sampleCode: 'FS-TEST-001',
    overallRiskLevel: 'LOW',
    allRisks: [],
    contaminationRisks: [],
    nutritionalImbalances: [],
    storageSpoilageRisks: [],
    evaluationTimestamp: '2026-09-27T12:00:00',
    screeningDisclaimer: 'Risk assessment identifies potential risk indicators only.',
  };

  const mockSummaryResponse: AssessmentSummaryResponse = {
    qualityAssessment: mockQualityResponse,
    riskAssessment: mockRiskResponse,
    generatedAdvisories: [
      {
        id: 1,
        animalId: 5,
        animalTag: 'COW-01',
        category: 'FEED',
        priority: 'LOW',
        title: 'Optimal Feed Quality',
        message: 'Feed analysis meets standard nutritional baseline.',
        recommendedAction: 'Continue current feeding schedule.',
        isRead: false,
        createdAt: '2026-09-27T12:00:00',
      },
    ],
  };

  describe('getQualityAssessment', () => {
    it('should call GET /api/assessments/test-results/:id and return QualityAssessmentResponse', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockQualityResponse);

      const result = await assessmentService.getQualityAssessment(101);

      expect(getSpy).toHaveBeenCalledWith('/api/assessments/test-results/101');
      expect(result.qualityStatus).toBe('GOOD');
      expect(result.testResultId).toBe(101);
      expect(result.parameters).toHaveLength(3);
      expect(result.parameters[2].status).toBe('NOT_AVAILABLE');
      expect(result.parameters[2].measuredValue).toBeNull();
    });

    it('should propagate 404 when test result is not found', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Test result not found with id: 999',
          status: 404,
          errorType: 'NOT_FOUND',
        })
      );

      await expect(assessmentService.getQualityAssessment(999)).rejects.toThrow(
        'Test result not found with id: 999'
      );
    });

    it('should propagate 403 when user does not own the test result', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Access denied: You do not have permission',
          status: 403,
          errorType: 'FORBIDDEN',
        })
      );

      await expect(assessmentService.getQualityAssessment(101)).rejects.toThrow(
        'Access denied'
      );
    });

    it('should propagate 401 when unauthorized', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Unauthorized',
          status: 401,
          errorType: 'UNAUTHORIZED',
        })
      );

      await expect(assessmentService.getQualityAssessment(101)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('getRiskAssessment', () => {
    it('should call GET /api/assessments/test-results/:id/risk and return RiskAssessmentResponse', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockRiskResponse);

      const result = await assessmentService.getRiskAssessment(101);

      expect(getSpy).toHaveBeenCalledWith('/api/assessments/test-results/101/risk');
      expect(result.overallRiskLevel).toBe('LOW');
      expect(result.allRisks).toEqual([]);
      expect(result.screeningDisclaimer).toBeDefined();
    });
  });

  describe('evaluateAndGenerateAdvisories', () => {
    it('should call POST /api/assessments/test-results/:id and return consolidated AssessmentSummaryResponse', async () => {
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockSummaryResponse);

      const result = await assessmentService.evaluateAndGenerateAdvisories(101);

      expect(postSpy).toHaveBeenCalledWith('/api/assessments/test-results/101');
      expect(result.qualityAssessment.qualityStatus).toBe('GOOD');
      expect(result.riskAssessment.overallRiskLevel).toBe('LOW');
      expect(result.generatedAdvisories).toHaveLength(1);
      expect(result.generatedAdvisories[0].title).toBe('Optimal Feed Quality');
    });
  });

  describe('getLatestFeedSampleAssessment', () => {
    it('should call GET /api/assessments/feed-samples/:id and return latest assessment', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockQualityResponse);

      const result = await assessmentService.getLatestFeedSampleAssessment(10);

      expect(getSpy).toHaveBeenCalledWith('/api/assessments/feed-samples/10');
      expect(result.sampleType).toBe('FEED');
    });
  });

  describe('getLatestSilageSampleAssessment', () => {
    it('should call GET /api/assessments/silage-samples/:id and return latest assessment', async () => {
      const silageQualityResponse: QualityAssessmentResponse = {
        ...mockQualityResponse,
        sampleType: 'SILAGE',
        sampleId: 20,
        sampleCode: 'SS-TEST-001',
      };
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(silageQualityResponse);

      const result = await assessmentService.getLatestSilageSampleAssessment(20);

      expect(getSpy).toHaveBeenCalledWith('/api/assessments/silage-samples/20');
      expect(result.sampleType).toBe('SILAGE');
    });
  });
});
