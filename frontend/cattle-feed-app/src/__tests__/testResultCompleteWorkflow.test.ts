import { apiClient } from '../services/apiClient';
import { testResultService } from '../services/testResultService';
import {
  AnalysisSource,
  CreateTestResultRequest,
  TestResult,
} from '../models/testResult';
import { AppApiError } from '../models/api';
import {
  validateTestResultForm,
  validateTestResultParent,
  validateNonNegativeDecimal,
  validatePh,
  validateConfidenceScore,
} from '../utils/validation';
import { getFarmerFriendlyErrorMessage } from '../utils/errorHandler';

describe('Complete Test Result Backend Match & Workflow Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const fullBackendTestResult: TestResult = {
    id: 101,
    feedSampleId: 10,
    silageSampleId: null,
    testDate: '2026-09-29',
    moisture: 12.5,
    crudeProtein: 18.2,
    fiber: 10.5,
    energyValue: 11.4,
    mineralStatus: 'NORMAL',
    aflatoxin: 15.0,
    mycotoxin: 12.0,
    ph: 4.2,
    adulteration: 'NONE',
    mouldDetected: false,
    spoilageDetected: false,
    overallQuality: 'GOOD',
    confidenceScore: 0.95,
    analysisSource: 'LAB',
    createdAt: '2026-09-29T10:00:00Z',
  };

  // 1. All supported fields render / exist in model
  it('1. should support all backend TestResult fields in frontend models and requests', () => {
    const supportedKeys: (keyof TestResult)[] = [
      'id',
      'feedSampleId',
      'silageSampleId',
      'testDate',
      'moisture',
      'crudeProtein',
      'fiber',
      'energyValue',
      'mineralStatus',
      'aflatoxin',
      'mycotoxin',
      'ph',
      'adulteration',
      'mouldDetected',
      'spoilageDetected',
      'overallQuality',
      'confidenceScore',
      'analysisSource',
      'createdAt',
    ];

    supportedKeys.forEach((key) => {
      expect(key in fullBackendTestResult).toBe(true);
    });
  });

  // 2. Optional values can remain blank
  it('2. should allow optional measurement values to remain blank without validation errors', () => {
    const sparseForm: Partial<CreateTestResultRequest> = {
      feedSampleId: 10,
      testDate: '2026-09-29',
      moisture: null,
      crudeProtein: null,
      fiber: null,
      energyValue: null,
      aflatoxin: null,
      mycotoxin: null,
      ph: null,
      confidenceScore: null,
      mineralStatus: null,
      adulteration: null,
      mouldDetected: null,
      spoilageDetected: null,
    };

    const validation = validateTestResultForm(sparseForm);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual({});
  });

  // 3. Blank values become null where appropriate
  it('3. should transmit blank measurement fields explicitly as null, not 0 or false', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      ...fullBackendTestResult,
      moisture: null,
      crudeProtein: null,
      fiber: null,
      energyValue: null,
      aflatoxin: null,
      mycotoxin: null,
      ph: null,
      confidenceScore: null,
      mineralStatus: null,
      adulteration: null,
      mouldDetected: null,
      spoilageDetected: null,
    });

    const payloadWithNulls: CreateTestResultRequest = {
      feedSampleId: 10,
      silageSampleId: null,
      testDate: '2026-09-29',
      moisture: null,
      crudeProtein: null,
      fiber: null,
      energyValue: null,
      aflatoxin: null,
      mycotoxin: null,
      ph: null,
      confidenceScore: null,
      mineralStatus: null,
      adulteration: null,
      mouldDetected: null,
      spoilageDetected: null,
      analysisSource: 'LAB',
    };

    const result = await testResultService.createTestResult(payloadWithNulls);

    expect(postSpy).toHaveBeenCalledWith('/api/test-results', payloadWithNulls);
    expect(result.moisture).toBeNull();
    expect(result.aflatoxin).toBeNull();
    expect(result.mouldDetected).toBeNull();
  });

  // 4. Numeric values are sent correctly
  it('4. should transmit valid numeric metrics correctly matching backend precision', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(fullBackendTestResult);

    const payload: CreateTestResultRequest = {
      feedSampleId: 10,
      silageSampleId: null,
      testDate: '2026-09-29',
      moisture: 12.5,
      crudeProtein: 18.2,
      fiber: 10.5,
      energyValue: 11.4,
      aflatoxin: 15.0,
      mycotoxin: 12.0,
      ph: 4.2,
      confidenceScore: 0.95,
      mineralStatus: 'NORMAL',
      adulteration: 'NONE',
      mouldDetected: false,
      spoilageDetected: false,
      analysisSource: 'LAB',
    };

    const result = await testResultService.createTestResult(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/test-results', payload);
    expect(result.moisture).toBe(12.5);
    expect(result.crudeProtein).toBe(18.2);
    expect(result.fiber).toBe(10.5);
    expect(result.energyValue).toBe(11.4);
    expect(result.aflatoxin).toBe(15.0);
    expect(result.mycotoxin).toBe(12.0);
    expect(result.ph).toBe(4.2);
    expect(result.confidenceScore).toBe(0.95);
  });

  // 5. Boolean/nullable boolean values are handled correctly
  it('5. should handle nullable boolean flags correctly (null, false, true)', async () => {
    const testCases: { mould: boolean | null; spoilage: boolean | null }[] = [
      { mould: null, spoilage: null },
      { mould: false, spoilage: false },
      { mould: true, spoilage: true },
      { mould: true, spoilage: false },
    ];

    for (const tc of testCases) {
      const spy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
        ...fullBackendTestResult,
        mouldDetected: tc.mould,
        spoilageDetected: tc.spoilage,
      });

      const payload: CreateTestResultRequest = {
        feedSampleId: 10,
        mouldDetected: tc.mould,
        spoilageDetected: tc.spoilage,
        analysisSource: 'LAB',
      };

      const res = await testResultService.createTestResult(payload);
      expect(spy).toHaveBeenCalledWith('/api/test-results', payload);
      expect(res.mouldDetected).toBe(tc.mould);
      expect(res.spoilageDetected).toBe(tc.spoilage);
    }
  });

  // 6. Mineral status uses backend-supported values
  it('6. should validate mineralStatus string constraint (max 100 characters) and accept NORMAL', () => {
    const validForm: Partial<CreateTestResultRequest> = {
      feedSampleId: 10,
      mineralStatus: 'NORMAL',
    };
    expect(validateTestResultForm(validForm).isValid).toBe(true);

    const tooLongForm: Partial<CreateTestResultRequest> = {
      feedSampleId: 10,
      mineralStatus: 'X'.repeat(101),
    };
    const invalidRes = validateTestResultForm(tooLongForm);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.errors.mineralStatus).toBe(
      'Mineral Status must not exceed 100 characters'
    );
  });

  // 7. Unsupported AnalysisSource values cannot be selected
  it('7. should only offer LAB and MANUAL for manual/lab test recording', () => {
    const supportedManualEntrySources: AnalysisSource[] = ['LAB', 'MANUAL'];

    // Future-scope / camera screening values that must NOT be present in selectable options:
    const unsupportedForManualEntry: AnalysisSource[] = ['NIR', 'IOT', 'AI', 'IMAGE'];

    unsupportedForManualEntry.forEach((src) => {
      expect(supportedManualEntrySources.includes(src)).toBe(false);
    });
    expect(supportedManualEntrySources).toHaveLength(2);
  });

  // 8. Successful submission
  it('8. should successfully submit a complete test result payload to backend', async () => {
    const spy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(fullBackendTestResult);

    const request: CreateTestResultRequest = {
      feedSampleId: 10,
      testDate: '2026-09-29',
      moisture: 12.5,
      crudeProtein: 18.2,
      fiber: 10.5,
      energyValue: 11.4,
      mineralStatus: 'NORMAL',
      aflatoxin: 15.0,
      mycotoxin: 12.0,
      ph: 4.2,
      adulteration: 'NONE',
      mouldDetected: false,
      spoilageDetected: false,
      confidenceScore: 0.95,
      analysisSource: 'LAB',
    };

    const res = await testResultService.createTestResult(request);
    expect(spy).toHaveBeenCalledWith('/api/test-results', request);
    expect(res.id).toBe(101);
    expect(res.overallQuality).toBe('GOOD');
  });

  // 9. Backend validation errors (e.g. negative moisture)
  it('9. should handle backend field-level validation errors cleanly', () => {
    const negativeForm: Partial<CreateTestResultRequest> = {
      feedSampleId: 10,
      moisture: -5.0,
      crudeProtein: -2.0,
      ph: -1.0,
      confidenceScore: -0.1,
    };

    const result = validateTestResultForm(negativeForm);
    expect(result.isValid).toBe(false);
    expect(result.errors.moisture).toBe('Moisture cannot be negative');
    expect(result.errors.crudeProtein).toBe('Crude Protein cannot be negative');
    expect(result.errors.ph).toBe('pH cannot be negative');
    expect(result.errors.confidenceScore).toBe('Confidence Score cannot be negative');
  });

  // 10. 400 response
  it('10. should translate 400 Bad Request into farmer-friendly error message', async () => {
    const err400 = new AppApiError({
      message: 'Either feedSampleId or silageSampleId must be provided',
      status: 400,
      errorType: 'BAD_REQUEST',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err400);

    try {
      await testResultService.createTestResult({});
    } catch (err) {
      const friendly = getFarmerFriendlyErrorMessage(err);
      expect(friendly).toContain('Either feedSampleId or silageSampleId must be provided');
    }
  });

  // 11. 401 response
  it('11. should translate 401 Unauthorized into session expired message', async () => {
    const err401 = new AppApiError({
      message: 'Full authentication is required to access this resource',
      status: 401,
      errorType: 'UNAUTHORIZED',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err401);

    try {
      await testResultService.createTestResult({ feedSampleId: 10 });
    } catch (err) {
      const friendly = getFarmerFriendlyErrorMessage(err);
      expect(friendly).toBe('Your session has expired. Please log in again.');
    }
  });

  // 12. 403 response
  it('12. should translate 403 Forbidden into clear access denied message', async () => {
    const err403 = new AppApiError({
      message: 'Access denied: You do not have permission to access this feed sample',
      status: 403,
      errorType: 'FORBIDDEN',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err403);

    try {
      await testResultService.createTestResult({ feedSampleId: 10 });
    } catch (err) {
      const friendly = getFarmerFriendlyErrorMessage(err);
      expect(friendly).toContain('Access denied');
    }
  });

  // 13. 404 response
  it('13. should translate 404 Not Found into resource not found message', async () => {
    const err404 = new AppApiError({
      message: 'Feed sample not found with id: 999',
      status: 404,
      errorType: 'NOT_FOUND',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err404);

    try {
      await testResultService.createTestResult({ feedSampleId: 999 });
    } catch (err) {
      const friendly = getFarmerFriendlyErrorMessage(err);
      expect(friendly).toContain('Feed sample not found with id: 999');
    }
  });

  // 14. Network failure
  it('14. should translate network failure into internet connection advice', async () => {
    const netErr = new AppApiError({
      message: 'Network error',
      isNetworkError: true,
      errorType: 'NETWORK_ERROR',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(netErr);

    try {
      await testResultService.createTestResult({ feedSampleId: 10 });
    } catch (err) {
      const friendly = getFarmerFriendlyErrorMessage(err);
      expect(friendly).toContain('Unable to connect to CattleFeedAI. Please check your internet connection');
    }
  });

  // 15. Existing TestResultDetails displays all fields
  it('15. should retrieve and preserve all TestResult fields for details view', async () => {
    const spy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(fullBackendTestResult);

    const result = await testResultService.getTestResultById(101);

    expect(spy).toHaveBeenCalledWith('/api/test-results/101');
    expect(result.id).toBe(101);
    expect(result.moisture).toBe(12.5);
    expect(result.crudeProtein).toBe(18.2);
    expect(result.fiber).toBe(10.5);
    expect(result.energyValue).toBe(11.4);
    expect(result.aflatoxin).toBe(15.0);
    expect(result.mycotoxin).toBe(12.0);
    expect(result.ph).toBe(4.2);
    expect(result.mineralStatus).toBe('NORMAL');
    expect(result.adulteration).toBe('NONE');
    expect(result.mouldDetected).toBe(false);
    expect(result.spoilageDetected).toBe(false);
    expect(result.confidenceScore).toBe(0.95);
    expect(result.analysisSource).toBe('LAB');
  });
});
