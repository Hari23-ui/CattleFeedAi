import { apiClient } from '../services/apiClient';
import { alertService } from '../services/alertService';
import { Alert, UnreadCountResponse, MarkAllReadResponse } from '../models/alert';
import { AppApiError } from '../models/api';

describe('Alert Service (M10 In-App Notifications & Alerts)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockAlerts: Alert[] = [
    {
      id: 1,
      title: 'Critical Quality Alert: FS-2026-001',
      message: 'Critical aflatoxin level detected (65 ppb).',
      alertType: 'FEED_QUALITY',
      severity: 'CRITICAL',
      isRead: false,
      createdAt: '2026-09-28T14:00:00',
      userId: 101,
      relatedEntityType: 'TEST_RESULT',
      relatedEntityId: 55,
    },
    {
      id: 2,
      title: 'High Risk Screening Alert: SIL-02',
      message: 'Visible spoilage and mould detected during visual screening.',
      alertType: 'SILAGE_QUALITY',
      severity: 'HIGH',
      isRead: true,
      createdAt: '2026-09-28T12:00:00',
      userId: 101,
      relatedEntityType: 'TEST_RESULT',
      relatedEntityId: 56,
    },
    {
      id: 3,
      title: 'Urgent Advisory: Immediate feed aeration',
      message: 'High moisture levels pose imminent heating hazard.',
      alertType: 'STORAGE',
      severity: 'HIGH',
      isRead: false,
      createdAt: '2026-09-28T10:00:00',
      userId: 101,
      relatedEntityType: 'ADVISORY',
      relatedEntityId: 301,
    },
  ];

  describe('getAlerts', () => {
    it('should call GET /api/alerts and return list of alerts', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAlerts);

      const result = await alertService.getAlerts();

      expect(getSpy).toHaveBeenCalledWith('/api/alerts');
      expect(result).toHaveLength(3);
      expect(result[0].severity).toBe('CRITICAL');
      expect(result[0].alertType).toBe('FEED_QUALITY');
      expect(result[0].isRead).toBe(false);
    });

    it('should throw AppApiError on network or server failure', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({ message: 'Network request failed', isNetworkError: true })
      );

      await expect(alertService.getAlerts()).rejects.toThrow('Network request failed');
    });
  });

  describe('getAlertById', () => {
    it('should call GET /api/alerts/:id and return specific alert', async () => {
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAlerts[0]);

      const result = await alertService.getAlertById(1);

      expect(getSpy).toHaveBeenCalledWith('/api/alerts/1');
      expect(result.id).toBe(1);
      expect(result.title).toBe('Critical Quality Alert: FS-2026-001');
    });

    it('should throw 403 Forbidden AppApiError when cross-owner access is attempted', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          status: 403,
          message: 'Access denied: You do not have permission to view this alert',
          errorType: 'FORBIDDEN',
        })
      );

      await expect(alertService.getAlertById(99)).rejects.toMatchObject({
        status: 403,
        errorType: 'FORBIDDEN',
      });
    });

    it('should throw 404 Not Found AppApiError when alert does not exist', async () => {
      jest.spyOn(apiClient, 'get').mockRejectedValueOnce(
        new AppApiError({
          status: 404,
          message: 'Alert not found with id: 9999',
          errorType: 'NOT_FOUND',
        })
      );

      await expect(alertService.getAlertById(9999)).rejects.toMatchObject({
        status: 404,
        errorType: 'NOT_FOUND',
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should call GET /api/alerts/unread-count and return count', async () => {
      const mockCount: UnreadCountResponse = { unreadCount: 2, count: 2 };
      const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockCount);

      const result = await alertService.getUnreadCount();

      expect(getSpy).toHaveBeenCalledWith('/api/alerts/unread-count');
      expect(result.unreadCount).toBe(2);
      expect(result.count).toBe(2);
    });

    it('should handle zero unread count gracefully', async () => {
      const mockCount: UnreadCountResponse = { unreadCount: 0, count: 0 };
      jest.spyOn(apiClient, 'get').mockResolvedValueOnce(mockCount);

      const result = await alertService.getUnreadCount();

      expect(result.unreadCount).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should call PUT /api/alerts/:id/read and return updated alert', async () => {
      const updatedAlert: Alert = { ...mockAlerts[0], isRead: true };
      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(updatedAlert);

      const result = await alertService.markAsRead(1);

      expect(putSpy).toHaveBeenCalledWith('/api/alerts/1/read');
      expect(result.isRead).toBe(true);
    });

    it('should throw 403 Forbidden when marking another farmer alert as read', async () => {
      jest.spyOn(apiClient, 'put').mockRejectedValueOnce(
        new AppApiError({
          status: 403,
          message: 'Access denied: You do not have permission to modify this alert',
          errorType: 'FORBIDDEN',
        })
      );

      await expect(alertService.markAsRead(2)).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should call PUT /api/alerts/read-all and return update confirmation', async () => {
      const mockResponse: MarkAllReadResponse = {
        message: 'All alerts marked as read',
        updatedCount: 2,
      };
      const putSpy = jest.spyOn(apiClient, 'put').mockResolvedValueOnce(mockResponse);

      const result = await alertService.markAllAsRead();

      expect(putSpy).toHaveBeenCalledWith('/api/alerts/read-all');
      expect(result.updatedCount).toBe(2);
      expect(result.message).toBe('All alerts marked as read');
    });
  });
});
