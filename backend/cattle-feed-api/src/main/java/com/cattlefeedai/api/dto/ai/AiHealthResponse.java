package com.cattlefeedai.api.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO representing health and availability status of the FastAPI AI Service.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiHealthResponse {

    private String status;
    private String service;
    private String version;
    private boolean available;
    private String message;
}
