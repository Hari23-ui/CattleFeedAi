/**
 * Feed Planning & Management Models (M11)
 */

export interface AnimalSummary {
  id: number;
  animalTag: string;
  name?: string;
  breed?: string;
  category?: string;
  farmId?: number;
  farmName?: string;
}

export interface FeedSampleSummary {
  id: number;
  sampleCode: string;
  feedType?: string;
  sampleDate?: string;
  source?: string;
}

export interface SilageSampleSummary {
  id: number;
  sampleCode: string;
  silageType?: string;
  sampleDate?: string;
  source?: string;
}

export interface TestResultSummary {
  id: number;
  testDate: string;
  laboratory?: string;
  moisture?: number;
  crudeProtein?: number;
  acidDetergentFiber?: number;
  neutralDetergentFiber?: number;
  ph?: number;
  notes?: string;
}

export interface AdvisorySummary {
  id: number;
  category?: string;
  priority?: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface RiskIndicatorSummary {
  category?: string;
  riskTitle: string;
  severity: string;
  description?: string;
  mitigationRecommendation?: string;
  detectedParameter?: string;
}

export interface FeedPlan {
  id: number;
  planName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | string;
  plannedQuantity?: number;
  frequency?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  animal: AnimalSummary;
  feedSample?: FeedSampleSummary;
  silageSample?: SilageSampleSummary;
  latestTestResult?: TestResultSummary;
  qualityStatus?: string;
  riskLevel?: string;
  riskIndicators?: RiskIndicatorSummary[];
  recentAdvisories?: AdvisorySummary[];
  disclaimer?: string;
}

export interface FeedPlanRequest {
  planName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: string;
  animalId: number;
  feedSampleId?: number;
  silageSampleId?: number;
  plannedQuantity?: number;
  frequency?: string;
  notes?: string;
}
