"""
ML/CV models package for CattleFeedAI (M7.3).
"""

from app.models.base import VisualModel, VisualPrediction, MLPredictionResult
from app.models.visual_classifier import VisualClassifierModel
from app.models.model_loader import load_visual_model, DisabledVisualModel

__all__ = [
    "VisualModel",
    "VisualPrediction",
    "MLPredictionResult",
    "VisualClassifierModel",
    "DisabledVisualModel",
    "load_visual_model",
]
