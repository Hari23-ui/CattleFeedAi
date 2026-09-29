package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.FarmRequest;
import com.cattlefeedai.api.dto.FarmResponse;
import com.cattlefeedai.api.service.FarmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Farm management endpoints.
 */
@RestController
@RequestMapping("/api/farms")
@Tag(name = "2. Farm Management", description = "Farmer-owned dairy farm profiles and locations")
public class FarmController {

    private final FarmService farmService;

    public FarmController(FarmService farmService) {
        this.farmService = farmService;
    }

    /**
     * POST /api/farms - Create a new farm for the authenticated farmer.
     */
    @Operation(summary = "Create a farm", description = "Creates a new farm profile linked to the authenticated user.")
    @PostMapping
    public ResponseEntity<FarmResponse> createFarm(@Valid @RequestBody FarmRequest request) {
        FarmResponse response = farmService.createFarm(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/farms - Get all farms belonging to the authenticated farmer (or all farms if ADMIN).
     */
    @Operation(summary = "List user farms", description = "Returns all farms owned by the authenticated farmer, or all system farms for ADMIN.")
    @GetMapping
    public ResponseEntity<List<FarmResponse>> getAllFarms() {
        List<FarmResponse> responses = farmService.getAllFarms();
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/farms/{id} - Get farm details by ID.
     */
    @Operation(summary = "Get farm by ID", description = "Retrieves farm details by its unique identifier with ownership validation.")
    @GetMapping("/{id}")
    public ResponseEntity<FarmResponse> getFarmById(@PathVariable Long id) {
        FarmResponse response = farmService.getFarmById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/farms/{id} - Update an existing farm.
     */
    @Operation(summary = "Update a farm", description = "Updates farm metadata (name, animal counts, location) for an owned farm.")
    @PutMapping("/{id}")
    public ResponseEntity<FarmResponse> updateFarm(
            @PathVariable Long id,
            @Valid @RequestBody FarmRequest request
    ) {
        FarmResponse response = farmService.updateFarm(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/farms/{id} - Delete an existing farm.
     */
    @Operation(summary = "Delete a farm", description = "Deletes a farm profile along with cascading checks.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFarm(@PathVariable Long id) {
        farmService.deleteFarm(id);
        return ResponseEntity.noContent().build();
    }
}
