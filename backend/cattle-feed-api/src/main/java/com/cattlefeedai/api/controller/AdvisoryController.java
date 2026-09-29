package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.service.assessment.AdvisoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for retrieving and managing generated advisories.
 */
@RestController
@RequestMapping("/api/advisories")
@Tag(name = "8. Advisories", description = "Rule-derived management recommendations and read/unread status")
public class AdvisoryController {

    private final AdvisoryService advisoryService;

    public AdvisoryController(AdvisoryService advisoryService) {
        this.advisoryService = advisoryService;
    }

    /**
     * GET /api/advisories
     * Retrieve advisories with optional filtering by animalId and isRead status.
     */
    @Operation(summary = "List advisories", description = "Retrieves generated advisories for the farmer's herd, optionally filtered by animalId and isRead status.")
    @GetMapping
    public ResponseEntity<List<AdvisoryResponse>> getAdvisories(
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Boolean isRead
    ) {
        List<AdvisoryResponse> advisories = advisoryService.getAdvisories(animalId, isRead);
        return ResponseEntity.ok(advisories);
    }

    /**
     * GET /api/advisories/{id}
     * Retrieve a specific advisory by ID.
     */
    @Operation(summary = "Get advisory by ID", description = "Retrieves a specific advisory message and recommended mitigation action by ID.")
    @GetMapping("/{id}")
    public ResponseEntity<AdvisoryResponse> getAdvisoryById(@PathVariable Long id) {
        AdvisoryResponse advisory = advisoryService.getAdvisoryById(id);
        return ResponseEntity.ok(advisory);
    }

    /**
     * PUT /api/advisories/{id}/read
     * Mark an advisory as read.
     */
    @Operation(summary = "Mark advisory as read", description = "Updates an advisory's status to read.")
    @PutMapping("/{id}/read")
    public ResponseEntity<AdvisoryResponse> markAsRead(@PathVariable Long id) {
        AdvisoryResponse response = advisoryService.markAsRead(id);
        return ResponseEntity.ok(response);
    }
}
