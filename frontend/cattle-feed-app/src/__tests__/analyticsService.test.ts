import { apiClient } from '../services/apiClient';
import { analyticsService } from '../services/analyticsService';
import {
  AnimalAnalytics,
  FarmAnalyticsSummary,
  HistoricalTestPoint,
  SampleHistoricalTrends,
} from '../models/analytics';
import { AppApiError } from '../models/api';

describe('Analytics & Historical Trends Service (Milestone 9)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockSummary: FarmAnalyticsSummary = {
    totalAnimals: 12,
    totalFeedSamples: 8,
    totalSilageSamples: 4,
    totalTestResults: 24,
    totalActiveAdvisories: 3,
    totalConsultations: 2,
    qualityStatusDistribution: {
      GOOD: 15,
      ACCEPTABLE: 5,
      NEEDS_ATTENTION: 3,
      UNSAFE: 1,
      INSUFFICIENT_DATA: 0,
    },
    riskDistribution: {
      LOW: 18,
      MEDIUM: 5,
      HIGH: 1,
    },
    contaminationRiskCount: 1,
    nutritionalRiskCount: 2,
    storageRiskCount: 1,
    daysFilter: 30,
    disclaimer: 'Analytics are descriptive summaries of available historical records and do not establish medical or causal conclusions.',
  };

  const mockHistoricalTestPoint: HistoricalTestPoint = {
    testResultId: 501,
    testDate: '2026-09-25',
    sampleType: 'FEED',
    sampleCode: 'FEED-001',
    analysisSource: 'LAB',
    moisture: 13.5,
    crudeProtein: 17.2,
    fiber: 19.8,
    energyValue: 2450,
    aflatoxin: 12.0,
    mycotoxin: 5.0,
    ph: 6.2,
    mineralStatus: 'ADEQUATE',
    adulteration: 'NEGATIVE',
    mouldDetected: false,
    spoilageDetected: false,
    qualityStatus: 'GOOD',
    riskLevel: 'LOW',
    confidenceScore: 94.5,
    triggeredRulesCount: 0,
  };

  const mockAnimalAnalytics: AnimalAnalytics = {
    animalId: 101,
    animalTag: 'COW-101',
    name: 'Bessie',
    breed: 'Holstein',
    gender: 'FEMALE',
    weight: 550,
    lactationStage: 'MID_LACTATION',
    milkProductionPerDay: 24.5,
    farmId: 10,
    farmName: 'Green Meadows',
    totalFeedTests: 4,
    totalSilageTests: 2,
    totalTestResults: 6,
    totalActiveAdvisories: 1,
    totalConsultations: 1,
    daysFilter: null,
    latestMeasurements: mockHistoricalTestPoint,
    testHistory: [mockHistoricalTestPoint],
    qualityStatusDistribution: { GOOD: 5, ACCEPTABLE: 1 },
    riskDistribution: { LOW: 5, MEDIUM: 1 },
    activeAdvisoryTitles: ['Monitor dietary fiber intake'],
    healthRiskSummary: ['NUTRITIONAL: Borderline low fiber'],
    descriptiveSummary: '6 historical test record(s) recorded for animal COW-101 between 2026-09-01 and 2026-09-25.',
    disclaimer: 'Analytics are descriptive summaries of available historical records and do not establish medical or causal conclusions.',
  };

  const mockFeedHistory: SampleHistoricalTrends = {
    sampleId: 201,
    sampleCode: 'FS-201',
    sampleType: 'FEED',
    subtype: 'CATTLE_FEED_PELLET',
    farmId: 10,
    farmName: 'Green Meadows',
    animalId: 101,
    animalTag: 'COW-101',
    sampleDate: '2026-09-20',
    totalTestPoints: 2,
    daysFilter: null,
    testPoints: [
      { ...mockHistoricalTestPoint, testResultId: 500, testDate: '2026-09-21', crudeProtein: 16.0 },
      mockHistoricalTestPoint,
    ],
    qualityStatusDistribution: { GOOD: 2 },
    riskDistribution: { LOW: 2 },
    descriptiveSummary: '2 historical test record(s) recorded for feed sample FS-201 between 2026-09-21 and 2026-09-25.',
    disclaimer: 'Analytics are descriptive summaries of available historical records and do not establish medical or causal conclusions.',
  };

  const mockSilageHistory: SampleHistoricalTrends = {
    sampleId: 301,
    sampleCode: 'SS-301',
    sampleType: 'SILAGE',
    subtype: 'MAIZE',
    farmId: 10,
    farmName: 'Green Meadows',
    animalId: 101,
    animalTag: 'COW-101',
    sampleDate: '2026-09-18',
    totalTestPoints: 1,
    daysFilter: null,
    testPoints: [
      {
        ...mockHistoricalTestPoint,
        testResultId: 601,
        sampleType: 'SILAGE',
        sampleCode: 'SS-301',
        ph: 3.9,
        moisture: 65.0,
      },
    ],
    qualityStatusDistribution: { GOOD: 1 },
    riskDistribution: { LOW: 1 },
    descriptiveSummary: '1 historical test record(s) recorded for silage sample SS-301.',
    disclaimer: 'Analytics are descriptive summaries of available historical records and do not establish medical or causal conclusions.',
  };

  describe('1. Summary Analytics', () => {
    it('retrieves farm summary without date filter', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSummary);

      const result = await analyticsService.getFarmSummary();

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/summary');
      expect(result.totalAnimals).toBe(12);
      expect(result.totalTestResults).toBe(24);
      expect(result.qualityStatusDistribution.GOOD).toBe(15);
      expect(result.riskDistribution.LOW).toBe(18);
    });

    it('retrieves farm summary with days filter (30 days)', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
        ...mockSummary,
        daysFilter: 30,
      });

      const result = await analyticsService.getFarmSummary(30);

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/summary?days=30');
      expect(result.daysFilter).toBe(30);
    });
  });

  describe('2. Animal Analytics & History', () => {
    it('retrieves animal historical analytics by animal ID', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAnimalAnalytics);

      const result = await analyticsService.getAnimalAnalytics(101);

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/animals/101');
      expect(result.animalId).toBe(101);
      expect(result.animalTag).toBe('COW-101');
      expect(result.totalFeedTests).toBe(4);
      expect(result.latestMeasurements?.crudeProtein).toBe(17.2);
    });

    it('retrieves animal history with days filter', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAnimalAnalytics);

      await analyticsService.getAnimalAnalytics(101, 7);

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/animals/101?days=7');
    });

    it('retrieves animal history alias endpoint', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAnimalAnalytics);

      await analyticsService.getAnimalHistory(101);

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/animals/101/history');
    });
  });

  describe('3. Feed & Silage Historical Trends', () => {
    it('retrieves feed sample history', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFeedHistory);

      const result = await analyticsService.getFeedSampleHistory(201);

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/feed-samples/201');
      expect(result.sampleCode).toBe('FS-201');
      expect(result.totalTestPoints).toBe(2);
      expect(result.testPoints[0].crudeProtein).toBe(16.0);
      expect(result.testPoints[1].crudeProtein).toBe(17.2);
    });

    it('retrieves silage sample history', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSilageHistory);

      const result = await analyticsService.getSilageSampleHistory(301);

      expect(getSpy).toHaveBeenCalledWith('/api/analytics/silage-samples/301');
      expect(result.sampleType).toBe('SILAGE');
      expect(result.testPoints[0].ph).toBe(3.9);
      expect(result.testPoints[0].moisture).toBe(65.0);
    });
  });

  describe('4. Null Handling and Insufficient Data State', () => {
    it('preserves null measurements as null without defaulting to zero', async () => {
      const nullPoint: HistoricalTestPoint = {
        testResultId: 502,
        testDate: '2026-09-26',
        sampleType: 'FEED',
        moisture: null,
        crudeProtein: null,
        fiber: null,
        ph: null,
        aflatoxin: null,
        qualityStatus: 'INSUFFICIENT_DATA',
        riskLevel: 'LOW',
        triggeredRulesCount: 0,
      };

      const emptySampleHistory: SampleHistoricalTrends = {
        ...mockFeedHistory,
        totalTestPoints: 1,
        testPoints: [nullPoint],
      };

      jest.spyOn(apiClient, 'get').mockResolvedValueOnce(emptySampleHistory);

      const res = await analyticsService.getFeedSampleHistory(201);
      const pt = res.testPoints[0];

      expect(pt.moisture).toBeNull();
      expect(pt.crudeProtein).toBeNull();
      expect(pt.fiber).toBeNull();
      expect(pt.ph).toBeNull();
      expect(pt.aflatoxin).toBeNull();
      expect(pt.qualityStatus).toBe('INSUFFICIENT_DATA');
      expect(pt.moisture).not.toBe(0);
      expect(pt.crudeProtein).not.toBe(0);
    });

    it('handles empty history state cleanly', async () => {
      const emptyAnimal: AnimalAnalytics = {
        ...mockAnimalAnalytics,
        totalTestResults: 0,
        totalFeedTests: 0,
        totalSilageTests: 0,
        latestMeasurements: null,
        testHistory: [],
        descriptiveSummary: 'No historical test records found for animal COW-101 in the selected time period.',
      };

      jest.spyOn(apiClient, 'get').mockResolvedValueOnce(emptyAnimal);

      const res = await analyticsService.getAnimalAnalytics(101);

      expect(res.totalTestResults).toBe(0);
      expect(res.latestMeasurements).toBeNull();
      expect(res.testHistory).toEqual([]);
      expect(res.descriptiveSummary).toContain('No historical test records found');
    });
  });

  describe('5. Error Handling (401, 403, 404)', () => {
    it('handles 401 Unauthorized error', async () => {
      const error = new AppApiError({
        status: 401,
        errorType: 'Unauthorized',
        message: 'Authentication is required to access this resource',
      });
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(error);

      await expect(analyticsService.getFarmSummary()).rejects.toEqual(
        expect.objectContaining({ status: 401 })
      );
    });

    it('handles 403 Forbidden cross-owner access error', async () => {
      const error = new AppApiError({
        status: 403,
        errorType: 'Forbidden',
        message: 'Access denied: You do not have permission to access this animal',
      });
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(error);

      await expect(analyticsService.getAnimalAnalytics(999)).rejects.toEqual(
        expect.objectContaining({ status: 403 })
      );
    });

    it('handles 404 Not Found missing resource error', async () => {
      const error = new AppApiError({
        status: 404,
        errorType: 'Not Found',
        message: 'Feed sample not found with id: 888',
      });
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(error);

      await expect(analyticsService.getFeedSampleHistory(888)).rejects.toEqual(
        expect.objectContaining({ status: 404 })
      );
    });
  });
});
