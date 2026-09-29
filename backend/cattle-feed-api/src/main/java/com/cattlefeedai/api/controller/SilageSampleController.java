package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.SilageSampleRequest;
import com.cattlefeedai.api.dto.SilageSampleResponse;
import com.cattlefeedai.api.dto.TestResultResponse;
import com.cattlefeedai.api.service.SilageSampleService;
import com.cattlefeedai.api.service.TestResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for SilageSample endpoints.
 */
@RestController
@RequestMapping("/api/silage-samples")
@Tag(name = "5. Silage Samples", description = "Silage sample registration, crop types, and fermentation test history")
public class SilageSampleController {

    private final SilageSampleService silageSampleService;
    private final TestResultService testResultService;

    public SilageSampleController(
            SilageSampleService silageSampleService,
            TestResultService testResultService
    ) {
        this.silageSampleService = silageSampleService;
        this.testResultService = testResultService;
    }

    /**
     * POST /api/silage-samples - Create a new silage sample.
     */
    @Operation(summary = "Create silage sample", description = "Registers a new silage batch (e.g. maize, sorghum) under a farm.")
    @PostMapping
    public ResponseEntity<SilageSampleResponse> createSilageSample(@Valid @RequestBody SilageSampleRequest request) {
        SilageSampleResponse response = silageSampleService.createSilageSample(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/silage-samples - Get all silage samples accessible to caller, optionally filtered.
     */
    @Operation(summary = "List silage samples", description = "Retrieves all silage samples belonging to the authenticated farmer, optionally filtered by farmId or animalId.")
    @GetMapping
    public ResponseEntity<List<SilageSampleResponse>> getAllSilageSamples(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long animalId
    ) {
        List<SilageSampleResponse> responses = silageSampleService.getAllSilageSamples(farmId, animalId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/silage-samples/{id} - Get silage sample details by ID.
     */
    @Operation(summary = "Get silage sample by ID", description = "Retrieves silage sample details and crop type by ID.")
    @GetMapping("/{id}")
    public ResponseEntity<SilageSampleResponse> getSilageSampleById(@PathVariable Long id) {
        SilageSampleResponse response = silageSampleService.getSilageSampleById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/silage-samples/{id} - Update an existing silage sample.
     */
    @Operation(summary = "Update silage sample", description = "Updates silage sample parameters (crop type, source, notes).")
    @PutMapping("/{id}")
    public ResponseEntity<SilageSampleResponse> updateSilageSample(
            @PathVariable Long id,
            @Valid @RequestBody SilageSampleRequest request
    ) {
        SilageSampleResponse response = silageSampleService.updateSilageSample(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/silage-samples/{id} - Delete a silage sample and its test results.
     */
    @Operation(summary = "Delete silage sample", description = "Deletes a silage sample and cascades deletion of its associated test results.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSilageSample(@PathVariable Long id) {
        silageSampleService.deleteSilageSample(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/silage-samples/{sampleId}/test-results - Get historical test results for a silage sample.
     */
    @Operation(summary = "Get silage sample test history", description = "Retrieves chronological list of all test results recorded for this silage sample.")
    @GetMapping("/{sampleId}/test-results")
    public ResponseEntity<List<TestResultResponse>> getTestResultsBySilageSampleId(@PathVariable Long sampleId) {
        List<TestResultResponse> responses = testResultService.getTestResultsBySilageSampleId(sampleId);
        return ResponseEntity.ok(responses);
    }
}
