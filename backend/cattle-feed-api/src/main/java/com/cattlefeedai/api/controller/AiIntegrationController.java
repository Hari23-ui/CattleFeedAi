package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.ai.AiHealthResponse;
import com.cattlefeedai.api.dto.ai.AiServiceInfoResponse;
import com.cattlefeedai.api.dto.ai.VisualAnalysisResponse;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.service.ai.AiServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Controller for inspecting FastAPI AI microservice connectivity, capabilities,
 * and performing visual screening analyses.
 */
@RestController
@RequestMapping("/api/ai")
@Tag(name = "8. AI Service Integration", description = "Python FastAPI AI microservice connectivity, visual screening, and capabilities")
public class AiIntegrationController {

    private final AiServiceClient aiServiceClient;

    public AiIntegrationController(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    @Operation(summary = "Probe AI service health", description = "Checks connectivity to the Python FastAPI microservice health endpoint.")
    @GetMapping("/health")
    public ResponseEntity<AiHealthResponse> getAiServiceHealth() {
        AiHealthResponse response = aiServiceClient.checkHealth();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get AI service info", description = "Retrieves capabilities and model readiness from the Python FastAPI AI microservice.")
    @GetMapping("/info")
    public ResponseEntity<AiServiceInfoResponse> getAiServiceInfo() {
        AiServiceInfoResponse response = aiServiceClient.getServiceInfo();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Analyze image directly via AI microservice", description = "Forwards an image to FastAPI for visual screening inspection.")
    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VisualAnalysisResponse> analyzeImageDirectly(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Image file cannot be empty");
        }
        try {
            VisualAnalysisResponse response = aiServiceClient.analyzeImage(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    file.getContentType()
            );
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded image bytes: " + e.getMessage(), e);
        }
    }
}
