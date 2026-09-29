"""
Integration tests for visual screening analysis endpoint (M7.2).
Verifies:
- 200 OK visual analysis execution.
- Deterministic detection of visual indicators (mould, spoilage, foreign material).
- Unusable image quality handling.
- Strict prohibition of fake chemical measurements and disease diagnosis.
"""

import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_sample_feed_image(width=400, height=400, pattern="normal") -> io.BytesIO:
    """Helper to generate simulated feed sample images with controlled surface patterns."""
    img = Image.new("RGB", (width, height))

    for x in range(width):
        for y in range(height):
            # Base green fodder / silage color
            r = 70 + (x % 30)
            g = 130 + (y % 40)
            b = 50 + ((x + y) % 20)

            if pattern == "mould":
                # Simulated chalky white/pale fungal patches in top right quadrant
                if x > width * 0.6 and y < height * 0.4:
                    r, g, b = 220, 225, 215

            elif pattern == "spoilage":
                # Simulated blackened decayed surface
                if y > height * 0.7:
                    r, g, b = 25, 20, 20

            elif pattern == "foreign_material":
                # Simulated bright blue plastic wrapper snippet
                if width * 0.4 < x < width * 0.6 and height * 0.4 < y < height * 0.5:
                    r, g, b = 20, 50, 240

            img.putpixel((x, y), (r, g, b))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def test_analyze_image_success_normal_sample():
    """Verify normal feed image produces NORMAL screening status with 200 OK."""
    img_buf = create_sample_feed_image(400, 400, pattern="normal")
    files = {"file": ("fresh_feed.jpg", img_buf, "image/jpeg")}

    response = client.post("/api/v1/analyze/image", files=files)
    assert response.status_code == 200

    data = response.json()
    assert data["analysis_available"] is True
    assert data["analysis_source"] in ("DETERMINISTIC_VISUAL_SCREENING", "IMAGE_VISUAL_SCREENING")

    # Quality check
    assert data["image_quality"]["status"] == "SUFFICIENT"

    # Overall screening
    assert data["overall_screening"]["status"] == "NORMAL"
    assert "No visible surface mould" in data["overall_screening"]["summary"]

    # Disclaimer verification
    assert "VISUAL SCREENING ONLY" in data["disclaimer"]
    assert "does NOT measure chemical attributes" in data["disclaimer"]


def test_analyze_image_detects_mould_indicator():
    """Verify sample with chalky white patches triggers MOULD_LIKE_APPEARANCE."""
    img_buf = create_sample_feed_image(400, 400, pattern="mould")
    files = {"file": ("mouldy_feed.jpg", img_buf, "image/jpeg")}

    response = client.post("/api/v1/analyze/image", files=files)
    assert response.status_code == 200

    data = response.json()
    indicators = data["visual_indicators"]
    types = [ind["type"] for ind in indicators]

    assert "MOULD_LIKE_APPEARANCE" in types
    mould_ind = next(ind for ind in indicators if ind["type"] == "MOULD_LIKE_APPEARANCE")
    assert mould_ind["severity"] in ("MEDIUM", "HIGH")
    assert mould_ind["confidence"] >= 0.65
    assert "mould" in mould_ind["label"].lower()
    assert data["overall_screening"]["status"] in ("POSSIBLE_CONCERN", "ABNORMAL")


def test_analyze_image_detects_spoilage_indicator():
    """Verify sample with blackened surface triggers SPOILAGE_LIKE_APPEARANCE."""
    img_buf = create_sample_feed_image(400, 400, pattern="spoilage")
    files = {"file": ("spoiled_silage.jpg", img_buf, "image/jpeg")}

    response = client.post("/api/v1/analyze/image", files=files)
    assert response.status_code == 200

    data = response.json()
    indicators = data["visual_indicators"]
    types = [ind["type"] for ind in indicators]

    assert "SPOILAGE_LIKE_APPEARANCE" in types
    spoil_ind = next(ind for ind in indicators if ind["type"] == "SPOILAGE_LIKE_APPEARANCE")
    assert spoil_ind["severity"] in ("MEDIUM", "HIGH")
    assert "spoilage" in spoil_ind["label"].lower()


