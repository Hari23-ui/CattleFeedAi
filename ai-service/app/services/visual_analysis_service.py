"""
Visual Analysis Service for CattleFeedAI AI Service (M7.2).
Performs deterministic visual screening of feed and silage surface characteristics.

IMPORTANT SCIENTIFIC BOUNDARY:
- VISUAL SCREENING ONLY.
- ZERO chemical estimation (no protein, moisture, fiber, aflatoxin, etc.).
- ZERO disease diagnosis.
- All indicators represent physical surface observations with non-diagnostic terminology.
"""

import logging
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageStat

from app.utils.image_quality import ImageQualityResult

logger = logging.getLogger("cattlefeedai-ai-service.visual_analysis")

DISCLAIMER_TEXT = (
    "VISUAL SCREENING ONLY: Computer vision analysis identifies surface physical characteristics, "
    "mould discoloration, and visible foreign material. It does NOT measure chemical attributes "
    "like protein, moisture %, fiber, or aflatoxin, nor does it provide veterinary disease diagnosis."
)


class VisualIndicator:
    """Represents an identified surface visual observation."""

    def __init__(
        self,
        indicator_type: str,
        label: str,
        confidence: float,
        severity: str,  # LOW, MEDIUM, HIGH
        evidence: str,
    ):
        self.indicator_type = indicator_type
        self.label = label
        self.confidence = round(confidence, 2)
        self.severity = severity
        self.evidence = evidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.indicator_type,
            "label": self.label,
            "confidence": self.confidence,
            "severity": self.severity,
            "evidence": self.evidence,
        }


class OverallScreening:
    """Overall screening conclusion based on aggregated visual indicators."""

    def __init__(self, status: str, summary: str):
        self.status = status  # NORMAL, POSSIBLE_CONCERN, ABNORMAL, INSUFFICIENT_DATA
        self.summary = summary

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "summary": self.summary,
        }


class VisualAnalysisResult:
    """Complete result payload of visual inspection."""

    def __init__(
        self,
        image_quality: ImageQualityResult,
        visual_indicators: List[VisualIndicator],
        overall_screening: OverallScreening,
        analysis_source: str = "DETERMINISTIC_VISUAL_SCREENING",
        analysis_available: bool = True,
        model_available: bool = False,
        model_version: Optional[str] = None,
    ):
        self.analysis_source = analysis_source
        self.analysis_available = analysis_available
        self.model_available = model_available
        self.model_version = model_version
        self.image_quality = image_quality
        self.visual_indicators = visual_indicators
        self.overall_screening = overall_screening
        self.disclaimer = DISCLAIMER_TEXT

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_available": self.analysis_available,
            "analysis_source": self.analysis_source,
            "model_available": self.model_available,
            "model_version": self.model_version,
            "image_quality": self.image_quality.to_dict(),
            "visual_indicators": [vi.to_dict() for vi in self.visual_indicators],
            "overall_screening": self.overall_screening.to_dict(),
            "disclaimer": self.disclaimer,
        }


