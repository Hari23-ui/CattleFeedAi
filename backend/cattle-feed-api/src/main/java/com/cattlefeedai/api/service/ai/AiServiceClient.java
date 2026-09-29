package com.cattlefeedai.api.service.ai;

import com.cattlefeedai.api.dto.ai.AiHealthResponse;
import com.cattlefeedai.api.dto.ai.AiServiceInfoResponse;
import com.cattlefeedai.api.dto.ai.VisualAnalysisResponse;
import com.cattlefeedai.api.exception.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

/**
 * Client service for communicating with the Python FastAPI AI Microservice.
 * M7.2: Supports health checks, service capabilities discovery, and visual surface analysis.
 * Does NOT perform chemical estimation or disease diagnosis.
 */
@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final String baseUrl;
    private final RestOperations restOperations;

    @Autowired
    public AiServiceClient(
            @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl,
            @Value("${ai.service.timeout-ms:5000}") int timeoutMs
    ) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restOperations = new RestTemplate(factory);

        log.info("Initialized AiServiceClient with baseUrl={} (timeout={}ms)", this.baseUrl, timeoutMs);
    }

    /**
     * Constructor for unit testing with custom RestOperations mock.
     */
    public AiServiceClient(String baseUrl, RestOperations restOperations) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.restOperations = restOperations;
    }

    /**
     * Check if the FastAPI AI microservice is UP and healthy.
     */
    public AiHealthResponse checkHealth() {
        String url = baseUrl + "/health";
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restOperations.getForObject(url, Map.class);
            if (response != null && "UP".equalsIgnoreCase(String.valueOf(response.get("status")))) {
                return AiHealthResponse.builder()
                        .status("UP")
                        .service(String.valueOf(response.getOrDefault("service", "cattlefeedai-ai-service")))
                        .version(String.valueOf(response.getOrDefault("version", "0.2.0")))
                        .available(true)
                        .message("AI microservice is operational.")
                        .build();
            } else {
                return AiHealthResponse.builder()
                        .status("DEGRADED")
                        .service("cattlefeedai-ai-service")
                        .version("unknown")
                        .available(false)
                        .message("AI service returned non-UP status.")
                        .build();
            }
        } catch (RestClientException e) {
            log.warn("AI service health check failed at {}: {}", url, e.getMessage());
            return AiHealthResponse.builder()
                    .status("UNAVAILABLE")
                    .service("cattlefeedai-ai-service")
                    .version(null)
                    .available(false)
                    .message("AI microservice is offline or unreachable.")
                    .build();
        }
    }

    /**
     * Retrieve capabilities and model readiness from GET /api/v1/info.
     */
    @SuppressWarnings("unchecked")
    public AiServiceInfoResponse getServiceInfo() {
        String url = baseUrl + "/api/v1/info";
        try {
            Map<String, Object> response = restOperations.getForObject(url, Map.class);
            if (response != null) {
                return AiServiceInfoResponse.builder()
                        .service(String.valueOf(response.getOrDefault("service", "CattleFeedAI AI Service")))
                        .version(String.valueOf(response.getOrDefault("version", "0.2.0")))
                        .capabilities(response.get("capabilities"))
                        .model(response.get("model"))
                        .analysisAvailable(Boolean.TRUE.equals(response.get("analysis_available")))
                        .reachable(true)
                        .message("AI service info retrieved successfully.")
                        .build();
            }
        } catch (Exception e) {
            log.warn("AI service info check failed at {}: {}", url, e.getMessage());
        }

        return AiServiceInfoResponse.builder()
                .service("CattleFeedAI AI Service")
                .version(null)
                .capabilities(Collections.emptyMap())
                .analysisAvailable(false)
                .reachable(false)
                .message("AI microservice is offline or unreachable.")
                .build();
    }

    /**
     * Sends binary image bytes to FastAPI for visual screening analysis.
     *
     * @param imageBytes Binary image content
     * @param filename   Original filename
     * @param contentType MIME type
     * @return VisualAnalysisResponse containing visual indicators and physical quality
     */
    public VisualAnalysisResponse analyzeImage(byte[] imageBytes, String filename, String contentType) {
        String url = baseUrl + "/api/v1/analyze/image";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "sample.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            VisualAnalysisResponse response = restOperations.postForObject(url, requestEntity, VisualAnalysisResponse.class);
            if (response == null) {
                throw new AiServiceException("AI microservice returned an empty analysis payload.", 502);
            }
            return response;
        } catch (RestClientException e) {
            log.warn("AI service visual analysis request failed at {}: {}", url, e.getMessage());
            throw new AiServiceException("AI microservice is offline or failed to analyze the image: " + e.getMessage(), 503);
        }
    }

    /**
     * Convenience method to check if the AI microservice is currently available.
     */
    public boolean isAiServiceAvailable() {
        return checkHealth().isAvailable();
    }

    public String getBaseUrl() {
        return baseUrl;
    }
}
