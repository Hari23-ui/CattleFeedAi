import { apiClient } from '../services/apiClient';
import { feedPlanService } from '../services/feedPlanService';
import { FeedPlan, FeedPlanRequest } from '../models/feedPlan';
import { AppApiError } from '../models/api';

describe('FeedPlan Service (M11 Feed Planning & Management)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockPlans: FeedPlan[] = [
    {
      id: 1,
      planName: 'High Lactation Diet',
      description: 'Morning and evening rations',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      status: 'ACTIVE',
      plannedQuantity: 5.5,
      frequency: 'TWICE_DAILY',
      notes: 'Transition slowly over 3 days',
      createdAt: '2026-09-28T10:00:00',
      updatedAt: '2026-09-28T10:00:00',
      animal: {
        id: 10,
        animalTag: 'COW-001',
        name: 'Bessie',
        breed: 'Holstein',
        category: 'EARLY',
        farmId: 1,
        farmName: 'Green Meadows',
      },
      feedSample: {
        id: 101,
        sampleCode: 'FS-2026-001',
        feedType: 'CATTLE_FEED_PELLET',
        sampleDate: '2026-09-20',
      },
      qualityStatus: 'GOOD',
      riskLevel: 'LOW',
      disclaimer: 'Informational feed planning record only. Non-diagnostic.',
    },
    {
      id: 2,
      planName: 'Maintenance Dry Period',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      status: 'COMPLETED',
      plannedQuantity: 3.0,
      frequency: 'DAILY',
      createdAt: '2026-08-01T08:00:00',
      updatedAt: '2026-08-31T18:00:00',
      animal: {
        id: 11,
        animalTag: 'COW-002',
        name: 'Daisy',
        breed: 'Jersey',
      },
      qualityStatus: 'Not Available',
      riskLevel: 'Not Available',
    },
  ];

  describe('getAllFeedPlans', () => {
    it('should call GET /api/feed-plans and return list of feed plans', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockPlans);

      const result = await feedPlanService.getAllFeedPlans();

      expect(getSpy).toHaveBeenCalledWith('/api/feed-plans');
      expect(result).toHaveLength(2);
      expect(result[0].planName).toBe('High Lactation Diet');
      expect(result[0].status).toBe('ACTIVE');
      expect(result[0].animal.animalTag).toBe('COW-001');
      expect(result[0].qualityStatus).toBe('GOOD');
    });

    it('should throw AppApiError on network failure', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({ message: 'Network disconnected', isNetworkError: true })
      );

      await expect(feedPlanService.getAllFeedPlans()).rejects.toThrow('Network disconnected');
    });
  });

  describe('getFeedPlanById', () => {
    it('should call GET /api/feed-plans/:id and return specific feed plan with context', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockPlans[0]);

      const result = await feedPlanService.getFeedPlanById(1);

      expect(getSpy).toHaveBeenCalledWith('/api/feed-plans/1');
      expect(result.id).toBe(1);
      expect(result.planName).toBe('High Lactation Diet');
      expect(result.animal.animalTag).toBe('COW-001');
      expect(result.feedSample?.sampleCode).toBe('FS-2026-001');
    });

    it('should throw 403 Forbidden AppApiError when cross-owner plan is accessed', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          status: 403,
          message: 'Access denied: You do not have permission to access this feed plan',
          errorType: 'FORBIDDEN',
        })
      );

      await expect(feedPlanService.getFeedPlanById(99)).rejects.toMatchObject({
        status: 403,
        errorType: 'FORBIDDEN',
      });
    });

    it('should throw 404 Not Found AppApiError when feed plan does not exist', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          status: 404,
          message: 'Feed plan not found with id: 9999',
          errorType: 'NOT_FOUND',
        })
      );

      await expect(feedPlanService.getFeedPlanById(9999)).rejects.toMatchObject({
        status: 404,
        errorType: 'NOT_FOUND',
      });
    });
  });

  describe('createFeedPlan', () => {
    it('should call POST /api/feed-plans and return newly created plan', async () => {
      const newPlanReq: FeedPlanRequest = {
        planName: 'New Mid-Lactation Ration',
        animalId: 10,
        startDate: '2026-10-15',
        endDate: '2026-11-15',
        plannedQuantity: 4.5,
        frequency: 'TWICE_DAILY',
        status: 'ACTIVE',
      };
      const createdPlan: FeedPlan = {
        ...mockPlans[0],
        id: 3,
        planName: newPlanReq.planName,
        startDate: newPlanReq.startDate,
        endDate: newPlanReq.endDate,
        plannedQuantity: newPlanReq.plannedQuantity,
      };

      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(createdPlan);

      const result = await feedPlanService.createFeedPlan(newPlanReq);

      expect(postSpy).toHaveBeenCalledWith('/api/feed-plans', newPlanReq);
      expect(result.id).toBe(3);
      expect(result.planName).toBe('New Mid-Lactation Ration');
      expect(result.plannedQuantity).toBe(4.5);
    });

    it('should throw 400 Bad Request when dates are invalid', async () => {
      jest.spyOn(apiClient, 'post').mockRejectedValueOnce(
        new AppApiError({
          status: 400,
          message: 'End date cannot be before start date',
          errorType: 'BAD_REQUEST',
        })
      );

      await expect(
        feedPlanService.createFeedPlan({
          planName: 'Invalid Date Plan',
          animalId: 10,
          startDate: '2026-10-31',
          endDate: '2026-10-01',
        })
      ).rejects.toMatchObject({
        status: 400,
      });
    });
  });

  describe('updateFeedPlan', () => {
    it('should call PUT /api/feed-plans/:id and return updated plan', async () => {
      const updateReq: FeedPlanRequest = {
        planName: 'Updated Lactation Diet',
        animalId: 10,
        startDate: '2026-10-01',
        status: 'COMPLETED',
      };
      const updatedPlan: FeedPlan = {
        ...mockPlans[0],
        planName: 'Updated Lactation Diet',
        status: 'COMPLETED',
      };

      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedPlan);

      const result = await feedPlanService.updateFeedPlan(1, updateReq);

      expect(putSpy).toHaveBeenCalledWith('/api/feed-plans/1', updateReq);
      expect(result.planName).toBe('Updated Lactation Diet');
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw 403 Forbidden when updating another farmer plan', async () => {
      jest.spyOn(apiClient, 'put').mockRejectedValueOnce(
        new AppApiError({
          status: 403,
          message: 'Access denied: You do not have permission to access this feed plan',
          errorType: 'FORBIDDEN',
        })
      );

      await expect(
        feedPlanService.updateFeedPlan(99, {
          planName: 'Unauthorized Update',
          animalId: 10,
          startDate: '2026-10-01',
        })
      ).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe('deleteFeedPlan', () => {
    it('should call DELETE /api/feed-plans/:id and succeed', async () => {
      const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

      await feedPlanService.deleteFeedPlan(1);

      expect(deleteSpy).toHaveBeenCalledWith('/api/feed-plans/1');
    });

    it('should throw 403 Forbidden when deleting another farmer plan', async () => {
      jest.spyOn(apiClient, 'delete').mockRejectedValueOnce(
        new AppApiError({
          status: 403,
          message: 'Access denied: You do not have permission to access this feed plan',
          errorType: 'FORBIDDEN',
        })
      );

      await expect(feedPlanService.deleteFeedPlan(99)).rejects.toMatchObject({
        status: 403,
      });
    });
  });
});
