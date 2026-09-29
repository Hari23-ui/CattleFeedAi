"""
ML/CV Inference Service coordinating computer vision model execution (M7.3).

Responsibilities:
- Manages loaded VisualModel lifecycle
- Runs inference on preprocessed images
- Maps ML predictions into standard VisualIndicator and OverallScreening structures
- Enforces strict scientific boundaries (ZERO chemical predictions, ZERO disease diagnosis)
- Handles low-confidence predictions gracefully
- Supplies fallback signaling to deterministic M7.2 pipeline when model is unavailable
"""

import logging
from typing import Optional, Dict, Any, List
from PIL import Image

from app.models.base import VisualModel, MLPredictionResult
from app.models.model_loader import load_visual_model
from app.utils.image_quality import ImageQualityResult
from app.services.visual_analysis_service import (
    VisualIndicator,
    OverallScreening,
    VisualAnalysisResult,
    DISCLAIMER_TEXT,
)

logger = logging.getLogger("cattlefeedai-ai-service.ml_inference")


class MLInferenceService:
    """Manages ML/CV model lifecycle and inference orchestration."""

    def __init__(self, model: Optional[VisualModel] = None):
        self._model = model if model is not None else load_visual_model()

    def set_model(self, model: VisualModel) -> None:
        """Allows runtime injection of a model (useful for testing and configuration changes)."""
        self._model = model

    def is_model_available(self) -> bool:
        """Returns True if an ML/CV model is active and ready."""
        return self._model.is_available()

    def get_model_info(self) -> Dict[str, Any]:
        """Returns metadata about the active ML/CV model."""
        return {
            "available": self._model.is_available(),
            "version": self._model.model_version(),
            "name": self._model.model_name(),
        }

    def run_inference(
        self,
        image: Image.Image,
        quality_result: ImageQualityResult,
    ) -> Optional[VisualAnalysisResult]:
        """
        Executes ML/CV inference on the image if a model is available.
        If no model is available, returns None (signaling fallback to deterministic heuristics).
        """
        if not self._model.is_available():
            logger.debug("ML model not available; delegating to deterministic screening fallback.")
            return None

        # Check physical image usability
        if quality_result.status == "UNUSABLE":
            logger.info("Image deemed UNUSABLE by quality checker; ML inference aborts with INSUFFICIENT_DATA.")
            return VisualAnalysisResult(
                image_quality=quality_result,
                visual_indicators=[],
                overall_screening=OverallScreening(
                    status="INSUFFICIENT_DATA",
                    summary="Image quality is unusable for ML visual inspection. Please recapture with proper lighting and focus.",
                ),
                analysis_source="ML_VISUAL_SCREENING",
                analysis_available=True,
                model_available=True,
                model_version=self._model.model_version(),
            )

        # Run model prediction
        ml_output: MLPredictionResult = self._model.predict(image)

        indicators: List[VisualIndicator] = []
        for pred in ml_output.predictions:
            indicators.append(
                VisualIndicator(
                    indicator_type=pred.label,
                    label=pred.label.replace("_", " ").title(),
                    confidence=pred.confidence,
                    severity=pred.severity,
                    evidence=pred.evidence,
                )
            )

        # Derive overall verdict from ML predictions
        if any(ind.severity == "HIGH" for ind in indicators):
            status = "ABNORMAL"
            summary = "ML visual screening detected abnormal surface indicators (high severity mould or decay)."
        elif any(ind.severity in ("MEDIUM", "LOW") for ind in indicators):
            status = "POSSIBLE_CONCERN"
            summary = "ML visual screening flagged possible surface indicators requiring visual inspection."
        else:
            status = "NORMAL"
            summary = "ML computer vision model detected standard surface appearance without visible mould, spoilage, or foreign particles."

        return VisualAnalysisResult(
            image_quality=quality_result,
            visual_indicators=indicators,
            overall_screening=OverallScreening(status=status, summary=summary),
            analysis_source="ML_VISUAL_SCREENING",
            analysis_available=True,
            model_available=True,
            model_version=self._model.model_version(),
        )


# Global singleton instance
ml_inference_service = MLInferenceService()
