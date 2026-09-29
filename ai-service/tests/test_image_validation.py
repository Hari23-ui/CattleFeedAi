"""
Unit tests for image validation and physical metadata extraction.
"""

import io
import pytest
from PIL import Image

from app.utils.image_validation import (
    validate_image_file,
    ImageValidationError,
)


def create_test_image(format_name: str, width: int = 100, height: int = 100, color: str = "green") -> bytes:
    """Helper to generate in-memory valid image bytes using Pillow."""
    image = Image.new("RGB", (width, height), color=color)
    buffer = io.BytesIO()
    image.save(buffer, format=format_name)
    return buffer.getvalue()


def test_validate_valid_jpeg():
    """Verify validation of a valid JPEG image."""
    jpeg_bytes = create_test_image("JPEG", width=320, height=240)
    width, height, fmt, mime = validate_image_file(jpeg_bytes, declared_content_type="image/jpeg")

    assert width == 320
    assert height == 240
    assert fmt == "JPEG"
    assert mime == "image/jpeg"


def test_validate_valid_png():
    """Verify validation of a valid PNG image."""
    png_bytes = create_test_image("PNG", width=640, height=480)
    width, height, fmt, mime = validate_image_file(png_bytes, declared_content_type="image/png")

    assert width == 640
    assert height == 480
    assert fmt == "PNG"
    assert mime == "image/png"


def test_validate_valid_webp():
    """Verify validation of a valid WebP image."""
    webp_bytes = create_test_image("WEBP", width=800, height=600)
    width, height, fmt, mime = validate_image_file(webp_bytes, declared_content_type="image/webp")

    assert width == 800
    assert height == 600
    assert fmt == "WEBP"
    assert mime == "image/webp"


def test_reject_empty_file():
    """Verify empty image payload is rejected with HTTP 400."""
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(b"", declared_content_type="image/jpeg")

    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.message.lower()


def test_reject_unsupported_mime_type():
    """Verify unsupported MIME types (e.g. text/plain, image/gif) are rejected with HTTP 415."""
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(b"some-bytes", declared_content_type="image/gif")

    assert exc_info.value.status_code == 415
    assert "unsupported" in exc_info.value.message.lower()


def test_reject_oversized_image():
    """Verify image exceeding max_size_bytes is rejected with HTTP 413."""
    small_limit = 1024  # 1 KB
    png_bytes = create_test_image("PNG", width=400, height=400)
    assert len(png_bytes) > small_limit

    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(png_bytes, declared_content_type="image/png", max_size_bytes=small_limit)

    assert exc_info.value.status_code == 413
    assert "exceeds" in exc_info.value.message.lower()


def test_reject_corrupt_image():
    """Verify corrupted / non-image bytes are rejected with HTTP 400."""
    corrupt_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00corrupt-bytes-payload"
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_file(corrupt_bytes, declared_content_type="image/jpeg")

    assert exc_info.value.status_code == 400
    assert "corrupted or invalid" in exc_info.value.message.lower()


def test_reject_unsupported_image_format_in_payload():
    """Verify image file with valid Pillow format but not allowed (e.g. BMP) is rejected with 415."""
    bmp_bytes = create_test_image("BMP", width=50, height=50)
    with pytest.raises(ImageValidationError) as exc_info:
        # Pass no declared MIME or allowed MIME, payload format will be BMP
        validate_image_file(bmp_bytes, declared_content_type=None)

    assert exc_info.value.status_code == 415
    assert "unsupported image format" in exc_info.value.message.lower()


def test_metadata_extraction_integrity():
    """Verify that dimensions and format are extracted accurately without alterations."""
    jpeg_bytes = create_test_image("JPEG", width=1920, height=1080)
    width, height, fmt, mime = validate_image_file(jpeg_bytes)

    assert width == 1920
    assert height == 1080
    assert fmt == "JPEG"
    assert mime == "image/jpeg"
