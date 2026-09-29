/**
 * Animal Data Models
 * Strictly matches backend schema:
 * - DTO: AnimalRequest.java
 * - DTO: AnimalResponse.java
 * - Entity: Animal.java
 * - Enums: Gender, LactationStage, PregnancyStatus, FeedIntakeStatus
 */

export type Gender = 'MALE' | 'FEMALE';
export type LactationStage = 'DRY' | 'EARLY' | 'MID' | 'LATE';
export type PregnancyStatus = 'PREGNANT' | 'NOT_PREGNANT' | 'UNKNOWN';
export type FeedIntakeStatus = 'NORMAL' | 'REDUCED' | 'INCREASED' | 'UNKNOWN';

export interface Animal {
  id: number;
  farmId: number;
  animalTag: string;
  name?: string | null;
  breed?: string | null;
  gender: Gender;
  dateOfBirth?: string | null;
  weight?: number | null;
  lactationStage?: LactationStage | null;
  daysInMilk?: number | null;
  milkProductionPerDay?: number | null;
  pregnancyStatus?: PregnancyStatus | null;
  feedIntakeStatus?: FeedIntakeStatus | null;
}

export interface CreateAnimalRequest {
  farmId: number;
  animalTag: string;
  name?: string;
  breed?: string;
  gender: Gender;
  dateOfBirth?: string;
  weight?: number;
  lactationStage?: LactationStage;
  daysInMilk?: number;
  milkProductionPerDay?: number;
  pregnancyStatus?: PregnancyStatus;
  feedIntakeStatus?: FeedIntakeStatus;
}

export interface UpdateAnimalRequest {
  farmId: number;
  animalTag: string;
  name?: string;
  breed?: string;
  gender: Gender;
  dateOfBirth?: string;
  weight?: number;
  lactationStage?: LactationStage;
  daysInMilk?: number;
  milkProductionPerDay?: number;
  pregnancyStatus?: PregnancyStatus;
  feedIntakeStatus?: FeedIntakeStatus;
}
