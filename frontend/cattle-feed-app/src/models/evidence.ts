import { Animal } from './animal';
import { FeedPlan } from './feedPlan';
import { AdvisoryResponse } from './advisory';
import { QualityAssessmentResponse } from './assessment';
import { RiskAssessmentResponse, RiskIndicatorDto } from './risk';
import { AnimalHealthScreeningResponse } from './animalHealth';
import { HistoricalTestPoint } from './analytics';

export type EvidenceSourceType =
  | 'LABORATORY_DATA'
  | 'RECORDED_DATA'
  | 'AI_VISUAL_SCREENING'
  | 'DETERMINISTIC_VISUAL_SCREENING'
  | 'RULE_BASED_QUALITY_ASSESSMENT'
  | 'RISK_SCREENING'
  | 'ANIMAL_HEALTH_SCREENING'
  | 'FARMER_RECORDED_INFORMATION'
  | 'EXPERT_RESPONSE'
  | 'HISTORICAL_ANALYTICS';

export interface ConsultationEvidence {
  id: number;
  subject: string;
  question: string;
  additionalContext?: string;
  status: string;
  requestDate?: string;
  responseDate?: string;
  completedAt?: string;
  farmerId?: number;
  farmerName?: string;
  expertId?: number;
  expertName?: string;
  expertSpecialization?: string;
  expertRecommendation?: string;
  expertNotes?: string;
  evidenceSource: string;
}

export interface FeedEvidence {
  feedSampleId: number;
  sampleCode: string;
  feedType?: string;
  source?: string;
  sampleDate?: string;
  notes?: string;
  imageCount: number;
  latestQuality: string;
  evidenceSource: string;
}

export interface SilageEvidence {
  silageSampleId: number;
  sampleCode: string;
  silageType?: string;
  source?: string;
  sampleDate?: string;
  notes?: string;
  imageCount: number;
  latestQuality: string;
  evidenceSource: string;
}

export interface TestResultEvidence {
  testResultId: number;
  sampleType: 'FEED' | 'SILAGE' | 'UNKNOWN';
  sampleCode?: string;
  testDate: string;
  analysisSource: string;
  moisture?: number;
  crudeProtein?: number;
  fiber?: number;
  energyValue?: number;
  ph?: number;
  mineralStatus?: string;
  aflatoxin?: number;
  mycotoxin?: number;
  adulteration?: string;
  mouldDetected?: boolean;
  spoilageDetected?: boolean;
  overallQuality?: string;
  confidenceScore?: number;
  qualityStatus: string;
  riskLevel: string;
  evidenceSource: string;
}

export interface VisualScreeningEvidence {
  evidenceAvailable: boolean;
  analysisSource: string;
  modelVersion?: string;
  modelAvailable?: boolean;
  visualStatus: string;
  mouldDetected?: boolean;
  spoilageDetected?: boolean;
  foreignMaterialDetected?: boolean;
  confidenceScore?: number;
  imageReference?: string;
  sampleType?: string;
  sampleId?: number;
  identifiedVisualRisks: string[];
  screeningNotes?: string;
  screeningTimestamp?: string;
  disclaimer: string;
  evidenceSource: string;
}

export interface HistoricalSummaryEvidence {
  totalTestResults: number;
  totalFeedTests: number;
  totalSilageTests: number;
  totalConsultations: number;
  totalActiveAdvisories: number;
  qualityDistribution: Record<string, number>;
  riskDistribution: Record<string, number>;
  latestMeasurements?: HistoricalTestPoint;
  descriptiveSummary: string;
  disclaimer: string;
  evidenceSource: string;
}

export interface EvidenceSummary {
  animal?: Animal;
  consultation?: ConsultationEvidence;
  feedEvidence: FeedEvidence[];
  silageEvidence: SilageEvidence[];
  testEvidence: TestResultEvidence[];
  qualityEvidence?: QualityAssessmentResponse;
  riskEvidence?: RiskAssessmentResponse;
  visualScreeningEvidence?: VisualScreeningEvidence;
  healthScreeningEvidence?: AnimalHealthScreeningResponse;
  feedPlans: FeedPlan[];
  advisories: AdvisoryResponse[];
  historicalSummary?: HistoricalSummaryEvidence;
  disclaimer: string;
}
