import { apiClient } from './apiClient';
import { EvidenceSummary } from '../models/evidence';

/**
 * Service for interacting with Integrated Decision Support Evidence API (M12).
 * Aggregates animal profile, feed/silage records, lab tests, quality & risk assessments,
 * visual screening, animal health screening, feed plans, advisories, historical analytics,
 * and expert consultation response into a unified evidence view.
 *
 * Endpoints:
 * - GET /api/evidence/animals/{animalId}
 * - GET /api/evidence/consultations/{consultationId}
 */
export const evidenceService = {
  /**
   * Fetch unified evidence summary for a specific animal.
   */
  async getEvidenceForAnimal(animalId: number): Promise<EvidenceSummary> {
    return apiClient.get<EvidenceSummary>(`/api/evidence/animals/${animalId}`);
  },

  /**
   * Fetch unified evidence summary for an expert consultation.
   */
  async getEvidenceForConsultation(consultationId: number): Promise<EvidenceSummary> {
    return apiClient.get<EvidenceSummary>(`/api/evidence/consultations/${consultationId}`);
  },
};

export default evidenceService;
