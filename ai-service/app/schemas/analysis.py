"""
Pydantic schemas for image analysis, quality assessment, and visual screening.
"""

from typing import Optional, List, Any
from pydantic import BaseModel, Field


class ImageMetadata(BaseModel):
    filename: Optional[str] = Field(None, description="Original filename if provided")
    content_type: str = Field(..., description="MIME content type")
    size_bytes: int = Field(..., description="File size in bytes")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    format: str = Field(..., description="Decoded image format (JPEG, PNG, WEBP)")
    was_resized: bool = Field(False, description="Whether the image was downscaled for analysis")


class QualityMetricsSchema(BaseModel):
    width: int = Field(..., description="Image width evaluated")
    height: int = Field(..., description="Image height evaluated")
    mean_luminance: float = Field(..., description="Mean grayscale luminance (0-255)")
    contrast_std: float = Field(..., description="Luminance standard deviation / contrast")


class ImageQualitySchema(BaseModel):
    status: str = Field(..., description="Quality status: SUFFICIENT, INSUFFICIENT, or UNUSABLE")
    issues: List[str] = Field(default_factory=list, description="List of detected image quality warnings")
    metrics: QualityMetricsSchema = Field(..., description="Computed quantitative image quality metrics")


class VisualIndicatorSchema(BaseModel):
    type: str = Field(..., description="Indicator classification: MOULD_LIKE_APPEARANCE, SPOILAGE_LIKE_APPEARANCE, FOREIGN_MATERIAL, etc.")
    label: str = Field(..., description="Human-readable indicator label")
    confidence: float = Field(..., description="Visual screening confidence score (0.0 - 1.0)")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH")
    evidence: str = Field(..., description="Visual evidence and rationale")


class OverallScreeningSchema(BaseModel):
    status: str = Field(..., description="Overall screening verdict: NORMAL, POSSIBLE_CONCERN, ABNORMAL, INSUFFICIENT_DATA")
    summary: str = Field(..., description="Summary explanation of the visual screening result")


class VisualAnalysisResponse(BaseModel):
    analysis_available: bool = Field(True, description="Whether visual screening was performed")
    analysis_source: str = Field("DETERMINISTIC_VISUAL_SCREENING", description="Source descriptor: ML_VISUAL_SCREENING or DETERMINISTIC_VISUAL_SCREENING")
    model_available: bool = Field(False, description="Whether an ML model was utilized for inference")
    model_version: Optional[str] = Field(None, description="Active ML model version if used")
    image_metadata: ImageMetadata = Field(..., description="Physical image metadata")
    image_quality: ImageQualitySchema = Field(..., description="Physical image quality assessment")
    visual_indicators: List[VisualIndicatorSchema] = Field(default_factory=list, description="Detected visual indicators")
    overall_screening: OverallScreeningSchema = Field(..., description="Overall visual screening verdict")
    disclaimer: str = Field(..., description="Scientific and non-diagnostic boundary disclaimer")


# Backwards compatibility alias
AnalysisResponse = VisualAnalysisResponse


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error classification")
    message: str = Field(..., description="Human-readable error description")
    detail: Optional[Any] = Field(None, description="Optional diagnostic details")
