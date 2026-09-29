"""
Tests for health and service info endpoints (M7.2).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns 200 with UP status without requiring auth."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == settings.SERVICE_NAME
    assert data["version"] in ("0.2.0", "0.3.0")


def test_service_info_endpoint():
    """Verify GET /api/v1/info returns metadata with visual_screening=True, analysis_available=True."""
    response = client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == settings.SERVICE_TITLE
    assert data["version"] in ("0.2.0", "0.3.0")
    assert data["analysis_available"] is True

    caps = data["capabilities"]
    assert caps["image_validation"] is True
    assert caps["image_preprocessing"] is True
    assert caps["image_quality_assessment"] is True
    assert caps["visual_screening"] is True
    # Scientific boundaries: chemical predictions and disease diagnosis MUST be False
    assert caps["chemical_prediction"] is False
    assert caps["disease_diagnosis"] is False


def test_health_no_auth_required():
    """Ensure no Authorization headers are required for health checks."""
    response = client.get("/health", headers={})
    assert response.status_code == 200
