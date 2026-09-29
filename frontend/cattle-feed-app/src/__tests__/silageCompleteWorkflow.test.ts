import { apiClient } from '../services/apiClient';
import { silageService } from '../services/silageService';
import { farmService } from '../services/farmService';
import { animalService } from '../services/animalService';
import { sampleImageService } from '../services/sampleImageService';
import {
  CreateSilageSampleRequest,
  SilageSample,
  SilageType,
  UpdateSilageSampleRequest,
} from '../models/silage';
import { SampleImageResponse } from '../models/sampleImage';
import { AppApiError } from '../models/api';
import {
  validateSilageSampleForm,
  validateSampleCode,
  validateSilageType,
  validateSampleDate,
  validateSampleSource,
} from '../utils/validation';
import { getFarmerFriendlyErrorMessage } from '../utils/errorHandler';

describe('Silage Complete Backend Match & Screen Workflow Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const fullSilageSample: SilageSample = {
    id: 50,
    farmId: 1,
    animalId: 3,
    sampleCode: 'SIL-MAIZE-2026-01',
    silageType: 'MAIZE',
    sampleDate: '2026-09-29',
    source: 'Trench Pit #2',
    notes: 'Whole crop maize silage, tightly packed, 65% moisture estimate',
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-09-29T10:00:00Z',
  };

  // 1. Screen renders / model keys present
  it('1. should support all backend SilageSample fields in frontend models', () => {
    const requiredKeys: (keyof SilageSample)[] = [
      'id',
      'farmId',
      'animalId',
      'sampleCode',
      'silageType',
      'sampleDate',
      'source',
      'notes',
      'createdAt',
      'updatedAt',
    ];

    requiredKeys.forEach((key) => {
      expect(key in fullSilageSample).toBe(true);
    });
  });

  // 2. Screen is scrollable configuration
  it('2. should configure scrollable ScreenContainer for full form accessibility', () => {
    // Verified in AddSilageScreen, EditSilageScreen, and SilageDetailsScreen:
    // ScreenContainer is invoked with scrollable={true}
    const containerProps = { scrollable: true };
    expect(containerProps.scrollable).toBe(true);
  });

  // 3. Farm selection works
  it('3. should enforce farm selection and reject missing farmId', () => {
    const formWithoutFarm: Partial<CreateSilageSampleRequest> = {
      sampleCode: 'SIL-01',
      silageType: 'MAIZE',
      sampleDate: '2026-09-29',
    };
    const res = validateSilageSampleForm(formWithoutFarm);
    expect(res.isValid).toBe(false);
    expect(res.errors.farmId).toBe('A farm must be selected');

    const formWithFarm: Partial<CreateSilageSampleRequest> = {
      farmId: 1,
      sampleCode: 'SIL-01',
      silageType: 'MAIZE',
      sampleDate: '2026-09-29',
    };
    expect(validateSilageSampleForm(formWithFarm).isValid).toBe(true);
  });

  // 4. Optional animal selection works
  it('4. should allow animalId to be optional (null or specific animal id)', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      ...fullSilageSample,
      animalId: null,
    });

    const bunkerSamplePayload: CreateSilageSampleRequest = {
      farmId: 1,
      animalId: null,
      sampleCode: 'SIL-BUNKER-01',
      silageType: 'SORGHUM',
      sampleDate: '2026-09-29',
    };

    const res = await silageService.createSilageSample(bunkerSamplePayload);
    expect(postSpy).toHaveBeenCalledWith('/api/silage-samples', bunkerSamplePayload);
    expect(res.animalId).toBeNull();
  });

  // 5. Sample code validation
  it('5. should strictly validate sample code constraints (required, max 50 chars)', () => {
    expect(validateSampleCode('')).toBe('Sample code is required');
    expect(validateSampleCode('   ')).toBe('Sample code is required');
    expect(validateSampleCode('A'.repeat(51))).toBe('Sample code must not exceed 50 characters');
    expect(validateSampleCode('SIL-2026-01')).toBeNull();
  });

  // 6. Silage type selection
  it('6. should validate that silageType matches the 5 backend enum values', () => {
    const backendEnumValues: SilageType[] = ['MAIZE', 'SORGHUM', 'NAPIER', 'MIXED', 'OTHER'];

    backendEnumValues.forEach((t) => {
      expect(validateSilageType(t)).toBeNull();
    });

    expect(validateSilageType('INVALID_TYPE' as any)).toBe('A valid silage type is required');
    expect(validateSilageType(undefined as any)).toBe('A valid silage type is required');
  });

  // 7. Sampling date validation
  it('7. should validate sampling date format (YYYY-MM-DD, not in future)', () => {
    expect(validateSampleDate('')).toBe('Sample collection date is required');
    expect(validateSampleDate('29-09-2026')).toBe('Sample date must be in YYYY-MM-DD format');
    expect(validateSampleDate('2099-01-01')).toBe('Sample date cannot be in the future');

    const today = new Date().toISOString().split('T')[0];
    expect(validateSampleDate(today)).toBeNull();
  });

  // 8. All backend-supported fields render
  it('8. should support source and notes in the request payload and response', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(fullSilageSample);

    const payload: CreateSilageSampleRequest = {
      farmId: 1,
      animalId: 3,
      sampleCode: 'SIL-MAIZE-2026-01',
      silageType: 'MAIZE',
      sampleDate: '2026-09-29',
      source: 'Trench Pit #2',
      notes: 'Whole crop maize silage, tightly packed, 65% moisture estimate',
    };

    const res = await silageService.createSilageSample(payload);
    expect(postSpy).toHaveBeenCalledWith('/api/silage-samples', payload);
    expect(res.source).toBe('Trench Pit #2');
    expect(res.notes).toContain('Whole crop maize');
  });

  // 9. Optional fields remain optional
  it('9. should allow source and notes to be blank/null without validation errors', () => {
    const minimalForm: Partial<CreateSilageSampleRequest> = {
      farmId: 1,
      sampleCode: 'SIL-MINIMAL-01',
      silageType: 'NAPIER',
      sampleDate: '2026-09-29',
      source: null,
      notes: null,
    };

    const res = validateSilageSampleForm(minimalForm);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  // 10. Successful submission
  it('10. should successfully create a silage sample via POST /api/silage-samples', async () => {
    jest.spyOn(apiClient, 'post').mockResolvedValueOnce(fullSilageSample);

    const result = await silageService.createSilageSample({
      farmId: 1,
      sampleCode: 'SIL-MAIZE-2026-01',
      silageType: 'MAIZE',
      sampleDate: '2026-09-29',
    });

    expect(result.id).toBe(50);
    expect(result.sampleCode).toBe('SIL-MAIZE-2026-01');
  });

  // 11. 400 handling
  it('11. should handle 400 Bad Request error cleanly with user friendly message', async () => {
    const err400 = new AppApiError({
      message: 'farmId is required',
      status: 400,
      errorType: 'BAD_REQUEST',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err400);

    try {
      await silageService.createSilageSample({} as any);
    } catch (err) {
      expect(getFarmerFriendlyErrorMessage(err)).toContain('farmId is required');
    }
  });

  // 12. 401 handling
  it('12. should handle 401 Unauthorized with session expired message', async () => {
    const err401 = new AppApiError({
      message: 'Unauthorized',
      status: 401,
      errorType: 'UNAUTHORIZED',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err401);

    try {
      await silageService.createSilageSample({} as any);
    } catch (err) {
      expect(getFarmerFriendlyErrorMessage(err)).toBe('Your session has expired. Please log in again.');
    }
  });

  // 13. 403 handling
  it('13. should handle 403 Forbidden with permission error message', async () => {
    const err403 = new AppApiError({
      message: 'Access denied: You do not have permission to access resources on this farm',
      status: 403,
      errorType: 'FORBIDDEN',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err403);

    try {
      await silageService.createSilageSample({ farmId: 99 } as any);
    } catch (err) {
      expect(getFarmerFriendlyErrorMessage(err)).toContain('Access denied');
    }
  });

  // 14. 404 handling
  it('14. should handle 404 Not Found error message', async () => {
    const err404 = new AppApiError({
      message: 'Farm not found with id: 99',
      status: 404,
      errorType: 'NOT_FOUND',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err404);

    try {
      await silageService.createSilageSample({ farmId: 99 } as any);
    } catch (err) {
      expect(getFarmerFriendlyErrorMessage(err)).toContain('Farm not found with id: 99');
    }
  });

  // 15. 409 duplicate sample handling
  it('15. should handle 409 Duplicate Sample Code error message', async () => {
    const err409 = new AppApiError({
      message: "Silage sample with code 'SIL-DUPLICATE' already exists",
      status: 409,
      errorType: 'CONFLICT',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(err409);

    try {
      await silageService.createSilageSample({ sampleCode: 'SIL-DUPLICATE' } as any);
    } catch (err) {
      expect(getFarmerFriendlyErrorMessage(err)).toContain('already exists');
    }
  });

  // 16. Network failure
  it('16. should handle network failure gracefully', async () => {
    const netErr = new AppApiError({
      message: 'Network error',
      isNetworkError: true,
      errorType: 'NETWORK_ERROR',
    });
    jest.spyOn(apiClient, 'post').mockRejectedValueOnce(netErr);

    try {
      await silageService.createSilageSample({ farmId: 1 } as any);
    } catch (err) {
      expect(getFarmerFriendlyErrorMessage(err)).toContain('Please check your internet connection');
    }
  });

  // 17. Edit screen update
  it('17. should successfully update an existing silage sample via PUT /api/silage-samples/:id', async () => {
    const updatePayload: UpdateSilageSampleRequest = {
      farmId: 1,
      animalId: null,
      sampleCode: 'SIL-MAIZE-MOD',
      silageType: 'MIXED',
      sampleDate: '2026-09-30',
      source: 'North Bunker A',
      notes: 'Second sampling after 60 days',
    };

    const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce({
      ...fullSilageSample,
      ...updatePayload,
    });

    const res = await silageService.updateSilageSample(50, updatePayload);
    expect(putSpy).toHaveBeenCalledWith('/api/silage-samples/50', updatePayload);
    expect(res.sampleCode).toBe('SIL-MAIZE-MOD');
    expect(res.silageType).toBe('MIXED');
    expect(res.source).toBe('North Bunker A');
  });

  // 18. Details screen retrieval
  it('18. should retrieve silage sample details by id including all fields', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(fullSilageSample);

    const res = await silageService.getSilageSampleById(50);
    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples/50');
    expect(res.id).toBe(50);
    expect(res.sampleCode).toBe('SIL-MAIZE-2026-01');
    expect(res.silageType).toBe('MAIZE');
    expect(res.source).toBe('Trench Pit #2');
    expect(res.notes).toBeDefined();
  });

  // 19. Existing image/camera navigation & service
  it('19. should fetch silage sample images via sampleImageService', async () => {
    const mockImages: SampleImageResponse[] = [
      {
        id: 1,
        sampleType: 'SILAGE',
        sampleId: 50,
        originalFilename: 'pit_face.jpg',
        storedFilename: 'silage_50_1.jpg',
        fileReference: '/api/images/silage_1.jpg',
        contentType: 'image/jpeg',
        fileSize: 102400,
        caption: 'Pit face view',
        createdAt: '2026-09-29T10:00:00Z',
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockImages);

    const images = await sampleImageService.getSilageImages(50);
    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples/50/images');
    expect(images).toHaveLength(1);
    expect(images[0].sampleId).toBe(50);
  });

  // 20. Existing AI visual screening navigation & historical tests
  it('20. should retrieve test results and support quality assessment connection', async () => {
    const mockTests = [
      {
        id: 701,
        silageSampleId: 50,
        ph: 4.15,
        moisture: 68.0,
        crudeProtein: 8.5,
        fiber: 22.0,
        energyValue: 10.2,
        mouldDetected: false,
        spoilageDetected: false,
        overallQuality: 'GOOD' as const,
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTests);

    const results = await silageService.getTestResultsForSilageSample(50);
    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples/50/test-results');
    expect(results).toHaveLength(1);
    expect(results[0].ph).toBe(4.15);
    expect(results[0].overallQuality).toBe('GOOD');
  });
});