def analyze_visual_surface(
    image: Image.Image,
    quality_result: ImageQualityResult,
) -> VisualAnalysisResult:
    """
    Run deterministic visual screening heuristics across the preprocessed image.

    Heuristics:
    1. Mould-like growth detection:
       Surface whitish/grayish/pale-bluish high-contrast patches against the feed background.
    2. Spoilage/Discoloration detection:
       Excessive darkening / black decay areas indicating aerobic spoilage or heat damage.
    3. Foreign material detection:
       High-saturation artificial synthetic colors (plastics, packaging, non-feed debris).
    4. Image quality issues:
       Reflects lighting or resolution constraints flagged in the quality assessment.
    """
    # If the image was deemed UNUSABLE by the quality checker, do not attempt analysis
    if quality_result.status == "UNUSABLE":
        return VisualAnalysisResult(
            image_quality=quality_result,
            visual_indicators=[],
            overall_screening=OverallScreening(
                status="INSUFFICIENT_DATA",
                summary=(
                    "Image quality is unusable for reliable visual inspection. "
                    + " ".join(quality_result.issues)
                    + " Please recapture the sample with adequate focus and balanced lighting."
                ),
            ),
        )

    indicators: List[VisualIndicator] = []

    # Flag quality warning if image is INSUFFICIENT
    if quality_result.status == "INSUFFICIENT":
        indicators.append(
            VisualIndicator(
                indicator_type="IMAGE_QUALITY_ISSUE",
                label="Image quality warning",
                confidence=0.88,
                severity="LOW",
                evidence="; ".join(quality_result.issues),
            )
        )

    # Perform pixel-level color distribution analysis on a downsampled thumbnail for speed & stability
    thumb = image.copy()
    thumb.thumbnail((256, 256), Image.Resampling.BOX)
    pixels = list(thumb.getdata())
    total_pixels = len(pixels)

    if total_pixels == 0:
        return VisualAnalysisResult(
            image_quality=quality_result,
            visual_indicators=indicators,
            overall_screening=OverallScreening(
                status="INSUFFICIENT_DATA",
                summary="Unable to sample pixel data from image.",
            ),
        )

    mould_pixels = 0
    spoilage_pixels = 0
    foreign_material_pixels = 0

    # Color threshold heuristics:
    for r, g, b in pixels:
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        diff = max_c - min_c

        # 1. Mould-like Appearance:
        # Whitish/grayish or pale chalky clusters (high luminance, low-to-medium saturation)
        if r > 185 and g > 185 and b > 180 and diff < 35:
            mould_pixels += 1

        # 2. Spoilage / Severe Darkening:
        # Very dark / blackened necrotic regions (luminance < 45)
        elif r < 45 and g < 45 and b < 45:
            spoilage_pixels += 1

        # 3. Foreign Material:
        # Vivid artificial colors (high saturation synthetic hues: e.g. bright blue/cyan, pure red/magenta)
        elif diff > 90 and (
            (b > 140 and b > r + 40 and b > g + 40) or  # bright blue plastic/wrapper
            (r > 160 and r > g + 70 and r > b + 70)     # bright red plastic/tag
        ):
            foreign_material_pixels += 1

    mould_ratio = mould_pixels / total_pixels
    spoilage_ratio = spoilage_pixels / total_pixels
    foreign_ratio = foreign_material_pixels / total_pixels

    logger.debug(
        "Visual ratios: mould=%.4f (%d px), spoilage=%.4f (%d px), foreign=%.4f (%d px)",
        mould_ratio, mould_pixels, spoilage_ratio, spoilage_pixels, foreign_ratio, foreign_material_pixels
    )

    # Evaluate Mould Indicator
    # Normal feed may have small pale flecks (< 1.5%). Significant clusters (> 3%) suggest mould.
    if mould_ratio >= 0.05:
        confidence = min(0.92, 0.72 + (mould_ratio * 2.0))
        indicators.append(
            VisualIndicator(
                indicator_type="MOULD_LIKE_APPEARANCE",
                label="Possible mould-like growth",
                confidence=confidence,
                severity="HIGH",
                evidence=(
                    f"Visible chalky or pale fungal-like surface patches detected across "
                    f"{mould_ratio * 100:.1f}% of the inspected surface area."
                ),
            )
        )
    elif mould_ratio >= 0.02:
        confidence = min(0.80, 0.65 + (mould_ratio * 3.0))
        indicators.append(
            VisualIndicator(
                indicator_type="MOULD_LIKE_APPEARANCE",
                label="Possible mould-like growth",
                confidence=confidence,
                severity="MEDIUM",
                evidence=(
                    f"Localized pale discolouration consistent with surface mould detected across "
                    f"{mould_ratio * 100:.1f}% of the image."
                ),
            )
        )

    # Evaluate Spoilage Indicator
    if spoilage_ratio >= 0.15:
        confidence = min(0.90, 0.70 + (spoilage_ratio * 1.0))
        indicators.append(
            VisualIndicator(
                indicator_type="SPOILAGE_LIKE_APPEARANCE",
                label="Apparent spoilage indicator",
                confidence=confidence,
                severity="HIGH",
                evidence=(
                    f"Severe dark/blackened surface discolouration detected across {spoilage_ratio * 100:.1f}% "
                    f"of the sample, consistent with organoleptic spoilage or heat damage."
                ),
            )
        )
    elif spoilage_ratio >= 0.05:
        confidence = min(0.78, 0.62 + (spoilage_ratio * 1.5))
        indicators.append(
            VisualIndicator(
                indicator_type="SPOILAGE_LIKE_APPEARANCE",
                label="Apparent spoilage indicator",
                confidence=confidence,
                severity="MEDIUM",
                evidence=(
                    f"Surface darkening or discolouration detected across {spoilage_ratio * 100:.1f}% of the sample."
                ),
            )
        )

    # Evaluate Foreign Material Indicator
    if foreign_ratio >= 0.005:  # >= 0.5% artificial outlier color
        confidence = min(0.85, 0.70 + (foreign_ratio * 10.0))
        indicators.append(
            VisualIndicator(
                indicator_type="FOREIGN_MATERIAL",
                label="Visible foreign material",
                confidence=confidence,
                severity="MEDIUM",
                evidence=(
                    f"Atypical high-saturation color anomalies detected across {foreign_ratio * 100:.2f}% "
                    f"of the sample, consistent with synthetic or non-feed debris."
                ),
            )
        )

    # Determine Overall Screening Conclusion
    has_high = any(ind.severity == "HIGH" for ind in indicators)
    has_med = any(ind.severity == "MEDIUM" for ind in indicators)
    has_low = any(ind.severity == "LOW" for ind in indicators)

    if has_high:
        overall_status = "ABNORMAL"
        overall_summary = (
            "Visual screening identified significant physical indicators (such as possible mould-like growth "
            "or severe spoilage discolouration) that warrant immediate closer examination."
        )
    elif has_med:
        overall_status = "POSSIBLE_CONCERN"
        overall_summary = (
            "Visual screening detected moderate surface discolouration or foreign anomalies that may warrant physical verification."
        )
    elif has_low:
        overall_status = "POSSIBLE_CONCERN"
        overall_summary = (
            "Minor visual indicators or image quality constraints were detected during inspection."
        )
    else:
        overall_status = "NORMAL"
        overall_summary = (
            "No visible surface mould, abnormal discolouration, or foreign material detected in the visual screening."
        )

    return VisualAnalysisResult(
        image_quality=quality_result,
        visual_indicators=indicators,
        overall_screening=OverallScreening(
            status=overall_status,
            summary=overall_summary,
        ),
    )
