/**
 * Analytics and Historical Trends Data Models
 * Strictly matches backend schema:
 * - HistoricalTestPointDto.java
 * - FarmAnalyticsSummaryResponse.java
 * - AnimalAnalyticsResponse.java
 * - SampleHistoricalTrendsResponse.java
 */

export interface HistoricalTestPoint {
  testResultId: number;
  testDate: string; // YYYY-MM-DD
  sampleType: 'FEED' | 'SILAGE' | 'UNKNOWN';
  sampleCode?: string | null;
  analysisSource?: string | null;

  // Measured parameters (null when unrecorded, NEVER defaulted to 0)
  moisture?: number | null;
  crudeProtein?: number | null;
  fiber?: number | null;
  energyValue?: number | null;
  aflatoxin?: number | null;
  mycotoxin?: number | null;
  ph?: number | null;
  mineralStatus?: string | null;
  adulteration?: string | null;
  mouldDetected?: boolean | null;
  spoilageDetected?: boolean | null;

  qualityStatus: 'GOOD' | 'ACCEPTABLE' | 'NEEDS_ATTENTION' | 'UNSAFE' | 'INSUFFICIENT_DATA' | string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  confidenceScore?: number | null;
  triggeredRulesCount: number;
}

export interface FarmAnalyticsSummary {
  totalAnimals: number;
  totalFeedSamples: number;
  totalSilageSamples: number;
  totalTestResults: number;
  totalActiveAdvisories: number;
  totalConsultations: number;

  qualityStatusDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;

  contaminationRiskCount: number;
  nutritionalRiskCount: number;
  storageRiskCount: number;

  daysFilter?: number | null;
  disclaimer: string;
}

export interface AnimalAnalytics {
  animalId: number;
  animalTag: string;
  name?: string | null;
  breed?: string | null;
  gender?: string | null;
  weight?: number | null;
  lactationStage?: string | null;
  milkProductionPerDay?: number | null;
  farmId?: number | null;
  farmName?: string | null;

  totalFeedTests: number;
  totalSilageTests: number;
  totalTestResults: number;
  totalActiveAdvisories: number;
  totalConsultations: number;

  daysFilter?: number | null;

  latestMeasurements?: HistoricalTestPoint | null;
  testHistory: HistoricalTestPoint[];

  qualityStatusDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;

  activeAdvisoryTitles: string[];
  healthRiskSummary: string[];

  descriptiveSummary: string;
  disclaimer: string;
}

export interface SampleHistoricalTrends {
  sampleId: number;
  sampleCode: string;
  sampleType: 'FEED' | 'SILAGE';
  subtype?: string | null;
  farmId?: number | null;
  farmName?: string | null;
  animalId?: number | null;
  animalTag?: string | null;
  sampleDate: string;

  totalTestPoints: number;
  daysFilter?: number | null;

  testPoints: HistoricalTestPoint[];
  qualityStatusDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;

  descriptiveSummary: string;
  disclaimer: string;
}
