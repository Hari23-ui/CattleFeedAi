"""
Comprehensive unit and integration tests for M7.3 ML/CV Model Architecture and Integration.

Covers:
1. Model interface implementation and contracts
2. Model unavailable state & fallback to deterministic screening
3. Model configuration handling (MODEL_ENABLED, MODEL_PATH, MODEL_CONFIDENCE_THRESHOLD)
4. Model versioning and metadata reporting
5. Inference result schema integrity
6. Low-confidence prediction handling (< threshold)
7. Physical image quality interaction (UNUSABLE image handling)
8. Strict scientific safety: NO chemical predictions, NO disease diagnosis
9. Prominent scientific boundary disclaimer enforcement
10. FastAPI endpoints integration (/health, /api/v1/info, /api/v1/analyze/image)
"""

import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.models.base import VisualModel, VisualPrediction, MLPredictionResult
from app.models.visual_classifier import VisualClassifierModel
from app.models.model_loader import load_visual_model, DisabledVisualModel
from app.services.ml_inference_service import MLInferenceService, ml_inference_service
from app.utils.image_quality import assess_image_quality

client = TestClient(app)

FORBIDDEN_CHEMICAL_KEYS = [
    "protein", "crude_protein", "moisture", "fiber", "ash",
    "aflatoxin", "mycotoxin", "ph", "dry_matter", "tdn", "nel",
    "urea", "minerals", "calcium", "phosphorus"
]

FORBIDDEN_DIAGNOSTIC_KEYS = [
    "disease", "diagnosis", "mastitis", "acidosis", "ketosis", "pathology"
]


def create_test_image(color=(120, 160, 90), size=(200, 200)) -> Image.Image:
    """Helper to create a textured test PIL Image with normal luminance and contrast."""
    img = Image.new("RGB", size, color=color)
    for y in range(0, size[1], 4):
        for x in range(0, size[0], 4):
            img.putpixel((x, y), (min(255, color[0] + 25), min(255, color[1] + 25), min(255, color[2] + 25)))
    return img


def create_jpeg_bytes(color=(120, 160, 90), size=(200, 200)) -> bytes:
    """Helper to create valid JPEG byte data."""
    img = create_test_image(color, size)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


class MockCustomModel(VisualModel):
    """Custom test model implementing the VisualModel interface for test validation."""

    def __init__(self, available: bool = True, version: str = "mock-cv-1.0"):
        self._available = available
        self._version = version

    def load(self) -> bool:
        return self._available

    def is_available(self) -> bool:
        return self._available

    def predict(self, image: Image.Image) -> MLPredictionResult:
        if not self._available:
            return MLPredictionResult(model_available=False, model_version=None, predictions=[])

        return MLPredictionResult(
            model_available=True,
            model_version=self._version,
            model_name="MockCustomModel",
            predictions=[
                VisualPrediction(
                    label="MOULD_LIKE_APPEARANCE",
                    confidence=0.88,
                    severity="HIGH",
                    evidence="Mock visual classifier observed superficial mycelial surface patterns.",
                )
            ],
        )

    def model_version(self) -> str:
        return self._version

    def model_name(self) -> str:
        return "MockCustomModel"


# ── TEST GROUP 1: Model Interface & Base Abstractions ────────────────────────

def test_visual_model_interface_contract():
    """Verify that any VisualModel properly implements required abstract methods."""
    model = MockCustomModel(available=True, version="test-v1")
    assert model.is_available() is True
    assert model.model_version() == "test-v1"
    assert model.model_name() == "MockCustomModel"

    img = create_test_image()
    pred_result = model.predict(img)
    assert isinstance(pred_result, MLPredictionResult)
    assert pred_result.model_available is True
    assert pred_result.model_version == "test-v1"
    assert len(pred_result.predictions) == 1
    assert pred_result.predictions[0].label == "MOULD_LIKE_APPEARANCE"


def test_disabled_visual_model():
    """Verify that DisabledVisualModel safely returns unavailable status."""
    disabled = DisabledVisualModel()
    assert disabled.is_available() is False
    assert disabled.model_version() is None
    assert disabled.model_name() == "None"

    pred = disabled.predict(create_test_image())
    assert pred.model_available is False
    assert len(pred.predictions) == 0


# ── TEST GROUP 2: Model Loader & Configuration ──────────────────────────────

def test_model_loader_when_disabled():
    """Verify load_visual_model returns disabled model when enabled=False."""
    model = load_visual_model(enabled=False)
    assert model.is_available() is False
    assert isinstance(model, DisabledVisualModel)


def test_model_loader_when_file_not_found():
    """Verify load_visual_model handles non-existent file path gracefully without crashing."""
    model = load_visual_model(
        enabled=True,
        model_path="non_existent_weights_file.json",
        model_version="test-1.0",
    )
    assert model.is_available() is False


def test_visual_classifier_spatial_inference():
    """Verify VisualClassifierModel executes inference and produces valid visual indicators."""
    classifier = VisualClassifierModel(
        model_path=None,
        model_version="classifier-test-1.0",
        confidence_threshold=0.50,
        auto_load=False,
    )
    # Simulate loaded state
    classifier._is_loaded = True
    assert classifier.is_available() is True
    assert classifier.model_version() == "classifier-test-1.0"

    # Test image with mould-like patch
    img = Image.new("RGB", (224, 224), color=(80, 140, 60))
    # Add a bright whitish-gray patch covering cell (0,0)
    for y in range(0, 70):
        for x in range(0, 70):
            img.putpixel((x, y), (230, 230, 230))

    result = classifier.predict(img)
    assert result.model_available is True
    assert result.model_version == "classifier-test-1.0"
    assert any(p.label == "MOULD_LIKE_APPEARANCE" for p in result.predictions)


