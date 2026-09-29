/**
 * Animal Health Risk Screening Models
 * Matches backend schema:
 * - Service: AnimalHealthScreeningService.java
 * - DTO: AnimalHealthScreeningResponse.java
 * - Entities: HealthObservation.java, HealthRisk.java
 * - Enums: RiskLevel, Severity, AdvisoryCategory, AppetiteStatus, MilkProductionStatus, ActivityStatus
 */

import { RiskIndicatorDto } from './risk';

export type HealthScreeningStatus =
  | 'NORMAL'
  | 'POTENTIAL_CONCERN'
  | 'INSUFFICIENT_DATA';

export type AppetiteStatus = 'NORMAL' | 'REDUCED' | 'INCREASED' | 'UNKNOWN';
export type MilkProductionStatus = 'NORMAL' | 'REDUCED' | 'INCREASED' | 'UNKNOWN';
export type ActivityStatus = 'NORMAL' | 'LETHARGIC' | 'RESTLESS' | 'UNKNOWN';

export interface AnimalHealthScreeningResponse {
  animalId: number;
  animalTag: string;
  screeningStatus: HealthScreeningStatus;
  missingInformation: string[];
  detectedRisks: RiskIndicatorDto[];
  recentObservationsCount: number;
  recentTestResultsCount: number;
  dietaryAndHealthSummary: string;
  recommendationSummary: string;
  screeningTimestamp?: string | null;
  disclaimer: string;
}

export interface HealthObservation {
  id?: number;
  animalId: number;
  observationDate: string; // YYYY-MM-DD
  appetiteStatus?: AppetiteStatus | null;
  milkProductionStatus?: MilkProductionStatus | null;
  activityStatus?: ActivityStatus | null;
  digestiveObservation?: string | null;
  visibleSigns?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export interface HealthRiskRecord {
  id?: number;
  animalId: number;
  riskType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  description?: string | null;
  detectedDate: string;
  source?: string | null;
  recommendation?: string | null;
  createdAt?: string | null;
}
