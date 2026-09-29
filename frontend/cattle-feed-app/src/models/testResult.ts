/**
 * Test Result Data Models
 * Strictly matches backend schema:
 * - DTO: TestResultRequest.java
 * - DTO: TestResultResponse.java
 * - Entity: TestResult.java
 * - Enums: AnalysisSource.java, OverallQuality.java
 */

export type AnalysisSource =
  | 'MANUAL'
  | 'LAB'
  | 'NIR'
  | 'IOT'
  | 'AI'
  | 'IMAGE';

export type OverallQuality =
  | 'GOOD'
  | 'MODERATE'
  | 'POOR'
  | 'UNSAFE'
  | 'UNKNOWN';

export interface TestResult {
  id: number;
  feedSampleId?: number | null;
  silageSampleId?: number | null;
  testDate?: string | null; // YYYY-MM-DD
  moisture?: number | null;
  crudeProtein?: number | null;
  fiber?: number | null;
  energyValue?: number | null;
  mineralStatus?: string | null;
  aflatoxin?: number | null;
  mycotoxin?: number | null;
  ph?: number | null;
  adulteration?: string | null;
  mouldDetected?: boolean | null;
  spoilageDetected?: boolean | null;
  overallQuality?: OverallQuality | null;
  confidenceScore?: number | null;
  analysisSource?: AnalysisSource | null;
  createdAt?: string | null;
}

export interface CreateTestResultRequest {
  feedSampleId?: number | null;
  silageSampleId?: number | null;
  testDate?: string | null;
  moisture?: number | null;
  crudeProtein?: number | null;
  fiber?: number | null;
  energyValue?: number | null;
  mineralStatus?: string | null;
  aflatoxin?: number | null;
  mycotoxin?: number | null;
  ph?: number | null;
  adulteration?: string | null;
  mouldDetected?: boolean | null;
  spoilageDetected?: boolean | null;
  confidenceScore?: number | null;
  analysisSource?: AnalysisSource;
}