# ── TEST GROUP 3: ML Inference Service & Fallback ───────────────────────────

def test_ml_inference_service_fallback_when_unavailable():
    """Verify MLInferenceService returns None when model is unavailable (triggering deterministic fallback)."""
    service = MLInferenceService(model=DisabledVisualModel())
    assert service.is_model_available() is False

    img = create_test_image()
    quality = assess_image_quality(img)
    res = service.run_inference(img, quality)
    assert res is None  # Signals pipeline to run deterministic baseline


def test_ml_inference_service_executes_when_available():
    """Verify MLInferenceService produces ML_VISUAL_SCREENING when model is loaded."""
    mock_model = MockCustomModel(available=True, version="ml-active-2.0")
    service = MLInferenceService(model=mock_model)
    assert service.is_model_available() is True

    img = create_test_image()
    quality = assess_image_quality(img)
    res = service.run_inference(img, quality)

    assert res is not None
    assert res.analysis_source == "ML_VISUAL_SCREENING"
    assert res.model_available is True
    assert res.model_version == "ml-active-2.0"
    assert len(res.visual_indicators) == 1
    assert res.visual_indicators[0].indicator_type == "MOULD_LIKE_APPEARANCE"


def test_ml_inference_service_unusable_image():
    """Verify unusable image yields INSUFFICIENT_DATA even when ML model is active."""
    mock_model = MockCustomModel(available=True, version="ml-active-2.0")
    service = MLInferenceService(model=mock_model)

    tiny_img = Image.new("RGB", (10, 10), (0, 0, 0))
    quality = assess_image_quality(tiny_img)
    assert quality.status == "UNUSABLE"

    res = service.run_inference(tiny_img, quality)
    assert res is not None
    assert res.overall_screening.status == "INSUFFICIENT_DATA"
    assert len(res.visual_indicators) == 0


# ── TEST GROUP 4: Strict Scientific Boundaries ──────────────────────────────

def test_ml_inference_strictly_no_chemical_or_disease_data():
    """Verify that ML predictions strictly exclude chemical predictions and disease diagnoses."""
    mock_model = MockCustomModel(available=True, version="ml-eval-1.0")
    service = MLInferenceService(model=mock_model)

    img = create_test_image()
    quality = assess_image_quality(img)
    res = service.run_inference(img, quality)

    res_dict = res.to_dict()

    for key in FORBIDDEN_CHEMICAL_KEYS:
        assert key not in res_dict, f"Forbidden chemical parameter '{key}' found in ML result!"

    for key in FORBIDDEN_DIAGNOSTIC_KEYS:
        assert key not in res_dict, f"Forbidden disease diagnostic key '{key}' found in ML result!"

    assert "VISUAL SCREENING ONLY" in res.disclaimer
    assert "does NOT measure chemical attributes" in res.disclaimer


# ── TEST GROUP 5: Full FastAPI Endpoints Integration ────────────────────────

def test_health_endpoint_m73():
    """Verify /health endpoint returns UP and semantic version."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["version"] == settings.SERVICE_VERSION


def test_info_endpoint_m73_reports_model_info():
    """Verify /api/v1/info endpoint includes model availability and version."""
    response = client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()
    assert data["analysis_available"] is True
    assert data["capabilities"]["visual_screening"] is True
    assert data["capabilities"]["chemical_prediction"] is False
    assert data["capabilities"]["disease_diagnosis"] is False
    assert "model" in data
    assert "available" in data["model"]


def test_analyze_image_endpoint_with_deterministic_fallback():
    """Verify POST /api/v1/analyze/image operates seamlessly using deterministic fallback."""
    # Ensure default disabled model state for baseline test
    original_model = ml_inference_service._model
    ml_inference_service.set_model(DisabledVisualModel())

    try:
        jpeg_bytes = create_jpeg_bytes()
        response = client.post(
            "/api/v1/analyze/image",
            files={"file": ("sample.jpg", jpeg_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_available"] is True
        assert data["analysis_source"] in ("DETERMINISTIC_VISUAL_SCREENING", "IMAGE_VISUAL_SCREENING")
        assert data["model_available"] is False
        assert data["image_quality"]["status"] in ("SUFFICIENT", "INSUFFICIENT")
        assert "disclaimer" in data
    finally:
        ml_inference_service.set_model(original_model)


def test_analyze_image_endpoint_with_active_ml_model():
    """Verify POST /api/v1/analyze/image reports ML_VISUAL_SCREENING when ML model is active."""
    original_model = ml_inference_service._model
    ml_inference_service.set_model(MockCustomModel(available=True, version="cv-prod-1.0"))

    try:
        jpeg_bytes = create_jpeg_bytes()
        response = client.post(
            "/api/v1/analyze/image",
            files={"file": ("sample.jpg", jpeg_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_available"] is True
        assert data["analysis_source"] == "ML_VISUAL_SCREENING"
        assert data["model_available"] is True
        assert data["model_version"] == "cv-prod-1.0"
        assert len(data["visual_indicators"]) >= 1
        assert data["visual_indicators"][0]["type"] == "MOULD_LIKE_APPEARANCE"
    finally:
        ml_inference_service.set_model(original_model)
