"""
Image validation utilities for CattleFeedAI AI Service.
Validates file sizes, MIME types, image integrity, and supported visual formats.
"""

import io
from typing import List, Optional, Tuple
from PIL import Image, UnidentifiedImageError
from app.config import settings


class ImageValidationError(Exception):
    """Exception raised for image validation failures."""

    def __init__(self, status_code: int, message: str, detail: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.detail = detail


# Mapping between standard MIME types and Pillow format identifiers
SUPPORTED_FORMAT_MAPPING = {
    "image/jpeg": "JPEG",
    "image/jpg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}

REVERSE_FORMAT_MAPPING = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


def validate_image_file(
    content: bytes,
    declared_content_type: Optional[str] = None,
    max_size_bytes: Optional[int] = None,
    allowed_types: Optional[List[str]] = None,
) -> Tuple[int, int, str, str]:
    """
    Validate an image byte payload.

    Args:
        content: Raw image bytes
        declared_content_type: Content-Type header from request (if provided)
        max_size_bytes: Maximum allowed byte size (defaults to settings)
        allowed_types: List of allowed MIME types (defaults to settings)

    Returns:
        Tuple of (width, height, format_name, canonical_content_type)

    Raises:
        ImageValidationError: On any validation or decoding failure
    """
    max_bytes = max_size_bytes or settings.max_image_size_bytes
    allowed_mime = allowed_types or settings.ALLOWED_IMAGE_TYPES

    # 1. Check for empty payload
    if not content or len(content) == 0:
        raise ImageValidationError(
            status_code=400,
            message="Image file is empty",
            detail="File size is 0 bytes."
        )

    # 2. Check maximum size
    if len(content) > max_bytes:
        max_mb = max_bytes // (1024 * 1024)
        raise ImageValidationError(
            status_code=413,
            message=f"Image exceeds maximum allowed size of {max_mb} MB",
            detail=f"Uploaded size: {len(content)} bytes, limit: {max_bytes} bytes."
        )

    # 3. Check declared content type if provided
    if declared_content_type:
        clean_ct = declared_content_type.split(";")[0].strip().lower()
        if clean_ct not in [t.lower() for t in allowed_mime]:
            raise ImageValidationError(
                status_code=415,
                message=f"Unsupported media type: {declared_content_type}",
                detail=f"Allowed types: {', '.join(allowed_mime)}"
            )

    # 4. Decode with Pillow to verify format and integrity
    try:
        with Image.open(io.BytesIO(content)) as img:
            pil_format = img.format
            if not pil_format:
                raise ImageValidationError(
                    status_code=400,
                    message="Corrupted or invalid image data",
                    detail="Image format could not be determined."
                )

            # Check if Pillow-detected format is allowed
            normalized_format = pil_format.upper()
            if normalized_format not in REVERSE_FORMAT_MAPPING:
                raise ImageValidationError(
                    status_code=415,
                    message=f"Unsupported image format: {pil_format}",
                    detail="Supported formats are JPEG, PNG, and WEBP."
                )

            # Verify actual image data integrity by decoding pixels
            img.load()
            width, height = img.size

            if width <= 0 or height <= 0:
                raise ImageValidationError(
                    status_code=400,
                    message="Invalid image dimensions",
                    detail=f"Dimensions must be positive. Detected: {width}x{height}."
                )

            canonical_mime = REVERSE_FORMAT_MAPPING[normalized_format]
            return width, height, normalized_format, canonical_mime

    except (UnidentifiedImageError, OSError, SyntaxError) as e:
        raise ImageValidationError(
            status_code=400,
            message="Corrupted or invalid image data",
            detail="The file content could not be decoded as a valid image."
        ) from None
    except ImageValidationError:
        raise
    except Exception as e:
        raise ImageValidationError(
            status_code=400,
            message="Corrupted or invalid image data",
            detail="Image decoding failed."
        ) from None
