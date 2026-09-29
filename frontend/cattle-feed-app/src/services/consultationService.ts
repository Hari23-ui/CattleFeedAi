import { apiClient } from './apiClient';
import {
  ConsultationRequest,
  ConsultationResponse,
  ExpertRecommendationRequest,
} from '../models/consultation';

/**
 * Consultation Service
 * Communicates with Spring Boot backend endpoints for expert consultations:
 * - POST   /api/consultations          (Farmer requests consultation)
 * - GET    /api/consultations          (List consultations for user)
 * - GET    /api/consultations/:id      (Get consultation details)
 * - PUT    /api/consultations/:id/accept   (Expert accepts consultation)
 * - PUT    /api/consultations/:id/review   (Expert starts review)
 * - PUT    /api/consultations/:id/respond  (Expert submits recommendation)
 * - PUT    /api/consultations/:id/complete (Expert marks consultation completed)
 * - PUT    /api/consultations/:id/cancel   (Farmer cancels consultation)
 */
export const consultationService = {
  /**
   * Submit a new consultation request (Farmer).
   */
  async createConsultation(request: ConsultationRequest): Promise<ConsultationResponse> {
    return apiClient.post<ConsultationResponse>('/api/consultations', request);
  },

  /**
   * Retrieve list of consultations accessible to the authenticated user.
   */
  async getConsultations(): Promise<ConsultationResponse[]> {
    return apiClient.get<ConsultationResponse[]>('/api/consultations');
  },

  /**
   * Retrieve full consultation details by ID.
   */
  async getConsultationById(id: number): Promise<ConsultationResponse> {
    return apiClient.get<ConsultationResponse>(`/api/consultations/${id}`);
  },

  /**
   * Accept an open consultation (Expert).
   */
  async acceptConsultation(id: number): Promise<ConsultationResponse> {
    return apiClient.put<ConsultationResponse>(`/api/consultations/${id}/accept`, {});
  },

  /**
   * Move consultation into review (Expert).
   */
  async startReview(id: number): Promise<ConsultationResponse> {
    return apiClient.put<ConsultationResponse>(`/api/consultations/${id}/review`, {});
  },

  /**
   * Provide professional recommendation and notes (Expert).
   */
  async respondConsultation(
    id: number,
    request: ExpertRecommendationRequest
  ): Promise<ConsultationResponse> {
    return apiClient.put<ConsultationResponse>(`/api/consultations/${id}/respond`, request);
  },

  /**
   * Mark consultation completed (Expert).
   */
  async completeConsultation(id: number): Promise<ConsultationResponse> {
    return apiClient.put<ConsultationResponse>(`/api/consultations/${id}/complete`, {});
  },

  /**
   * Cancel an eligible consultation (Farmer).
   */
  async cancelConsultation(id: number): Promise<ConsultationResponse> {
    return apiClient.put<ConsultationResponse>(`/api/consultations/${id}/cancel`, {});
  },
};

export default consultationService;
