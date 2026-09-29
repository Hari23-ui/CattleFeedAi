"""
Image quality assessment for CattleFeedAI AI Service.
Performs deterministic visual quality screening (resolution, exposure, and contrast)
prior to computer vision inspection.

NOTE: All thresholds in this module are engineering quality checks designed to
prevent garbage-in / garbage-out analysis on blurred, dark, or blank images.
They are NOT agricultural or chemical standards.
"""

import math
from typing import List, Dict, Any, Tuple
from PIL import Image, ImageStat


class QualityMetrics:
    """Quantitative metrics extracted from an RGB image."""

    def __init__(self, width: int, height: int, mean_luminance: float, contrast_std: float):
        self.width = width
        self.height = height
        self.mean_luminance = round(mean_luminance, 2)
        self.contrast_std = round(contrast_std, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "width": self.width,
            "height": self.height,
            "mean_luminance": self.mean_luminance,
            "contrast_std": self.contrast_std,
        }


class ImageQualityResult:
    """Structured result of image quality inspection."""

    def __init__(
        self,
        status: str,  # SUFFICIENT, INSUFFICIENT, UNUSABLE
        issues: List[str],
        metrics: QualityMetrics,
    ):
        self.status = status
        self.issues = issues
        self.metrics = metrics

    @property
    def is_usable_for_analysis(self) -> bool:
        return self.status in ("SUFFICIENT", "INSUFFICIENT")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "issues": self.issues,
            "metrics": self.metrics.to_dict(),
        }


# Engineering Quality Thresholds
THRESHOLD_UNUSABLE_DIMENSION = 64
THRESHOLD_INSUFFICIENT_DIMENSION = 200

THRESHOLD_UNUSABLE_DARK = 15.0
THRESHOLD_INSUFFICIENT_DARK = 35.0

THRESHOLD_UNUSABLE_BRIGHT = 245.0
THRESHOLD_INSUFFICIENT_BRIGHT = 230.0

THRESHOLD_UNUSABLE_CONTRAST = 2.0
THRESHOLD_INSUFFICIENT_CONTRAST = 6.0


def assess_image_quality(image: Image.Image) -> ImageQualityResult:
    """
    Evaluate physical image quality metrics and determine whether image is SUFFICIENT,
    INSUFFICIENT, or UNUSABLE for visual analysis.

    Args:
        image: Preprocessed RGB PIL Image

    Returns:
        ImageQualityResult with status, list of issues, and quantitative metrics.
    """
    w, h = image.size
    issues: List[str] = []
    unusable = False

    # 1. Dimension Checks
    if w < THRESHOLD_UNUSABLE_DIMENSION or h < THRESHOLD_UNUSABLE_DIMENSION:
        issues.append(f"Image resolution ({w}x{h}) is too small to inspect surface characteristics.")
        unusable = True
    elif w < THRESHOLD_INSUFFICIENT_DIMENSION or h < THRESHOLD_INSUFFICIENT_DIMENSION:
        issues.append(f"Low image resolution ({w}x{h}) may reduce inspection reliability.")

    # 2. Luminance & Contrast via Grayscale conversion
    gray = image.convert("L")
    stat = ImageStat.Stat(gray)

    mean_lum = stat.mean[0] if stat.mean else 128.0
    contrast_std = stat.stddev[0] if stat.stddev else 50.0

    # Darkness / Underexposure Check
    if mean_lum < THRESHOLD_UNUSABLE_DARK:
        issues.append(f"Image is completely dark or underexposed (luminance: {mean_lum:.1f}/255).")
        unusable = True
    elif mean_lum < THRESHOLD_INSUFFICIENT_DARK:
        issues.append(f"Poor lighting or underexposed scene (luminance: {mean_lum:.1f}/255).")

    # Brightness / Overexposure Check
    if mean_lum > THRESHOLD_UNUSABLE_BRIGHT:
        issues.append(f"Image is severely overexposed or washed out (luminance: {mean_lum:.1f}/255).")
        unusable = True
    elif mean_lum > THRESHOLD_INSUFFICIENT_BRIGHT:
        issues.append(f"Excessive lighting or glare detected (luminance: {mean_lum:.1f}/255).")

    # Contrast / Information Sufficiency Check
    if contrast_std < THRESHOLD_UNUSABLE_CONTRAST:
        issues.append(f"Insufficient visual detail or uniform solid image (contrast std: {contrast_std:.1f}).")
        unusable = True
    elif contrast_std < THRESHOLD_INSUFFICIENT_CONTRAST:
        issues.append(f"Low visual contrast may obscure fine surface details (contrast std: {contrast_std:.1f}).")

    metrics = QualityMetrics(width=w, height=h, mean_luminance=mean_lum, contrast_std=contrast_std)

    if unusable:
        quality_status = "UNUSABLE"
    elif len(issues) > 0:
        quality_status = "INSUFFICIENT"
    else:
        quality_status = "SUFFICIENT"

    return ImageQualityResult(status=quality_status, issues=issues, metrics=metrics)
