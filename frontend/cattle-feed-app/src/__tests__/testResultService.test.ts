import { apiClient } from '../services/apiClient';
import { testResultService } from '../services/testResultService';
import { CreateTestResultRequest, TestResult } from '../models/testResult';
import { AppApiError } from '../models/api';

describe('Test Result Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockTestResult: TestResult = {
    id: 50,
    feedSampleId: 10,
    silageSampleId: null,
    testDate: '2026-09-27',
    moisture: 12.0,
    crudeProtein: 18.5,
    fiber: 10.0,
    energyValue: 11.2,
    mineralStatus: 'Adequate',
    aflatoxin: 12.5,
    mycotoxin: 0.3,
    ph: 6.2,
    adulteration: 'None',
    mouldDetected: false,
    spoilageDetected: false,
    overallQuality: 'GOOD',
    confidenceScore: 0.94,
    analysisSource: 'LAB',
    createdAt: '2026-09-27T10:00:00Z',
  };

  it('should record a test result via POST /api/test-results', async () => {
    const payload: CreateTestResultRequest = {
      feedSampleId: 10,
      testDate: '2026-09-27',
      moisture: 12.0,
      crudeProtein: 18.5,
      fiber: 10.0,
      energyValue: 11.2,
      mineralStatus: 'Adequate',
      aflatoxin: 12.5,
      mycotoxin: 0.3,
      ph: 6.2,
      adulteration: 'None',
      mouldDetected: false,
      spoilageDetected: false,
      confidenceScore: 0.94,
      analysisSource: 'LAB',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockTestResult);

    const result = await testResultService.createTestResult(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/test-results', payload);
    expect(result.id).toBe(50);
    expect(result.feedSampleId).toBe(10);
    expect(result.crudeProtein).toBe(18.5);
    expect(result.overallQuality).toBe('GOOD');
  });

  it('should retrieve test result by ID via GET /api/test-results/:id', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTestResult);

    const result = await testResultService.getTestResultById(50);

    expect(getSpy).toHaveBeenCalledWith('/api/test-results/50');
    expect(result).toEqual(mockTestResult);
  });

  it('should retrieve test results for feed sample via GET /api/test-results/feed-sample/:sampleId', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockTestResult]);

    const result = await testResultService.getTestResultsByFeedSampleId(10);

    expect(getSpy).toHaveBeenCalledWith('/api/test-results/feed-sample/10');
    expect(result).toHaveLength(1);
    expect(result[0].feedSampleId).toBe(10);
  });

  it('should retrieve test results for silage sample via GET /api/test-results/silage-sample/:sampleId', async () => {
    const silageTest: TestResult = {
      ...mockTestResult,
      id: 51,
      feedSampleId: null,
      silageSampleId: 20,
      ph: 4.2,
      moisture: 65.0,
    };

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([silageTest]);

    const result = await testResultService.getTestResultsBySilageSampleId(20);

    expect(getSpy).toHaveBeenCalledWith('/api/test-results/silage-sample/20');
    expect(result).toHaveLength(1);
    expect(result[0].silageSampleId).toBe(20);
    expect(result[0].ph).toBe(4.2);
  });

  it('should preserve nullable fields when measurements are not supplied', async () => {
    const sparseResult: TestResult = {
      id: 52,
      feedSampleId: 10,
      silageSampleId: null,
      testDate: '2026-09-27',
      moisture: null,
      crudeProtein: null,
      fiber: null,
      energyValue: null,
      mineralStatus: null,
      aflatoxin: null,
      mycotoxin: null,
      ph: null,
      adulteration: null,
      mouldDetected: null,
      spoilageDetected: null,
      overallQuality: null,
      confidenceScore: null,
      analysisSource: 'MANUAL',
    };

    jest.spyOn(apiClient, 'get').mockResolvedValueOnce(sparseResult);

    const result = await testResultService.getTestResultById(52);

    expect(result.moisture).toBeNull();
    expect(result.crudeProtein).toBeNull();
    expect(result.fiber).toBeNull();
    expect(result.aflatoxin).toBeNull();
    expect(result.mouldDetected).toBeNull();
    expect(result.overallQuality).toBeNull();
  });

  it('should handle API errors when creating or fetching test results', async () => {
    const error = new AppApiError({ message: 'Test result not found', status: 404, errorType: 'NOT_FOUND' });
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce(error);

    await expect(testResultService.getTestResultById(999)).rejects.toThrow('Test result not found');
  });
});
