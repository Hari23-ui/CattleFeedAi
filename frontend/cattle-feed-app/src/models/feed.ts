/**
 * Feed Sample Data Models
 * Strictly matches backend schema:
 * - DTO: FeedSampleRequest.java
 * - DTO: FeedSampleResponse.java
 * - Entity: FeedSample.java
 * - Enum: FeedType.java
 */

export type FeedType =
  | 'CATTLE_FEED_PELLET'
  | 'FEED_MASH'
  | 'MINERAL_MIXTURE'
  | 'GREEN_FODDER'
  | 'DRY_FODDER'
  | 'OTHER';

export interface FeedSample {
  id: number;
  farmId: number;
  animalId?: number | null;
  sampleCode: string;
  feedType: FeedType;
  sampleDate: string; // ISO date YYYY-MM-DD
  source?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateFeedSampleRequest {
  farmId: number;
  animalId?: number;
  sampleCode: string;
  feedType: FeedType;
  sampleDate: string; // YYYY-MM-DD
  source?: string;
  notes?: string;
}

export interface UpdateFeedSampleRequest {
  farmId: number;
  animalId?: number;
  sampleCode: string;
  feedType: FeedType;
  sampleDate: string; // YYYY-MM-DD
  source?: string;
  notes?: string;
}
