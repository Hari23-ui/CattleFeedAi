"""
Image service coordinating validation, preprocessing, quality inspection,
and deterministic visual surface screening.
"""

import logging
from typing import Optional
from fastapi import UploadFile

from app.schemas.analysis import (
    ImageMetadata,
    QualityMetricsSchema,
    ImageQualitySchema,
    VisualIndicatorSchema,
    OverallScreeningSchema,
    VisualAnalysisResponse,
)
from app.utils.image_preprocessing import preprocess_image_bytes, PreprocessingResult
from app.utils.image_quality import assess_image_quality, ImageQualityResult
from app.services.visual_analysis_service import analyze_visual_surface, VisualAnalysisResult
from app.services.ml_inference_service import ml_inference_service

logger = logging.getLogger("cattlefeedai-ai-service.image_service")


class ImageService:
    """Coordinates image validation, preprocessing, quality assessment, and visual screening."""

    def __init__(self):
        pass

    async def analyze_image_upload(self, file: UploadFile) -> VisualAnalysisResponse:
        """
        Full M7.3 analysis pipeline:
        1. Preprocess: Decodes image, guards against decompression bomb, converts to standard RGB.
        2. Assess Quality: Checks resolution, extreme lighting, and contrast metrics.
        3. ML/CV Inference or Deterministic Fallback:
           Runs ML model if enabled/available, otherwise executes deterministic surface screening.
        4. Serializes into strongly-typed VisualAnalysisResponse.
        """
        content = await file.read()
        file_size = len(content)

        logger.info(
            "Starting visual analysis pipeline for '%s' (%s, %d bytes)",
            file.filename,
            file.content_type,
            file_size,
        )

        # Step 1: Preprocessing & Physical Validation
        prep_result: PreprocessingResult = preprocess_image_bytes(
            content=content,
            declared_content_type=file.content_type,
        )

        # Step 2: Image Quality Assessment
        quality_result: ImageQualityResult = assess_image_quality(prep_result.image)

        # Step 3: ML Inference or Deterministic Baseline Fallback
        analysis_result = ml_inference_service.run_inference(
            image=prep_result.image,
            quality_result=quality_result,
        )
        if analysis_result is None:
            # Deterministic M7.2 visual screening fallback
            analysis_result = analyze_visual_surface(
                image=prep_result.image,
                quality_result=quality_result,
            )

        # Step 4: Map to Response Schemas
        metadata_schema = ImageMetadata(
            filename=file.filename,
            content_type=prep_result.content_type,
            size_bytes=prep_result.original_size_bytes,
            width=prep_result.original_width,
            height=prep_result.original_height,
            format=prep_result.format_name,
            was_resized=prep_result.was_resized,
        )

        quality_schema = ImageQualitySchema(
            status=quality_result.status,
            issues=quality_result.issues,
            metrics=QualityMetricsSchema(
                width=quality_result.metrics.width,
                height=quality_result.metrics.height,
                mean_luminance=quality_result.metrics.mean_luminance,
                contrast_std=quality_result.metrics.contrast_std,
            ),
        )

        indicators_schema = [
            VisualIndicatorSchema(
                type=ind.indicator_type,
                label=ind.label,
                confidence=ind.confidence,
                severity=ind.severity,
                evidence=ind.evidence,
            )
            for ind in analysis_result.visual_indicators
        ]

        overall_schema = OverallScreeningSchema(
            status=analysis_result.overall_screening.status,
            summary=analysis_result.overall_screening.summary,
        )

        logger.info(
            "Completed visual analysis for '%s': Quality=%s, Indicators=%d, Status=%s",
            file.filename,
            quality_result.status,
            len(indicators_schema),
            overall_schema.status,
        )

        return VisualAnalysisResponse(
            analysis_available=True,
            analysis_source=analysis_result.analysis_source,
            model_available=analysis_result.model_available,
            model_version=analysis_result.model_version,
            image_metadata=metadata_schema,
            image_quality=quality_schema,
            visual_indicators=indicators_schema,
            overall_screening=overall_schema,
            disclaimer=analysis_result.disclaimer,
        )


image_service = ImageService()
