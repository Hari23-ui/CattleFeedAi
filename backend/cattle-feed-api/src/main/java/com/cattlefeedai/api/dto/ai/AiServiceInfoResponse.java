package com.cattlefeedai.api.dto.ai;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO representing capabilities and model readiness of the FastAPI AI Service.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiServiceInfoResponse {

    private String service;
    private String version;
    private Object capabilities;

    @JsonProperty("analysisAvailable")
    @JsonAlias({"analysis_available", "analysisAvailable"})
    private Boolean analysisAvailable;

    @JsonProperty("analysis_available")
    public Boolean getAnalysisAvailableSnake() {
        return analysisAvailable;
    }

    private boolean reachable;
    private Object model;
    private String message;
}

