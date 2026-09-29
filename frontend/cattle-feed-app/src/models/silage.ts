/**
 * Silage Sample Data Models
 * Strictly matches backend schema:
 * - DTO: SilageSampleRequest.java
 * - DTO: SilageSampleResponse.java
 * - Entity: SilageSample.java
 * - Enum: SilageType.java
 */

export type SilageType =
  | 'MAIZE'
  | 'SORGHUM'
  | 'NAPIER'
  | 'MIXED'
  | 'OTHER';

export interface SilageSample {
  id: number;
  farmId: number;
  animalId?: number | null;
  sampleCode: string;
  silageType: SilageType;
  sampleDate: string; // ISO date YYYY-MM-DD
  source?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateSilageSampleRequest {
  farmId: number;
  animalId?: number | null;
  sampleCode: string;
  silageType: SilageType;
  sampleDate: string; // YYYY-MM-DD
  source?: string | null;
  notes?: string | null;
}

export interface UpdateSilageSampleRequest {
  farmId: number;
  animalId?: number | null;
  sampleCode: string;
  silageType: SilageType;
  sampleDate: string; // YYYY-MM-DD
  source?: string | null;
  notes?: string | null;
}

