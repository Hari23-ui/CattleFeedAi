package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.ai.AiHealthResponse;
import com.cattlefeedai.api.dto.ai.AiServiceInfoResponse;
import com.cattlefeedai.api.dto.ai.ImageQualityDto;
import com.cattlefeedai.api.dto.ai.OverallScreeningDto;
import com.cattlefeedai.api.dto.ai.VisualAnalysisResponse;
import com.cattlefeedai.api.dto.ai.VisualIndicatorDto;
import com.cattlefeedai.api.exception.AiServiceException;
import com.cattlefeedai.api.service.ai.AiServiceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceClientUnitTest {

    @Mock
    private RestOperations restOperations;

    private AiServiceClient aiServiceClient;

    private static final String BASE_URL = "http://localhost:8000";

    @BeforeEach
    void setUp() {
        aiServiceClient = new AiServiceClient(BASE_URL, restOperations);
    }

    @Test
    @DisplayName("Health Check: Returns UP and available=true when FastAPI responds 200 UP")
    void testCheckHealth_Success_ReturnsUp() {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("status", "UP");
        mockResponse.put("service", "cattlefeedai-ai-service");
        mockResponse.put("version", "0.2.0");

        when(restOperations.getForObject(eq(BASE_URL + "/health"), eq(Map.class)))
                .thenReturn(mockResponse);

        AiHealthResponse health = aiServiceClient.checkHealth();

        assertNotNull(health);
        assertTrue(health.isAvailable());
        assertEquals("UP", health.getStatus());
        assertEquals("cattlefeedai-ai-service", health.getService());
        assertEquals("0.2.0", health.getVersion());
    }

    @Test
    @DisplayName("Health Check: Handles offline service gracefully without crashing or leaking stack traces")
    void testCheckHealth_Unreachable_HandlesSafely() {
        when(restOperations.getForObject(eq(BASE_URL + "/health"), eq(Map.class)))
                .thenThrow(new ResourceAccessException("Connection refused: connect"));

        AiHealthResponse health = aiServiceClient.checkHealth();

        assertNotNull(health);
        assertFalse(health.isAvailable());
        assertEquals("UNAVAILABLE", health.getStatus());
        assertTrue(health.getMessage().contains("offline or unreachable"));
    }

    @Test
    @DisplayName("Health Check: Handles degraded or unexpected status gracefully")
    void testCheckHealth_Degraded_HandlesSafely() {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("status", "DOWN");

        when(restOperations.getForObject(eq(BASE_URL + "/health"), eq(Map.class)))
                .thenReturn(mockResponse);

        AiHealthResponse health = aiServiceClient.checkHealth();

        assertNotNull(health);
        assertFalse(health.isAvailable());
        assertEquals("DEGRADED", health.getStatus());
    }

    @Test
    @DisplayName("Service Info: Parses capabilities and analysis_available=true correctly in M7.2")
    void testGetServiceInfo_Success() {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("service", "CattleFeedAI AI Service");
        mockResponse.put("version", "0.2.0");
        mockResponse.put("capabilities", Map.of("visual_screening", true, "ml_visual_screening", true, "chemical_prediction", false));
        mockResponse.put("model", Map.of("available", true, "version", "visual-classifier-1.0"));
        mockResponse.put("analysis_available", true);

        when(restOperations.getForObject(eq(BASE_URL + "/api/v1/info"), eq(Map.class)))
                .thenReturn(mockResponse);

        AiServiceInfoResponse info = aiServiceClient.getServiceInfo();

        assertNotNull(info);
        assertTrue(info.isReachable());
        assertEquals("CattleFeedAI AI Service", info.getService());
        assertTrue(info.getAnalysisAvailable());
        assertNotNull(info.getCapabilities());
        assertNotNull(info.getModel());
    }

    @Test
    @DisplayName("Service Info: Handles offline service safely with fallback response")
    void testGetServiceInfo_OfflineFallback() {
        when(restOperations.getForObject(eq(BASE_URL + "/api/v1/info"), eq(Map.class)))
                .thenThrow(new RestClientException("I/O error"));

        AiServiceInfoResponse info = aiServiceClient.getServiceInfo();

        assertNotNull(info);
        assertFalse(info.isReachable());
        assertFalse(info.getAnalysisAvailable());
        assertTrue(info.getMessage().contains("offline or unreachable"));
    }

    @Test
    @DisplayName("Analyze Image: Successfully forwards image bytes and deserializes VisualAnalysisResponse")
    void testAnalyzeImage_Success() {
        VisualAnalysisResponse mockAnalysis = VisualAnalysisResponse.builder()
                .analysisAvailable(true)
                .analysisSource("ML_VISUAL_SCREENING")
                .modelAvailable(true)
                .modelVersion("visual-classifier-1.0")
                .imageQuality(ImageQualityDto.builder().status("SUFFICIENT").issues(List.of()).build())
                .visualIndicators(List.of(
                        VisualIndicatorDto.builder()
                                .type("MOULD_LIKE_APPEARANCE")
                                .label("Possible mould-like growth")
                                .confidence(new BigDecimal("0.78"))
                                .severity("MEDIUM")
                                .evidence("Surface patch detected.")
                                .build()
                ))
                .overallScreening(OverallScreeningDto.builder()
                        .status("POSSIBLE_CONCERN")
                        .summary("Indicators present.")
                        .build())
                .disclaimer("VISUAL SCREENING ONLY")
                .build();

        when(restOperations.postForObject(eq(BASE_URL + "/api/v1/analyze/image"), any(HttpEntity.class), eq(VisualAnalysisResponse.class)))
                .thenReturn(mockAnalysis);

        byte[] fakeBytes = "fake-jpeg-binary-stream".getBytes();
        VisualAnalysisResponse result = aiServiceClient.analyzeImage(fakeBytes, "sample.jpg", "image/jpeg");

        assertNotNull(result);
        assertTrue(result.getAnalysisAvailable());
        assertEquals("ML_VISUAL_SCREENING", result.getAnalysisSource());
        assertTrue(result.getModelAvailable());
        assertEquals("visual-classifier-1.0", result.getModelVersion());
        assertEquals("SUFFICIENT", result.getImageQuality().getStatus());
        assertEquals(1, result.getVisualIndicators().size());
        assertEquals("MOULD_LIKE_APPEARANCE", result.getVisualIndicators().get(0).getType());
        assertEquals("POSSIBLE_CONCERN", result.getOverallScreening().getStatus());
    }

    @Test
    @DisplayName("Analyze Image: Throws AiServiceException when AI service is offline")
    void testAnalyzeImage_ServiceOffline_ThrowsAiServiceException() {
        when(restOperations.postForObject(eq(BASE_URL + "/api/v1/analyze/image"), any(HttpEntity.class), eq(VisualAnalysisResponse.class)))
                .thenThrow(new ResourceAccessException("Connection refused: connect"));

        byte[] fakeBytes = "fake-jpeg-binary-stream".getBytes();
        AiServiceException ex = assertThrows(AiServiceException.class, () ->
                aiServiceClient.analyzeImage(fakeBytes, "sample.jpg", "image/jpeg"));

        assertEquals(503, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("offline or failed"));
    }

    @Test
    @DisplayName("Convenience isAiServiceAvailable returns boolean based on health")
    void testIsAiServiceAvailable() {
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("status", "UP");

        when(restOperations.getForObject(anyString(), eq(Map.class)))
                .thenReturn(mockResponse);

        assertTrue(aiServiceClient.isAiServiceAvailable());
    }
}
