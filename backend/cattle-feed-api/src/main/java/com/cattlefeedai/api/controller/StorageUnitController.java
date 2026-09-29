package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.SensorReadingRequest;
import com.cattlefeedai.api.dto.SensorReadingResponse;
import com.cattlefeedai.api.dto.StorageMonitoringSummaryDto;
import com.cattlefeedai.api.dto.StorageUnitRequest;
import com.cattlefeedai.api.dto.StorageUnitResponse;
import com.cattlefeedai.api.service.StorageUnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Storage Units, hardware sensor ingestion, and condition monitoring.
 */
@RestController
@RequestMapping("/api/storage-units")
@Tag(name = "16. Storage Unit Monitoring", description = "Storage unit management, IoT hardware sensor ingestion, and storage alerts")
public class StorageUnitController {

    private final StorageUnitService storageUnitService;

    public StorageUnitController(StorageUnitService storageUnitService) {
        this.storageUnitService = storageUnitService;
    }

    /**
     * POST /api/storage-units - Create a new storage unit.
     */
    @Operation(summary = "Create storage unit", description = "Registers a new feed bunker, silo, pit, or storage unit under a farm.")
    @PostMapping
    public ResponseEntity<StorageUnitResponse> createStorageUnit(@Valid @RequestBody StorageUnitRequest request) {
        StorageUnitResponse response = storageUnitService.createStorageUnit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/storage-units - Get all storage units belonging to authenticated farmer.
     */
    @Operation(summary = "List storage units", description = "Retrieves all storage units for the authenticated farmer, optionally filtered by farmId.")
    @GetMapping
    public ResponseEntity<List<StorageUnitResponse>> getAllStorageUnits(@RequestParam(required = false) Long farmId) {
        List<StorageUnitResponse> responses = storageUnitService.getAllStorageUnits(farmId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/storage-units/summary - Get monitoring dashboard summary metrics.
     */
    @Operation(summary = "Get storage monitoring summary", description = "Provides high-level monitoring status counts and unread alert totals for the farmer dashboard.")
    @GetMapping("/summary")
    public ResponseEntity<StorageMonitoringSummaryDto> getStorageMonitoringSummary() {
        StorageMonitoringSummaryDto summary = storageUnitService.getStorageMonitoringSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/storage-units/{id} - Get storage unit details by ID.
     */
    @Operation(summary = "Get storage unit by ID", description = "Retrieves storage unit details, latest sensor readings, and monitoring status.")
    @GetMapping("/{id}")
    public ResponseEntity<StorageUnitResponse> getStorageUnitById(@PathVariable Long id) {
        StorageUnitResponse response = storageUnitService.getStorageUnitById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/storage-units/{id} - Update an existing storage unit.
     */
    @Operation(summary = "Update storage unit", description = "Updates storage unit parameters (name, capacity, location, deviceId).")
    @PutMapping("/{id}")
    public ResponseEntity<StorageUnitResponse> updateStorageUnit(
            @PathVariable Long id,
            @Valid @RequestBody StorageUnitRequest request
    ) {
        StorageUnitResponse response = storageUnitService.updateStorageUnit(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/storage-units/{id} - Delete a storage unit and its sensor readings.
     */
    @Operation(summary = "Delete storage unit", description = "Deletes a storage unit and cascades deletion of all its sensor readings.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStorageUnit(@PathVariable Long id) {
        storageUnitService.deleteStorageUnit(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/storage-units/{storageUnitId}/sensor-readings - Hardware / manual telemetry ingestion.
     */
    @Operation(summary = "Ingest sensor reading", description = "Accepts periodic telemetry from hardware (e.g. ESP32) or manual readings. Evaluates monitoring thresholds and generates alerts.")
    @PostMapping("/{storageUnitId}/sensor-readings")
    public ResponseEntity<SensorReadingResponse> recordSensorReading(
            @PathVariable Long storageUnitId,
            @RequestBody SensorReadingRequest request
    ) {
        SensorReadingResponse response = storageUnitService.recordSensorReading(storageUnitId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/storage-units/{storageUnitId}/sensor-readings - Get historical telemetry.
     */
    @Operation(summary = "Get sensor history", description = "Retrieves chronological sensor history for temperature, pH, and humidity.")
    @GetMapping("/{storageUnitId}/sensor-readings")
    public ResponseEntity<List<SensorReadingResponse>> getSensorReadings(@PathVariable Long storageUnitId) {
        List<SensorReadingResponse> responses = storageUnitService.getSensorReadings(storageUnitId);
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/storage-units/{storageUnitId}/sensor-readings/latest - Get latest telemetry reading.
     */
    @Operation(summary = "Get latest sensor reading", description = "Retrieves the most recent telemetry reading recorded for this storage unit.")
    @GetMapping("/{storageUnitId}/sensor-readings/latest")
    public ResponseEntity<SensorReadingResponse> getLatestSensorReading(@PathVariable Long storageUnitId) {
        SensorReadingResponse response = storageUnitService.getLatestSensorReading(storageUnitId);
        return ResponseEntity.ok(response);
    }
}
