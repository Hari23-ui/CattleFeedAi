package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.FeedSampleRequest;
import com.cattlefeedai.api.dto.FeedSampleResponse;
import com.cattlefeedai.api.dto.TestResultResponse;
import com.cattlefeedai.api.service.FeedSampleService;
import com.cattlefeedai.api.service.TestResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for FeedSample endpoints.
 */
@RestController
@RequestMapping("/api/feed-samples")
@Tag(name = "4. Feed Samples", description = "Feed sample registration, tracking, and test history")
public class FeedSampleController {

    private final FeedSampleService feedSampleService;
    private final TestResultService testResultService;

    public FeedSampleController(
            FeedSampleService feedSampleService,
            TestResultService testResultService
    ) {
        this.feedSampleService = feedSampleService;
        this.testResultService = testResultService;
    }

    /**
     * POST /api/feed-samples - Create a new feed sample.
     */
    @Operation(summary = "Create feed sample", description = "Registers a new feed sample with feed type and batch details under a farm.")
    @PostMapping
    public ResponseEntity<FeedSampleResponse> createFeedSample(@Valid @RequestBody FeedSampleRequest request) {
        FeedSampleResponse response = feedSampleService.createFeedSample(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/feed-samples - Get all feed samples accessible to caller, optionally filtered.
     */
    @Operation(summary = "List feed samples", description = "Retrieves all feed samples belonging to the authenticated farmer, optionally filtered by farmId or animalId.")
    @GetMapping
    public ResponseEntity<List<FeedSampleResponse>> getAllFeedSamples(
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long animalId
    ) {
        List<FeedSampleResponse> responses = feedSampleService.getAllFeedSamples(farmId, animalId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/feed-samples/{id} - Get feed sample details by ID.
     */
    @Operation(summary = "Get feed sample by ID", description = "Retrieves feed sample metadata and association with farm and animal.")
    @GetMapping("/{id}")
    public ResponseEntity<FeedSampleResponse> getFeedSampleById(@PathVariable Long id) {
        FeedSampleResponse response = feedSampleService.getFeedSampleById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/feed-samples/{id} - Update an existing feed sample.
     */
    @Operation(summary = "Update feed sample", description = "Updates feed sample details (type, source, notes).")
    @PutMapping("/{id}")
    public ResponseEntity<FeedSampleResponse> updateFeedSample(
            @PathVariable Long id,
            @Valid @RequestBody FeedSampleRequest request
    ) {
        FeedSampleResponse response = feedSampleService.updateFeedSample(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/feed-samples/{id} - Delete a feed sample and its test results.
     */
    @Operation(summary = "Delete feed sample", description = "Deletes a feed sample and cascades deletion of its associated test results.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedSample(@PathVariable Long id) {
        feedSampleService.deleteFeedSample(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/feed-samples/{sampleId}/test-results - Get historical test results for a feed sample.
     */
    @Operation(summary = "Get feed sample test history", description = "Retrieves chronological list of all test results recorded for this feed sample.")
    @GetMapping("/{sampleId}/test-results")
    public ResponseEntity<List<TestResultResponse>> getTestResultsByFeedSampleId(@PathVariable Long sampleId) {
        List<TestResultResponse> responses = testResultService.getTestResultsByFeedSampleId(sampleId);
        return ResponseEntity.ok(responses);
    }
}
