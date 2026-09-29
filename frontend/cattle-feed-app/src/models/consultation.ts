/**
 * Consultation Data Models
 * Matches backend DTOs:
 * - ConsultationRequest.java
 * - ExpertRecommendationRequest.java
 * - ConsultationResponse.java
 */

export type ConsultationStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_REVIEW'
  | 'RESPONDED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export type Specialization =
  | 'ANIMAL_NUTRITION'
  | 'VETERINARY'
  | 'DAIRY_MANAGEMENT'
  | 'OTHER';

export interface ConsultationRequest {
  subject: string;
  question: string;
  additionalContext?: string;
  animalId?: number;
  feedSampleId?: number;
  silageSampleId?: number;
}

export interface ExpertRecommendationRequest {
  recommendation: string;
  expertNotes?: string;
}

export interface AnimalSummaryDto {
  id: number;
  animalTag: string;
  name?: string;
  breed?: string;
  species?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: string;
  weight?: number;
  lactationStage?: string;
  daysInMilk?: number;
  milkProductionPerDay?: number;
  pregnancyStatus?: string;
  feedIntakeStatus?: string;
}

export interface TestResultSummaryDto {
  id: number;
  testDate: string;
  analysisSource?: string;
  overallQuality?: string;
  moisture?: number;
  crudeProtein?: number;
  fiber?: number;
  ph?: number;
  mouldDetected?: boolean;
  spoilageDetected?: boolean;
  confidenceScore?: number;
}

export interface SampleImageSummaryDto {
  id: number;
  originalFilename?: string;
  storedFilename: string;
  fileReference: string;
  contentType: string;
  fileSize: number;
  caption?: string;
  createdAt: string;
}

export interface FeedSampleSummaryDto {
  id: number;
  sampleCode: string;
  feedType?: string;
  source?: string;
  sampleDate: string;
  notes?: string;
  testResults: TestResultSummaryDto[];
  latestQuality?: string;
  images: SampleImageSummaryDto[];
}

export interface SilageSampleSummaryDto {
  id: number;
  sampleCode: string;
  silageType?: string;
  source?: string;
  sampleDate: string;
  notes?: string;
  testResults: TestResultSummaryDto[];
  latestQuality?: string;
  images: SampleImageSummaryDto[];
}

export interface HealthRiskSummaryDto {
  id: number;
  riskType: string;
  riskLevel: string;
  description?: string;
  detectedDate: string;
  source?: string;
  recommendation?: string;
}

export interface AdvisorySummaryDto {
  id: number;
  title: string;
  message: string;
  advisoryType?: string;
  priority?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface ConsultationResponse {
  id: number;
  subject: string;
  question: string;
  additionalContext?: string;
  status: ConsultationStatus;
  requestDate: string;
  responseDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Farmer Information
  farmerId: number;
  farmerName: string;
  farmerEmail: string;
  farmerPhone?: string;

  // Expert Information
  expertId?: number;
  expertName?: string;
  expertEmail?: string;
  expertPhone?: string;
  expertQualification?: string;
  expertSpecialization?: Specialization;
  expertExperienceYears?: number;
  expertLicenseNumber?: string;

  // Expert Response
  expertRecommendation?: string;
  expertNotes?: string;

  // Related References
  animalId?: number;
  animalTag?: string;

  feedSampleId?: number;
  feedSampleCode?: string;

  silageSampleId?: number;
  silageSampleCode?: string;

  // Detailed Review Context
  animal?: AnimalSummaryDto;
  feedSample?: FeedSampleSummaryDto;
  silageSample?: SilageSampleSummaryDto;
  healthRisks?: HealthRiskSummaryDto[];
  advisories?: AdvisorySummaryDto[];
}
