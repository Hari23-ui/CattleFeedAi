/**
 * Quality Assessment Data Models
 * Matches backend schema:
 * - DTO: QualityAssessmentResponse.java
 * - DTO: ParameterAssessmentDto.java
 * - DTO: AssessmentSummaryResponse.java
 * - Enums: QualityStatus.java, AssessmentParameter.java
 */

import { AdvisoryResponse } from './advisory';
import { RiskAssessmentResponse } from './risk';

export type QualityStatus =
  | 'GOOD'
  | 'ACCEPTABLE'
  | 'NEEDS_ATTENTION'
  | 'UNSAFE'
  | 'INSUFFICIENT_DATA';

export type AssessmentParameter =
  | 'MOISTURE'
  | 'CRUDE_PROTEIN'
  | 'FIBER'
  | 'ENERGY_VALUE'
  | 'AFLATOXIN'
  | 'MYCOTOXIN'
  | 'PH'
  | 'MINERAL_STATUS'
  | 'ADULTERATION'
  | 'MOULD_DETECTED'
  | 'SPOILAGE_DETECTED';

export interface ParameterAssessmentDto {
  parameter: AssessmentParameter;
  measuredValue?: unknown;
  unit?: string | null;
  status: string; // 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | 'NOT_AVAILABLE'
  evaluationNote: string;
}

export interface QualityAssessmentResponse {
  testResultId?: number | null;
  sampleType?: string | null;
  sampleId?: number | null;
  sampleCode?: string | null;
  qualityStatus: QualityStatus;
  explanation: string;
  parameters: ParameterAssessmentDto[];
  triggeredRulesCount: number;
  evaluationTimestamp?: string | null;
  disclaimer?: string | null;
}

export interface AssessmentSummaryResponse {
  qualityAssessment: QualityAssessmentResponse;
  riskAssessment: RiskAssessmentResponse;
  generatedAdvisories: AdvisoryResponse[];
}
