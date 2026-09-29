"""
Base model abstraction and interfaces for CattleFeedAI ML/CV inference (M7.3).

STRICT SCIENTIFIC BOUNDARY:
- VISUAL APPEARANCE CLASSIFICATION ONLY (mould, spoilage, foreign material, normal).
- ZERO chemical estimation (no protein, moisture, fiber, aflatoxin, etc.).
- ZERO disease diagnosis (no veterinary/pathology diagnosis).
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from PIL import Image


@dataclass
class VisualPrediction:
    """Represents a discrete visual classification prediction from an ML model."""
    label: str
    confidence: float
    severity: str = "LOW"  # LOW, MEDIUM, HIGH
    evidence: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "confidence": round(self.confidence, 4),
            "severity": self.severity,
            "evidence": self.evidence,
        }


@dataclass
class MLPredictionResult:
    """Aggregated output from ML/CV model inference."""
    model_available: bool
    model_version: Optional[str] = None
    model_name: Optional[str] = None
    predictions: List[VisualPrediction] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_available": self.model_available,
            "model_version": self.model_version,
            "model_name": self.model_name,
            "predictions": [p.to_dict() for p in self.predictions],
        }


class VisualModel(ABC):
    """
    Abstract interface for computer vision / machine learning visual classifiers.
    Any custom model (PyTorch, ONNX, TFLite, Scikit-learn, heuristic embeddings)
    must implement this interface.
    """

    @abstractmethod
    def load(self) -> bool:
        """Loads weights, checkpoints, or configuration. Returns True if successfully loaded."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the model is initialized, loaded, and ready for inference."""
        pass

    @abstractmethod
    def predict(self, image: Image.Image) -> MLPredictionResult:
        """
        Executes inference on a preprocessed PIL image.
        Must return MLPredictionResult containing visual appearance classes only.
        """
        pass

    @abstractmethod
    def model_version(self) -> Optional[str]:
        """Returns the semantic version string of the model."""
        pass

    @abstractmethod
    def model_name(self) -> str:
        """Returns the identifier or architecture name of the model."""
        pass
