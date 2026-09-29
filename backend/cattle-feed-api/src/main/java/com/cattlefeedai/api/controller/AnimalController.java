package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.AnimalRequest;
import com.cattlefeedai.api.dto.AnimalResponse;
import com.cattlefeedai.api.service.AnimalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Animal management endpoints.
 */
@RestController
@RequestMapping("/api/animals")
@Tag(name = "3. Animal Management", description = "Livestock profiles, lactation stages, and individual health parameters")
public class AnimalController {

    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    /**
     * POST /api/animals - Create a new animal under a farm.
     */
    @Operation(summary = "Register animal", description = "Registers an individual animal with tag, lactation stage, and milk yield under a farm.")
    @PostMapping
    public ResponseEntity<AnimalResponse> createAnimal(@Valid @RequestBody AnimalRequest request) {
        AnimalResponse response = animalService.createAnimal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/animals - Get all animals accessible to the authenticated user.
     * Optionally filtered by farmId.
     */
    @Operation(summary = "List animals", description = "Retrieves all animals belonging to the authenticated farmer, optionally filtered by farmId.")
    @GetMapping
    public ResponseEntity<List<AnimalResponse>> getAllAnimals(
            @RequestParam(required = false) Long farmId
    ) {
        List<AnimalResponse> responses = animalService.getAllAnimals(farmId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/animals/{id} - Get animal details by ID.
     */
    @Operation(summary = "Get animal by ID", description = "Retrieves an animal profile by ID with ownership enforcement.")
    @GetMapping("/{id}")
    public ResponseEntity<AnimalResponse> getAnimalById(@PathVariable Long id) {
        AnimalResponse response = animalService.getAnimalById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/animals/{id} - Update an existing animal.
     */
    @Operation(summary = "Update animal", description = "Updates animal profile details (weight, days in milk, lactation stage).")
    @PutMapping("/{id}")
    public ResponseEntity<AnimalResponse> updateAnimal(
            @PathVariable Long id,
            @Valid @RequestBody AnimalRequest request
    ) {
        AnimalResponse response = animalService.updateAnimal(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/animals/{id} - Delete an existing animal.
     */
    @Operation(summary = "Delete animal", description = "Deletes an animal profile along with associated logs.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnimal(@PathVariable Long id) {
        animalService.deleteAnimal(id);
        return ResponseEntity.noContent().build();
    }
}
