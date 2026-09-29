"""
Unit tests for image preprocessing and image quality assessment (M7.2).
"""

import io
import pytest
from PIL import Image

from app.utils.image_preprocessing import preprocess_image_bytes, MAX_ANALYSIS_DIMENSION
from app.utils.image_quality import assess_image_quality
from app.utils.image_validation import ImageValidationError


def make_test_bytes(width: int, height: int, color="green", fmt="JPEG", mode="RGB") -> bytes:
    """Helper to generate in-memory image bytes."""
    img = Image.new(mode, (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


# ── Preprocessing Tests ───────────────────────────────────────────────────────

def test_preprocessing_converts_rgba_to_rgb():
    """Verify PNG with alpha channel is composited cleanly to RGB."""
    png_bytes = make_test_bytes(300, 300, color=(100, 200, 50, 128), fmt="PNG", mode="RGBA")
    result = preprocess_image_bytes(png_bytes, declared_content_type="image/png")

    assert result.image.mode == "RGB"
    assert result.original_width == 300
    assert result.original_height == 300
    assert result.normalized_width == 300
    assert not result.was_resized


def test_preprocessing_downscales_oversized_dimensions():
    """Verify large image (e.g. 2000x1500) is downscaled within MAX_ANALYSIS_DIMENSION preserving aspect ratio."""
    large_bytes = make_test_bytes(2000, 1500, color="green", fmt="JPEG")
    result = preprocess_image_bytes(large_bytes, declared_content_type="image/jpeg")

    assert result.was_resized is True
    assert result.original_width == 2000
    assert result.original_height == 1500
    assert result.normalized_width == MAX_ANALYSIS_DIMENSION
    assert result.normalized_height == int(1500 * (MAX_ANALYSIS_DIMENSION / 2000))
    assert result.image.size == (result.normalized_width, result.normalized_height)


def test_preprocessing_rejects_empty():
    """Verify empty byte payload is rejected during preprocessing."""
    with pytest.raises(ImageValidationError) as exc:
        preprocess_image_bytes(b"")
    assert exc.value.status_code == 400


# ── Quality Assessment Tests ──────────────────────────────────────────────────

def test_quality_sufficient_normal_image():
    """Verify normal balanced image with texture passes as SUFFICIENT."""
    # Create image with balanced gradient/texture
    img = Image.new("RGB", (400, 400))
    for x in range(400):
        for y in range(400):
            # Midtone green with natural variation
            img.putpixel((x, y), (60 + (x % 50), 120 + (y % 60), 40 + ((x + y) % 30)))

    quality = assess_image_quality(img)
    assert quality.status == "SUFFICIENT"
    assert len(quality.issues) == 0
    assert quality.is_usable_for_analysis is True
    assert 50 < quality.metrics.mean_luminance < 200
    assert quality.metrics.contrast_std > 6.0


def test_quality_rejects_tiny_unusable_image():
    """Verify image smaller than 64x64 is classified as UNUSABLE."""
    tiny_img = Image.new("RGB", (32, 32), color="green")
    quality = assess_image_quality(tiny_img)

    assert quality.status == "UNUSABLE"
    assert any("too small" in issue.lower() for issue in quality.issues)
    assert quality.is_usable_for_analysis is False


def test_quality_warns_low_resolution_image():
    """Verify image between 64x64 and 200x200 is classified as INSUFFICIENT."""
    small_img = Image.new("RGB", (150, 150))
    for x in range(150):
        for y in range(150):
            small_img.putpixel((x, y), (100 + (x % 30), 150 + (y % 30), 80))
    quality = assess_image_quality(small_img)

    assert quality.status == "INSUFFICIENT"
    assert any("low image resolution" in issue.lower() for issue in quality.issues)
    assert quality.is_usable_for_analysis is True


def test_quality_detects_extreme_darkness():
    """Verify pitch black / underexposed image (< 15 luminance) is UNUSABLE."""
    dark_img = Image.new("RGB", (300, 300), color=(5, 5, 5))
    quality = assess_image_quality(dark_img)

    assert quality.status == "UNUSABLE"
    assert any("dark" in issue.lower() or "underexposed" in issue.lower() for issue in quality.issues)


def test_quality_detects_extreme_overexposure():
    """Verify washed out / blindingly bright image (> 245 luminance) is UNUSABLE."""
    bright_img = Image.new("RGB", (300, 300), color=(252, 252, 252))
    quality = assess_image_quality(bright_img)

    assert quality.status == "UNUSABLE"
    assert any("overexposed" in issue.lower() for issue in quality.issues)


def test_quality_detects_blank_solid_image():
    """Verify uniform flat solid color has 0 contrast std and flags issue."""
    flat_img = Image.new("RGB", (300, 300), color=(128, 128, 128))
    quality = assess_image_quality(flat_img)

    # 0 stddev contrast
    assert quality.metrics.contrast_std == 0.0
    assert quality.status == "UNUSABLE"
    assert any("contrast" in issue.lower() or "solid" in issue.lower() for issue in quality.issues)
