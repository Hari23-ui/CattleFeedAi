/**
 * Visual Analysis & Screening models for CattleFeedAI (M7.2).
 * Physical surface screening only: NO chemical measurements, NO disease diagnosis.
 */

export interface QualityMetrics {
  width: number;
  height: number;
  mean_luminance: number;
  contrast_std: number;
}

export interface ImageQualityResult {
  status: 'SUFFICIENT' | 'INSUFFICIENT' | 'UNUSABLE';
  issues: string[];
  metrics?: QualityMetrics;
}

export interface VisualIndicator {
  type: string;
  label: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: string;
}

export interface OverallScreening {
  status: 'NORMAL' | 'POSSIBLE_CONCERN' | 'ABNORMAL' | 'INSUFFICIENT_DATA';
  summary: string;
}

export interface ImageMetadata {
  filename?: string;
  content_type: string;
  size_bytes: number;
  width: number;
  height: number;
  format: string;
  was_resized?: boolean;
}

export interface VisualAnalysisResponse {
  analysis_available: boolean;
  analysis_source: string;
  model_available?: boolean;
  model_version?: string;
  image_metadata: ImageMetadata;
  image_quality: ImageQualityResult;
  visual_indicators: VisualIndicator[];
  overall_screening: OverallScreening;
  disclaimer: string;
}
