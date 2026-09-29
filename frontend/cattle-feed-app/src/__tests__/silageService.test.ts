import { apiClient } from '../services/apiClient';
import { silageService } from '../services/silageService';
import { CreateSilageSampleRequest, SilageSample, UpdateSilageSampleRequest } from '../models/silage';
import { TestResult } from '../models/testResult';
import { AppApiError } from '../models/api';

describe('Silage Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockSilageSample: SilageSample = {
    id: 20,
    farmId: 1,
    animalId: null,
    sampleCode: 'SIL-TEST-001',
    silageType: 'MAIZE',
    sampleDate: '2026-09-27',
    source: 'Trench Pit #1',
    notes: 'Well fermented whole-crop maize silage',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-09-27T10:00:00Z',
  };

  it('should create a silage sample via POST /api/silage-samples', async () => {
    const payload: CreateSilageSampleRequest = {
      farmId: 1,
      sampleCode: 'SIL-TEST-001',
      silageType: 'MAIZE',
      sampleDate: '2026-09-27',
      source: 'Trench Pit #1',
      notes: 'Well fermented whole-crop maize silage',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockSilageSample);

    const result = await silageService.createSilageSample(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/silage-samples', payload);
    expect(result.id).toBe(20);
    expect(result.sampleCode).toBe('SIL-TEST-001');
    expect(result.silageType).toBe('MAIZE');
  });

  it('should retrieve silage samples via GET /api/silage-samples without filters', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockSilageSample]);

    const result = await silageService.getAllSilageSamples();

    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples');
    expect(result).toHaveLength(1);
    expect(result[0].sampleCode).toBe('SIL-TEST-001');
  });

  it('should retrieve silage samples filtered by farmId and animalId', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockSilageSample]);

    const result = await silageService.getAllSilageSamples({ farmId: 1, animalId: 3 });

    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples?farmId=1&animalId=3');
    expect(result).toHaveLength(1);
  });

  it('should retrieve a single silage sample by ID via GET /api/silage-samples/:id', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSilageSample);

    const result = await silageService.getSilageSampleById(20);

    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples/20');
    expect(result).toEqual(mockSilageSample);
  });

  it('should update a silage sample via PUT /api/silage-samples/:id', async () => {
    const updatePayload: UpdateSilageSampleRequest = {
      farmId: 1,
      sampleCode: 'SIL-TEST-001-MOD',
      silageType: 'SORGHUM',
      sampleDate: '2026-09-27',
      notes: 'Updated fermentation notes',
    };

    const updatedResponse: SilageSample = {
      ...mockSilageSample,
      sampleCode: 'SIL-TEST-001-MOD',
      silageType: 'SORGHUM',
      notes: 'Updated fermentation notes',
    };

    const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedResponse);

    const result = await silageService.updateSilageSample(20, updatePayload);

    expect(putSpy).toHaveBeenCalledWith('/api/silage-samples/20', updatePayload);
    expect(result.sampleCode).toBe('SIL-TEST-001-MOD');
    expect(result.silageType).toBe('SORGHUM');
  });

  it('should delete a silage sample via DELETE /api/silage-samples/:id', async () => {
    const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined as unknown as void);

    await silageService.deleteSilageSample(20);

    expect(deleteSpy).toHaveBeenCalledWith('/api/silage-samples/20');
  });

  it('should retrieve test results for a silage sample via GET /api/silage-samples/:sampleId/test-results', async () => {
    const mockTests: TestResult[] = [
      {
        id: 201,
        silageSampleId: 20,
        ph: 4.1,
        moisture: 65.0,
        overallQuality: 'GOOD',
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTests);

    const result = await silageService.getTestResultsForSilageSample(20);

    expect(getSpy).toHaveBeenCalledWith('/api/silage-samples/20/test-results');
    expect(result).toHaveLength(1);
    expect(result[0].ph).toBe(4.1);
  });

  it('should propagate API errors on failed silage sample fetch', async () => {
    const apiError = new AppApiError({ message: 'Silage sample not found', status: 404, errorType: 'NOT_FOUND' });
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce(apiError);

    await expect(silageService.getSilageSampleById(999)).rejects.toThrow('Silage sample not found');
  });

  it('should support silage samples with nullable optional fields', async () => {
    const minimalSample: SilageSample = {
      id: 21,
      farmId: 1,
      sampleCode: 'SIL-MIN-001',
      silageType: 'OTHER',
      sampleDate: '2026-09-27',
      animalId: null,
      source: null,
      notes: null,
    };

    jest.spyOn(apiClient, 'get').mockResolvedValueOnce(minimalSample);

    const result = await silageService.getSilageSampleById(21);
    expect(result.animalId).toBeNull();
    expect(result.source).toBeNull();
    expect(result.notes).toBeNull();
  });
});
