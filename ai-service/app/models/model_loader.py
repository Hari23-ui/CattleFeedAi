"""
Model loader factory and configuration manager for CattleFeedAI ML/CV inference (M7.3).

Ensures:
- Safe, non-crashing initialization
- Configurable model path, version, and confidence threshold
- Clean fallback to disabled state if MODEL_ENABLED=False or weights are missing
"""

import logging
from typing import Optional, Dict, Any

from app.config import settings
from app.models.base import VisualModel
from app.models.visual_classifier import VisualClassifierModel

logger = logging.getLogger("cattlefeedai-ai-service.model_loader")


class DisabledVisualModel(VisualModel):
    """Fallback null-object model used when MODEL_ENABLED is False or no model exists."""

    def load(self) -> bool:
        return False

    def is_available(self) -> bool:
        return False

    def predict(self, image) -> Any:
        from app.models.base import MLPredictionResult
        return MLPredictionResult(
            model_available=False,
            model_version=None,
            model_name=None,
            predictions=[],
        )

    def model_version(self) -> Optional[str]:
        return None

    def model_name(self) -> str:
        return "None"


def load_visual_model(
    enabled: Optional[bool] = None,
    model_path: Optional[str] = None,
    model_version: Optional[str] = None,
    model_name: Optional[str] = None,
    confidence_threshold: Optional[float] = None,
) -> VisualModel:
    """
    Factory function to load and initialize a VisualModel instance.
    Uses app settings defaults if parameters are omitted.
    """
    is_enabled = enabled if enabled is not None else settings.MODEL_ENABLED
    path = model_path if model_path is not None else settings.MODEL_PATH
    version = model_version if model_version is not None else settings.MODEL_VERSION
    name = model_name if model_name is not None else settings.MODEL_NAME
    threshold = confidence_threshold if confidence_threshold is not None else settings.MODEL_CONFIDENCE_THRESHOLD

    if not is_enabled:
        logger.info("ML/CV model is disabled via configuration (MODEL_ENABLED=False).")
        return DisabledVisualModel()

    logger.info("Initializing ML/CV model '%s' v%s (Path: %s, Threshold: %.2f)", name, version, path, threshold)

    try:
        model = VisualClassifierModel(
            model_path=path,
            model_version=version,
            model_name=name,
            confidence_threshold=threshold,
            auto_load=True,
        )
        if model.is_available():
            logger.info("ML/CV model '%s' is loaded and ready.", name)
        else:
            logger.info("ML/CV model '%s' could not load weights from path '%s'; fallback baseline active.", name, path)
        return model
    except Exception as e:
        logger.error("Error initializing ML model: %s. Using disabled model fallback.", str(e))
        return DisabledVisualModel()
