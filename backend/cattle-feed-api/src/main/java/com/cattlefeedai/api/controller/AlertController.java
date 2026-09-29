package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.AlertResponse;
import com.cattlefeedai.api.dto.UnreadCountResponse;
import com.cattlefeedai.api.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for in-app Notifications & Alerts (M10).
 *
 * Endpoints:
 * - GET /api/alerts - List all alerts for current authenticated farmer
 * - GET /api/alerts/{id} - Get a specific alert by ID (enforcing ownership)
 * - GET /api/alerts/unread-count - Get the unread alert count for dashboard badge
 * - PUT /api/alerts/{id}/read - Mark an alert as read
 * - PUT /api/alerts/read-all - Mark all alerts as read for current farmer
 */
@RestController
@RequestMapping("/api/alerts")
@Tag(name = "10. Notifications & Alerts", description = "In-app notifications and alerts workflow for quality, risk, and advisories")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * GET /api/alerts
     * Retrieve all alerts for the authenticated farmer.
     */
    @Operation(summary = "List alerts", description = "Retrieves alerts for the authenticated farmer, ordered with newest first.")
    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAlerts() {
        List<AlertResponse> alerts = alertService.getAlerts();
        return ResponseEntity.ok(alerts);
    }

    /**
     * GET /api/alerts/{id}
     * Retrieve a specific alert by ID.
     */
    @Operation(summary = "Get alert by ID", description = "Retrieves a specific alert by ID. Returns 403 if accessed by another farmer.")
    @GetMapping("/{id}")
    public ResponseEntity<AlertResponse> getAlertById(@PathVariable Long id) {
        AlertResponse alert = alertService.getAlertById(id);
        return ResponseEntity.ok(alert);
    }

    /**
     * GET /api/alerts/unread-count
     * Retrieve count of unread alerts for dashboard badge.
     */
    @Operation(summary = "Get unread alert count", description = "Returns the count of unread alerts for the authenticated farmer.")
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount() {
        UnreadCountResponse response = alertService.getUnreadCount();
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/alerts/{id}/read
     * Mark an alert as read.
     */
    @Operation(summary = "Mark alert as read", description = "Marks a specific alert as read. Returns 403 if belonging to another farmer.")
    @PutMapping("/{id}/read")
    public ResponseEntity<AlertResponse> markAsRead(@PathVariable Long id) {
        AlertResponse response = alertService.markAsRead(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/alerts/read-all
     * Mark all unread alerts for current farmer as read.
     */
    @Operation(summary = "Mark all alerts as read", description = "Marks all unread alerts for the authenticated farmer as read.")
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        int updatedCount = alertService.markAllAsRead();
        return ResponseEntity.ok(Map.of(
                "message", "All alerts marked as read",
                "updatedCount", updatedCount
        ));
    }
}
