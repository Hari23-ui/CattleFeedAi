"""
Image preprocessing utilities for CattleFeedAI AI Service.
Ensures safe image loading, decompression-bomb defense, color space normalization,
and dimension standardization for visual analysis.
"""

import io
import logging
from typing import Tuple, Dict, Any
from PIL import Image

from app.utils.image_validation import ImageValidationError, validate_image_file

logger = logging.getLogger("cattlefeedai-ai-service.preprocessing")

# Decompression bomb defense: limit maximum allowable pixel count
# 25 Megapixels (e.g. ~5000x5000) prevents denial-of-service memory exhaustion
MAX_IMAGE_PIXELS = 25_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

# Standard target analysis bounds (preserves aspect ratio)
MAX_ANALYSIS_DIMENSION = 1024
MIN_ANALYSIS_DIMENSION = 64


class PreprocessingResult:
    """Encapsulates the preprocessed PIL Image and physical metadata."""

    def __init__(
        self,
        image: Image.Image,
        original_width: int,
        original_height: int,
        normalized_width: int,
        normalized_height: int,
        format_name: str,
        content_type: str,
        original_size_bytes: int,
        was_resized: bool,
    ):
        self.image = image
        self.original_width = original_width
        self.original_height = original_height
        self.normalized_width = normalized_width
        self.normalized_height = normalized_height
        self.format_name = format_name
        self.content_type = content_type
        self.original_size_bytes = original_size_bytes
        self.was_resized = was_resized

    def to_metadata_dict(self) -> Dict[str, Any]:
        return {
            "original_width": self.original_width,
            "original_height": self.original_height,
            "normalized_width": self.normalized_width,
            "normalized_height": self.normalized_height,
            "format": self.format_name,
            "content_type": self.content_type,
            "size_bytes": self.original_size_bytes,
            "was_resized": self.was_resized,
            "preprocessing_status": "COMPLETED",
        }


def preprocess_image_bytes(
    content: bytes,
    declared_content_type: str | None = None,
    max_dimension: int = MAX_ANALYSIS_DIMENSION,
) -> PreprocessingResult:
    """
    Safely preprocess raw image bytes into an RGB PIL Image ready for visual inspection.

    Steps:
    1. Byte-level format and size validation.
    2. Decompression bomb check.
    3. Decode image and normalize color space to RGB (compositing alpha onto white).
    4. Normalize dimensions (downscale if exceeding max_dimension, retaining aspect ratio).
    5. Return PreprocessingResult containing both original metadata and standardized image.
    """
    # 1. Validate basic constraints (0 bytes, max 10MB, format verification)
    orig_w, orig_h, format_name, canonical_mime = validate_image_file(
        content=content,
        declared_content_type=declared_content_type,
    )

    # 2. Decompression bomb guard
    pixel_count = orig_w * orig_h
    if pixel_count > MAX_IMAGE_PIXELS:
        raise ImageValidationError(
            status_code=413,
            message="Image resolution is too large",
            detail=f"Image contains {pixel_count} pixels, exceeding safety threshold of {MAX_IMAGE_PIXELS}.",
        )

    # 3. Decode image into memory
    try:
        raw_img = Image.open(io.BytesIO(content))

        # Color mode normalization: Ensure standard 3-channel RGB
        if raw_img.mode in ("RGBA", "LA") or (raw_img.mode == "P" and "transparency" in raw_img.info):
            # Alpha composite onto white background so transparent regions don't turn black
            rgba_img = raw_img.convert("RGBA")
            bg = Image.new("RGBA", rgba_img.size, (255, 255, 255, 255))
            blended = Image.alpha_composite(bg, rgba_img)
            rgb_img = blended.convert("RGB")
        else:
            rgb_img = raw_img.convert("RGB")

    except ImageValidationError:
        raise
    except Exception as e:
        logger.warning("Failed to decode image during preprocessing: %s", str(e))
        raise ImageValidationError(
            status_code=400,
            message="Corrupted or invalid image data",
            detail="Pillow could not decode the image stream.",
        ) from None

    # 4. Dimension normalization (resize only if oversized, maintaining aspect ratio)
    cur_w, cur_h = rgb_img.size
    was_resized = False

    if max(cur_w, cur_h) > max_dimension:
        ratio = max_dimension / float(max(cur_w, cur_h))
        new_w = max(1, int(cur_w * ratio))
        new_h = max(1, int(cur_h * ratio))
        rgb_img = rgb_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        was_resized = True
        logger.debug("Normalized image dimensions from %dx%d to %dx%d", cur_w, cur_h, new_w, new_h)

    norm_w, norm_h = rgb_img.size

    return PreprocessingResult(
        image=rgb_img,
        original_width=orig_w,
        original_height=orig_h,
        normalized_width=norm_w,
        normalized_height=norm_h,
        format_name=format_name,
        content_type=canonical_mime,
        original_size_bytes=len(content),
        was_resized=was_resized,
    )
