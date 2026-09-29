/**
 * Risk Assessment Data Models
 * Matches backend schema:
 * - DTO: RiskAssessmentResponse.java
 * - DTO: RiskIndicatorDto.java
 * - Enums: RiskLevel.java, Severity.java
 */

import { AdvisoryCategory } from './advisory';
import { AssessmentParameter } from './assessment';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export type Severity = 'INFO' | 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface RiskIndicatorDto {
  category: AdvisoryCategory;
  riskTitle: string;
  severity: Severity;
  description: string;
  mitigationRecommendation?: string | null;
  detectedParameter?: AssessmentParameter | null;
}

export interface RiskAssessmentResponse {
  testResultId?: number | null;
  sampleCode?: string | null;
  overallRiskLevel: RiskLevel;
  allRisks: RiskIndicatorDto[];
  contaminationRisks: RiskIndicatorDto[];
  nutritionalImbalances: RiskIndicatorDto[];
  storageSpoilageRisks: RiskIndicatorDto[];
  evaluationTimestamp?: string | null;
  screeningDisclaimer?: string | null;
}
