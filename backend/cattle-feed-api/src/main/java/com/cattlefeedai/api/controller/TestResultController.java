package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.TestResultRequest;
import com.cattlefeedai.api.dto.TestResultResponse;
import com.cattlefeedai.api.service.TestResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for TestResult endpoints.
 */
@RestController
@RequestMapping("/api/test-results")
@Tag(name = "6. Test Results", description = "Physical, chemical, and sensory test records & historical tracking")
public class TestResultController {

    private final TestResultService testResultService;

    public TestResultController(TestResultService testResultService) {
        this.testResultService = testResultService;
    }

    /**
     * POST /api/test-results - Record a new test result.
     * Always appends a new record to maintain full testing history.
     */
    @Operation(summary = "Record test result", description = "Records a new physical/chemical/sensory test measurement for a feed or silage sample.")
    @PostMapping
    public ResponseEntity<TestResultResponse> createTestResult(@Valid @RequestBody TestResultRequest request) {
        TestResultResponse response = testResultService.createTestResult(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/test-results/{id} - Get a specific test result by ID.
     */
    @Operation(summary = "Get test result by ID", description = "Retrieves recorded test measurements and analysis source by test ID.")
    @GetMapping("/{id}")
    public ResponseEntity<TestResultResponse> getTestResultById(@PathVariable Long id) {
        TestResultResponse response = testResultService.getTestResultById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/test-results/feed-sample/{sampleId} - Alias to get test results for a feed sample.
     */
    @Operation(summary = "Get feed sample tests (alias)", description = "Retrieves test results recorded for a feed sample.")
    @GetMapping("/feed-sample/{sampleId}")
    public ResponseEntity<List<TestResultResponse>> getTestResultsByFeedSample(@PathVariable Long sampleId) {
        List<TestResultResponse> responses = testResultService.getTestResultsByFeedSampleId(sampleId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/test-results/silage-sample/{sampleId} - Alias to get test results for a silage sample.
     */
    @Operation(summary = "Get silage sample tests (alias)", description = "Retrieves test results recorded for a silage sample.")
    @GetMapping("/silage-sample/{sampleId}")
    public ResponseEntity<List<TestResultResponse>> getTestResultsBySilageSample(@PathVariable Long sampleId) {
        List<TestResultResponse> responses = testResultService.getTestResultsBySilageSampleId(sampleId);
        return ResponseEntity.ok(responses);
    }
}
