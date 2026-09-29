import { apiClient } from '../services/apiClient';
import { feedService } from '../services/feedService';
import { CreateFeedSampleRequest, FeedSample, UpdateFeedSampleRequest } from '../models/feed';
import { TestResult } from '../models/testResult';
import { AppApiError } from '../models/api';

describe('Feed Service', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockFeedSample: FeedSample = {
    id: 10,
    farmId: 1,
    animalId: 2,
    sampleCode: 'FEED-TEST-001',
    feedType: 'CATTLE_FEED_PELLET',
    sampleDate: '2026-09-27',
    source: 'Warehouse Batch 4',
    notes: 'Standard high-protein compound pellet',
    createdAt: '2026-09-27T10:00:00Z',
    updatedAt: '2026-09-27T10:00:00Z',
  };

  it('should create a feed sample via POST /api/feed-samples', async () => {
    const payload: CreateFeedSampleRequest = {
      farmId: 1,
      animalId: 2,
      sampleCode: 'FEED-TEST-001',
      feedType: 'CATTLE_FEED_PELLET',
      sampleDate: '2026-09-27',
      source: 'Warehouse Batch 4',
      notes: 'Standard high-protein compound pellet',
    };

    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockFeedSample);

    const result = await feedService.createFeedSample(payload);

    expect(postSpy).toHaveBeenCalledWith('/api/feed-samples', payload);
    expect(result.id).toBe(10);
    expect(result.sampleCode).toBe('FEED-TEST-001');
    expect(result.feedType).toBe('CATTLE_FEED_PELLET');
  });

  it('should retrieve feed samples via GET /api/feed-samples without filters', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockFeedSample]);

    const result = await feedService.getAllFeedSamples();

    expect(getSpy).toHaveBeenCalledWith('/api/feed-samples');
    expect(result).toHaveLength(1);
    expect(result[0].sampleCode).toBe('FEED-TEST-001');
  });

  it('should retrieve feed samples filtered by farmId and animalId', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockFeedSample]);

    const result = await feedService.getAllFeedSamples({ farmId: 1, animalId: 2 });

    expect(getSpy).toHaveBeenCalledWith('/api/feed-samples?farmId=1&animalId=2');
    expect(result).toHaveLength(1);
  });

  it('should retrieve a single feed sample by ID via GET /api/feed-samples/:id', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFeedSample);

    const result = await feedService.getFeedSampleById(10);

    expect(getSpy).toHaveBeenCalledWith('/api/feed-samples/10');
    expect(result).toEqual(mockFeedSample);
  });

  it('should update a feed sample via PUT /api/feed-samples/:id', async () => {
    const updatePayload: UpdateFeedSampleRequest = {
      farmId: 1,
      sampleCode: 'FEED-TEST-001-MOD',
      feedType: 'FEED_MASH',
      sampleDate: '2026-09-27',
      notes: 'Updated description',
    };

    const updatedResponse: FeedSample = {
      ...mockFeedSample,
      sampleCode: 'FEED-TEST-001-MOD',
      feedType: 'FEED_MASH',
      notes: 'Updated description',
    };

    const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedResponse);

    const result = await feedService.updateFeedSample(10, updatePayload);

    expect(putSpy).toHaveBeenCalledWith('/api/feed-samples/10', updatePayload);
    expect(result.sampleCode).toBe('FEED-TEST-001-MOD');
    expect(result.feedType).toBe('FEED_MASH');
  });

  it('should delete a feed sample via DELETE /api/feed-samples/:id', async () => {
    const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined as unknown as void);

    await feedService.deleteFeedSample(10);

    expect(deleteSpy).toHaveBeenCalledWith('/api/feed-samples/10');
  });

  it('should retrieve test results for a feed sample via GET /api/feed-samples/:sampleId/test-results', async () => {
    const mockTests: TestResult[] = [
      {
        id: 101,
        feedSampleId: 10,
        moisture: 11.2,
        crudeProtein: 19.5,
        overallQuality: 'GOOD',
      },
    ];

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTests);

    const result = await feedService.getTestResultsForFeedSample(10);

    expect(getSpy).toHaveBeenCalledWith('/api/feed-samples/10/test-results');
    expect(result).toHaveLength(1);
    expect(result[0].crudeProtein).toBe(19.5);
  });

  it('should propagate API errors on failed feed sample fetch', async () => {
    const apiError = new AppApiError({ message: 'Sample not found', status: 404, errorType: 'NOT_FOUND' });
    jest.spyOn(apiClient, 'get').mockRejectedValueOnce(apiError);

    await expect(feedService.getFeedSampleById(999)).rejects.toThrow('Sample not found');
  });

  it('should support feed samples with nullable optional fields', async () => {
    const minimalSample: FeedSample = {
      id: 11,
      farmId: 1,
      sampleCode: 'FEED-MIN-001',
      feedType: 'OTHER',
      sampleDate: '2026-09-27',
      animalId: null,
      source: null,
      notes: null,
    };

    jest.spyOn(apiClient, 'get').mockResolvedValueOnce(minimalSample);

    const result = await feedService.getFeedSampleById(11);
    expect(result.animalId).toBeNull();
    expect(result.source).toBeNull();
    expect(result.notes).toBeNull();
  });
});
