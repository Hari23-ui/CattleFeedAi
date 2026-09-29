package com.cattlefeedai.api.dto.ai;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * DTO representing visual screening response from FastAPI AI microservice.
 * Supports both snake_case and camelCase serialization/deserialization.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VisualAnalysisResponse {

    @JsonProperty("analysis_available")
    @JsonAlias({"analysisAvailable", "analysis_available"})
    private Boolean analysisAvailable;

    @JsonProperty("analysis_source")
    @JsonAlias({"analysisSource", "analysis_source"})
    private String analysisSource;

    @JsonProperty("image_metadata")
    @JsonAlias({"imageMetadata", "image_metadata"})
    private Map<String, Object> imageMetadata;

    @JsonProperty("image_quality")
    @JsonAlias({"imageQuality", "image_quality"})
    private ImageQualityDto imageQuality;

    @JsonProperty("visual_indicators")
    @JsonAlias({"visualIndicators", "visual_indicators"})
    private List<VisualIndicatorDto> visualIndicators;

    @JsonProperty("overall_screening")
    @JsonAlias({"overallScreening", "overall_screening"})
    private OverallScreeningDto overallScreening;

    @JsonProperty("model_available")
    @JsonAlias({"modelAvailable", "model_available"})
    private Boolean modelAvailable;

    @JsonProperty("model_version")
    @JsonAlias({"modelVersion", "model_version"})
    private String modelVersion;

    @JsonProperty("disclaimer")
    private String disclaimer;

    // CamelCase accessors for JSON serialization compatibility
    @JsonProperty("analysisAvailable")
    public Boolean getAnalysisAvailableCamel() {
        return analysisAvailable;
    }

    @JsonProperty("analysisSource")
    public String getAnalysisSourceCamel() {
        return analysisSource;
    }

    @JsonProperty("modelAvailable")
    public Boolean getModelAvailableCamel() {
        return modelAvailable;
    }

    @JsonProperty("modelVersion")
    public String getModelVersionCamel() {
        return modelVersion;
    }

    @JsonProperty("imageMetadata")
    public Map<String, Object> getImageMetadataCamel() {
        return imageMetadata;
    }

    @JsonProperty("imageQuality")
    public ImageQualityDto getImageQualityCamel() {
        return imageQuality;
    }

    @JsonProperty("visualIndicators")
    public List<VisualIndicatorDto> getVisualIndicatorsCamel() {
        return visualIndicators;
    }

    @JsonProperty("overallScreening")
    public OverallScreeningDto getOverallScreeningCamel() {
        return overallScreening;
    }
}

