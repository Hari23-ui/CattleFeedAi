import { apiClient } from '../services/apiClient';
import { advisoryService } from '../services/advisoryService';
import { AdvisoryResponse } from '../models/advisory';
import { AppApiError } from '../models/api';

describe('Advisory Service (M5 Backend Integration)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockAdvisories: AdvisoryResponse[] = [
    {
      id: 1,
      animalId: 10,
      animalTag: 'COW-01',
      category: 'CONTAMINATION',
      priority: 'HIGH',
      title: 'Potential Contamination Risk: AFLATOXIN',
      message: 'Aflatoxin exceeds standard safe threshold.',
      recommendedAction: 'Isolate feed batch immediately.',
      isRead: false,
      createdAt: '2026-09-27T10:00:00',
    },
    {
      id: 2,
      animalId: 10,
      animalTag: 'COW-01',
      category: 'NUTRITION',
      priority: 'MEDIUM',
      title: 'Nutritional Imbalance: CRUDE_PROTEIN',
      message: 'Crude protein below expected baseline.',
      recommendedAction: 'Supplement with protein-rich oil cakes.',
      isRead: true,
      createdAt: '2026-09-26T14:30:00',
    },
  ];

  describe('getAdvisories', () => {
    it('should call GET /api/advisories without params when none provided', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAdvisories);

      const result = await advisoryService.getAdvisories();

      expect(getSpy).toHaveBeenCalledWith('/api/advisories');
      expect(result).toHaveLength(2);
      expect(result[0].priority).toBe('HIGH');
    });

    it('should append animalId and isRead query parameters when provided', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockAdvisories[0]]);

      const result = await advisoryService.getAdvisories({ animalId: 10, isRead: false });

      expect(getSpy).toHaveBeenCalledWith('/api/advisories?animalId=10&isRead=false');
      expect(result).toHaveLength(1);
      expect(result[0].isRead).toBe(false);
    });

    it('should correctly filter only by isRead when animalId is not provided', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce([mockAdvisories[1]]);

      const result = await advisoryService.getAdvisories({ isRead: true });

      expect(getSpy).toHaveBeenCalledWith('/api/advisories?isRead=true');
      expect(result).toHaveLength(1);
    });

    it('should correctly handle server error 500', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Internal server error occurred',
          status: 500,
          errorType: 'SERVER_ERROR',
        })
      );

      await expect(advisoryService.getAdvisories()).rejects.toThrow('Internal server error');
    });
  });

  describe('getAdvisoryById', () => {
    it('should call GET /api/advisories/:id and return advisory', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAdvisories[0]);

      const result = await advisoryService.getAdvisoryById(1);

      expect(getSpy).toHaveBeenCalledWith('/api/advisories/1');
      expect(result.id).toBe(1);
      expect(result.title).toBe('Potential Contamination Risk: AFLATOXIN');
    });

    it('should throw NOT_FOUND error when advisory does not exist', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          message: 'Advisory not found with id: 999',
          status: 404,
          errorType: 'NOT_FOUND',
        })
      );

      await expect(advisoryService.getAdvisoryById(999)).rejects.toThrow(
        'Advisory not found with id: 999'
      );
    });
  });

  describe('markAsRead', () => {
    it('should call PUT /api/advisories/:id/read and return updated advisory', async () => {
      const updatedAdvisory: AdvisoryResponse = {
        ...mockAdvisories[0],
        isRead: true,
      };
      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedAdvisory);

      const result = await advisoryService.markAsRead(1);

      expect(putSpy).toHaveBeenCalledWith('/api/advisories/1/read');
      expect(result.isRead).toBe(true);
    });

    it('should propagate FORBIDDEN error when unauthorized to update advisory', async () => {
      jest.spyOn(apiClient, 'put').mockRejectedValueOnce(
        new AppApiError({
          message: 'Access denied: You do not have permission',
          status: 403,
          errorType: 'FORBIDDEN',
        })
      );

      await expect(advisoryService.markAsRead(1)).rejects.toThrow('Access denied');
    });
  });
});