def test_analyze_image_detects_foreign_material():
    """Verify sample with artificial synthetic color triggers FOREIGN_MATERIAL."""
    img_buf = create_sample_feed_image(400, 400, pattern="foreign_material")
    files = {"file": ("debris_sample.jpg", img_buf, "image/jpeg")}

    response = client.post("/api/v1/analyze/image", files=files)
    assert response.status_code == 200

    data = response.json()
    indicators = data["visual_indicators"]
    types = [ind["type"] for ind in indicators]

    assert "FOREIGN_MATERIAL" in types
    fm_ind = next(ind for ind in indicators if ind["type"] == "FOREIGN_MATERIAL")
    assert fm_ind["severity"] == "MEDIUM"


def test_analyze_image_unusable_dark_returns_insufficient_data():
    """Verify completely dark image returns UNUSABLE quality and INSUFFICIENT_DATA status."""
    dark_img = Image.new("RGB", (300, 300), color=(5, 5, 5))
    buf = io.BytesIO()
    dark_img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post("/api/v1/analyze/image", files={"file": ("dark.jpg", buf, "image/jpeg")})
    assert response.status_code == 200

    data = response.json()
    assert data["image_quality"]["status"] == "UNUSABLE"
    assert data["overall_screening"]["status"] == "INSUFFICIENT_DATA"
    assert "unusable" in data["overall_screening"]["summary"].lower()


def test_analyze_image_is_deterministic():
    """Verify that multiple analysis calls on the same image yield identical results."""
    buf1 = create_sample_feed_image(350, 350, pattern="mould")
    buf2 = io.BytesIO(buf1.getvalue())

    res1 = client.post("/api/v1/analyze/image", files={"file": ("test.jpg", buf1, "image/jpeg")}).json()
    res2 = client.post("/api/v1/analyze/image", files={"file": ("test.jpg", buf2, "image/jpeg")}).json()

    assert res1["overall_screening"]["status"] == res2["overall_screening"]["status"]
    assert len(res1["visual_indicators"]) == len(res2["visual_indicators"])
    for i in range(len(res1["visual_indicators"])):
        assert res1["visual_indicators"][i]["type"] == res2["visual_indicators"][i]["type"]
        assert res1["visual_indicators"][i]["confidence"] == res2["visual_indicators"][i]["confidence"]


def test_analyze_image_strictly_no_fake_predictions():
    """
    CRITICAL SCIENTIFIC SAFETY TEST:
    Ensure endpoint NEVER returns mock / fake predictions or chemical parameters.
    """
    img_buf = create_sample_feed_image(300, 300, pattern="mould")
    response = client.post("/api/v1/analyze/image", files={"file": ("sample.jpg", img_buf, "image/jpeg")})
    data = response.json()

    forbidden_keys = [
        "protein", "crude_protein", "moisture", "fiber", "ash",
        "aflatoxin", "ph", "dry_matter", "tdn", "nel",
        "disease", "diagnosis", "mould_percentage"
    ]

    for key in forbidden_keys:
        assert key not in data, f"Forbidden key '{key}' found in response root"


def test_analyze_image_missing_file_rejected():
    """Verify request without file returns 422 Unprocessable Entity."""
    response = client.post("/api/v1/analyze/image", data={})
    assert response.status_code == 422
    assert response.json()["error"] == "ValidationError"


def test_analyze_image_empty_file_rejected():
    """Verify empty image file returns 400 Bad Request."""
    empty_buf = io.BytesIO(b"")
    response = client.post("/api/v1/analyze/image", files={"file": ("empty.jpg", empty_buf, "image/jpeg")})
    assert response.status_code == 400
    assert response.json()["error"] == "ImageValidationError"


def test_analyze_image_corrupt_file_rejected():
    """Verify corrupt file data returns 400 Bad Request."""
    corrupt_buf = io.BytesIO(b"not-a-valid-image-stream-content")
    response = client.post("/api/v1/analyze/image", files={"file": ("corrupt.jpg", corrupt_buf, "image/jpeg")})
    assert response.status_code == 400
    assert response.json()["error"] == "ImageValidationError"


def test_analyze_image_unsupported_media_type_rejected():
    """Verify unsupported media type returns 415 Unsupported Media Type."""
    text_buf = io.BytesIO(b"Plain text file content")
    response = client.post("/api/v1/analyze/image", files={"file": ("notes.txt", text_buf, "text/plain")})
    assert response.status_code == 415
    assert response.json()["error"] == "ImageValidationError"
