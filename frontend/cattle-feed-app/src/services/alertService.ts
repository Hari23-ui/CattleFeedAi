import { apiClient } from './apiClient';
import { Alert, MarkAllReadResponse, UnreadCountResponse } from '../models/alert';

/**
 * Service for interacting with Alert & Notification REST API (M10).
 *
 * Endpoints:
 * - GET /api/alerts
 * - GET /api/alerts/{id}
 * - GET /api/alerts/unread-count
 * - PUT /api/alerts/{id}/read
 * - PUT /api/alerts/read-all
 */
export const alertService = {
  /**
   * Fetch all alerts for the authenticated farmer, newest first.
   */
  async getAlerts(): Promise<Alert[]> {
    return apiClient.get<Alert[]>('/api/alerts');
  },

  /**
   * Fetch a specific alert by ID.
   */
  async getAlertById(id: number): Promise<Alert> {
    return apiClient.get<Alert>(`/api/alerts/${id}`);
  },

  /**
   * Fetch count of unread alerts for dashboard notification indicator.
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>('/api/alerts/unread-count');
  },

  /**
   * Mark a specific alert as read.
   */
  async markAsRead(id: number): Promise<Alert> {
    return apiClient.put<Alert>(`/api/alerts/${id}/read`);
  },

  /**
   * Mark all unread alerts for current farmer as read.
   */
  async markAllAsRead(): Promise<MarkAllReadResponse> {
    return apiClient.put<MarkAllReadResponse>('/api/alerts/read-all');
  },
};

export default alertService;
