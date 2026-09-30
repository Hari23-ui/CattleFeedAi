package com.cattlefeedai.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check controller for container orchestrators, cloud load balancers,
 * and deployment readiness probes.
 * Supports /health, /api/health, and /actuator/health without requiring heavy actuator dependencies.
 */
@RestController
@Tag(name = "0. System Health", description = "Deployment and orchestration health check probes")
public class HealthController {

    @Operation(
            summary = "Service Health Probe",
            description = "Returns operational status for cloud deployment health checks (Render, AWS, GCP, Docker, K8s)."
    )
    @GetMapping({"/health", "/api/health", "/actuator/health"})
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "cattle-feed-api");
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }
}
