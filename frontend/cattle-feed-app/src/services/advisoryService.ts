import { apiClient } from './apiClient';
import { AdvisoryResponse } from '../models/advisory';

/**
 * Advisory Service
 * Communicates with backend M5 endpoints:
 * - GET /api/advisories            (List advisories, optional ?animalId=X&isRead=Y)
 * - GET /api/advisories/:id        (Get single advisory details)
 * - PUT /api/advisories/:id/read   (Mark advisory as read)
 */
export const advisoryService = {
  /**
   * Retrieves generated advisories for the farmer's herd,
   * optionally filtered by animalId and isRead status.
   */
  async getAdvisories(params?: {
    animalId?: number;
    isRead?: boolean;
  }): Promise<AdvisoryResponse[]> {
    const queryParams: string[] = [];
    if (params?.animalId !== undefined && params?.animalId !== null) {
      queryParams.push(`animalId=${encodeURIComponent(params.animalId)}`);
    }
    if (params?.isRead !== undefined && params?.isRead !== null) {
      queryParams.push(`isRead=${encodeURIComponent(params.isRead)}`);
    }
    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return apiClient.get<AdvisoryResponse[]>(`/api/advisories${query}`);
  },

  /**
   * Retrieves a specific advisory by ID.
   */
  async getAdvisoryById(id: number): Promise<AdvisoryResponse> {
    return apiClient.get<AdvisoryResponse>(
      `/api/advisories/${encodeURIComponent(id)}`
    );
  },

  /**
   * Updates an advisory's status to read.
   */
  async markAsRead(id: number): Promise<AdvisoryResponse> {
    return apiClient.put<AdvisoryResponse>(
      `/api/advisories/${encodeURIComponent(id)}/read`
    );
  },
};

export default advisoryService;
