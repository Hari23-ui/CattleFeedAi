import { apiClient } from '../services/apiClient';
import { animalHealthService } from '../services/animalHealthService';
import { AnimalHealthScreeningResponse } from '../models/animalHealth';
import { AppApiError } from '../models/api';

describe('Animal Health Service (M6.5 Backend Integration)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockScreeningResponse: AnimalHealthScreeningResponse = {
    animalId: 10,
    animalTag: 'COW-01',
    screeningStatus: 'POTENTIAL_CONCERN',
    missingInformation: [],
    detectedRisks: [
      {
        category: 'NUTRITION',
        riskTitle: 'Potential Nutritional Imbalance: Protein Deficit Risk for Lactation Yield',
        severity: 'WARNING',
        description: 'Animal is in high-demand lactation while feed test shows crude protein below 16%.',
        mitigationRecommendation: 'Supplement with high-protein concentrate or oil cakes.',
        detectedParameter: 'CRUDE_PROTEIN',
      },
    ],
    recentObservationsCount: 2,
    recentTestResultsCount: 3,
    dietaryAndHealthSummary: 'Identified 1 potential feed-related risk indicator requiring attention.',
    recommendationSummary: 'Review indicated nutritional and storage mitigations.',
    screeningTimestamp: '2026-09-27T14:00:00',
    disclaimer: 'Screening Disclaimer: Animal health risk screening correlates nutritional parameters and logged farmer observations. It identifies potential feed-related risk indicators and does NOT constitute a veterinary diagnosis.',
  };

  describe('screenAnimalHealth', () => {
    it('should call GET /api/assessments/animals/:id/health-screening and return screening response', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockScreeningResponse);

      const result = await animalHealthService.screenAnimalHealth(10);

      expect(getSpy).toHaveBeenCalledWith('/api/assessments/animals/10/health-screening');
      expect(result.screeningStatus).toBe('POTENTIAL_CONCERN');
      expect(result.animalTag).toBe('COW-01');
      expect(result.detectedRisks).toHaveLength(1);
      expect(result.disclaimer).toContain('does NOT constitute a veterinary diagnosis');
    });

    it('should propagate 404 when animal is not found', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Animal not found with id: 999',
          status: 404,
          errorType: 'NOT_FOUND',
        })
      );

      await expect(animalHealthService.screenAnimalHealth(999)).rejects.toThrow(
        'Animal not found with id: 999'
      );
    });

    it('should propagate 403 when user does not own animal', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Access denied: You do not have permission',
          status: 403,
          errorType: 'FORBIDDEN',
        })
      );

      await expect(animalHealthService.screenAnimalHealth(10)).rejects.toThrow(
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

      await expect(animalHealthService.screenAnimalHealth(10)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should propagate 500 server error', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Internal server error',
          status: 500,
          errorType: 'SERVER_ERROR',
        })
      );

      await expect(animalHealthService.screenAnimalHealth(10)).rejects.toThrow(
        'Internal server error'
      );
    });
  });

  describe('getAnimalFeedSamples', () => {
    it('should call GET /api/feed-samples?animalId=:id', async () => {
      const mockFeedSamples = [
        {
          id: 1,
          farmId: 2,
          animalId: 10,
          sampleCode: 'FS-001',
          feedType: 'GREEN_FODDER',
        },
      ];
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFeedSamples);

      const result = await animalHealthService.getAnimalFeedSamples(10);

      expect(getSpy).toHaveBeenCalledWith('/api/feed-samples?animalId=10');
      expect(result).toHaveLength(1);
      expect(result[0].sampleCode).toBe('FS-001');
    });
  });

  describe('getAnimalSilageSamples', () => {
    it('should call GET /api/silage-samples?animalId=:id', async () => {
      const mockSilageSamples = [
        {
          id: 5,
          farmId: 2,
          animalId: 10,
          sampleCode: 'SS-001',
          silageType: 'MAIZE',
        },
      ];
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSilageSamples);

      const result = await animalHealthService.getAnimalSilageSamples(10);

      expect(getSpy).toHaveBeenCalledWith('/api/silage-samples?animalId=10');
      expect(result).toHaveLength(1);
      expect(result[0].sampleCode).toBe('SS-001');
    });
  });

  describe('getAnimalAdvisories', () => {
    it('should call GET /api/advisories?animalId=:id', async () => {
      const mockAdvisories = [
        {
          id: 1,
          animalId: 10,
          title: 'Protein Guidance',
          message: 'Nutritional balance',
          priority: 'MEDIUM',
        },
      ];
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAdvisories);

      const result = await animalHealthService.getAnimalAdvisories(10);

      expect(getSpy).toHaveBeenCalledWith('/api/advisories?animalId=10');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Protein Guidance');
    });
  });

  describe('testResults queries', () => {
    it('should call GET /api/test-results/feed-sample/:id', async () => {
      const mockTests = [{ id: 100, feedSampleId: 1, moisture: 12.0 }];
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTests);

      const result = await animalHealthService.getTestResultsByFeedSample(1);

      expect(getSpy).toHaveBeenCalledWith('/api/test-results/feed-sample/1');
      expect(result).toHaveLength(1);
    });

    it('should call GET /api/test-results/silage-sample/:id', async () => {
      const mockTests = [{ id: 101, silageSampleId: 5, ph: 4.2 }];
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTests);

      const result = await animalHealthService.getTestResultsBySilageSample(5);

      expect(getSpy).toHaveBeenCalledWith('/api/test-results/silage-sample/5');
      expect(result).toHaveLength(1);
    });
  });
});
