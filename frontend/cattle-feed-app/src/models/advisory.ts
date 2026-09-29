/**
 * Advisory Data Models
 * Matches backend schema:
 * - Entity: Advisory.java
 * - Enums: AdvisoryCategory.java, Priority.java, AdvisoryType.java
 * - DTO: AdvisoryResponse.java
 */

export type AdvisoryCategory =
  | 'FEED'
  | 'SILAGE'
  | 'NUTRITION'
  | 'CONTAMINATION'
  | 'STORAGE'
  | 'HEALTH_SCREENING'
  | 'EXPERT_CONSULTATION';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AdvisoryResponse {
  id?: number | null;
  animalId?: number | null;
  animalTag?: string | null;
  category?: AdvisoryCategory | null;
  priority?: Priority | null;
  title: string;
  message: string;
  recommendedAction?: string | null;
  isRead?: boolean | null;
  createdAt?: string | null;
}
