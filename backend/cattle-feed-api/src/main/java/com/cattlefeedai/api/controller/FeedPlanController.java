package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.FeedPlanRequest;
import com.cattlefeedai.api.dto.FeedPlanResponse;
import com.cattlefeedai.api.service.FeedPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Feed Planning & Management (M11).
 *
 * Endpoints:
 * - POST /api/feed-plans - Create a new feed plan
 * - GET /api/feed-plans - List feed plans for current farmer
 * - GET /api/feed-plans/{id} - Get a specific feed plan by ID
 * - PUT /api/feed-plans/{id} - Update an existing feed plan
 * - DELETE /api/feed-plans/{id} - Delete a feed plan
 */
@RestController
@RequestMapping("/api/feed-plans")
@Tag(name = "11. Feed Planning", description = "Feed planning and management endpoints with decision-support context")
@RequiredArgsConstructor
public class FeedPlanController {

    private final FeedPlanService feedPlanService;

    /**
     * POST /api/feed-plans - Create a new feed plan.
     */
    @Operation(summary = "Create feed plan", description = "Creates a new feed plan for an animal owned by the authenticated farmer.")
    @PostMapping
    public ResponseEntity<FeedPlanResponse> createFeedPlan(@Valid @RequestBody FeedPlanRequest request) {
        FeedPlanResponse response = feedPlanService.createFeedPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/feed-plans - List all feed plans for current farmer.
     */
    @Operation(summary = "List feed plans", description = "Retrieves all feed plans belonging to the authenticated farmer.")
    @GetMapping
    public ResponseEntity<List<FeedPlanResponse>> getFeedPlans() {
        List<FeedPlanResponse> responses = feedPlanService.getFeedPlans();
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/feed-plans/{id} - Get feed plan by ID.
     */
    @Operation(summary = "Get feed plan by ID", description = "Retrieves feed plan details with related animal, feed, test result, and advisory context.")
    @GetMapping("/{id}")
    public ResponseEntity<FeedPlanResponse> getFeedPlanById(@PathVariable Long id) {
        FeedPlanResponse response = feedPlanService.getFeedPlanById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/feed-plans/{id} - Update an existing feed plan.
     */
    @Operation(summary = "Update feed plan", description = "Updates an existing feed plan owned by the authenticated farmer.")
    @PutMapping("/{id}")
    public ResponseEntity<FeedPlanResponse> updateFeedPlan(
            @PathVariable Long id,
            @Valid @RequestBody FeedPlanRequest request
    ) {
        FeedPlanResponse response = feedPlanService.updateFeedPlan(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/feed-plans/{id} - Delete a feed plan.
     */
    @Operation(summary = "Delete feed plan", description = "Deletes a feed plan owned by the authenticated farmer.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedPlan(@PathVariable Long id) {
        feedPlanService.deleteFeedPlan(id);
        return ResponseEntity.noContent().build();
    }
}
