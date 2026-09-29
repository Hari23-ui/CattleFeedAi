package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.analytics.AnimalAnalyticsResponse;
import com.cattlefeedai.api.dto.analytics.FarmAnalyticsSummaryResponse;
import com.cattlefeedai.api.dto.analytics.SampleHistoricalTrendsResponse;
import com.cattlefeedai.api.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for Historical Analytics and Trend Tracking endpoints.
 */
@RestController
@RequestMapping("/api/analytics")
@Tag(name = "12. Analytics & Historical Trends", description = "Descriptive historical analytics, test trends, quality progression, and risk distribution")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/analytics/summary
     * Retrieve farm-wide analytics summary for the authenticated farmer/expert/admin.
     */
    @Operation(summary = "Get farm analytics summary", description = "Retrieves high-level counts and quality/risk distribution across available historical records.")
    @GetMapping("/summary")
    public ResponseEntity<FarmAnalyticsSummaryResponse> getFarmSummary(
            @RequestParam(required = false) Integer days
    ) {
        FarmAnalyticsSummaryResponse response = analyticsService.getFarmSummary(days);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/analytics/animals/{animalId}
     * Retrieve historical analytics for a specific animal.
     */
    @Operation(summary = "Get animal historical analytics", description = "Retrieves testing history, quality/risk progression, latest measurements, and active advisories for an animal.")
    @GetMapping("/animals/{animalId}")
    public ResponseEntity<AnimalAnalyticsResponse> getAnimalAnalytics(
            @PathVariable Long animalId,
            @RequestParam(required = false) Integer days
    ) {
        AnimalAnalyticsResponse response = analyticsService.getAnimalAnalytics(animalId, days);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/analytics/animals/{animalId}/history
     * Alias for animal history.
     */
    @Operation(summary = "Get animal test history (alias)", description = "Retrieves full historical testing records and quality trends for an animal.")
    @GetMapping("/animals/{animalId}/history")
    public ResponseEntity<AnimalAnalyticsResponse> getAnimalHistory(
            @PathVariable Long animalId,
            @RequestParam(required = false) Integer days
    ) {
        AnimalAnalyticsResponse response = analyticsService.getAnimalAnalytics(animalId, days);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/analytics/feed-samples/{feedSampleId}
     * Retrieve historical test trends for a feed sample.
     */
    @Operation(summary = "Get feed sample historical trends", description = "Retrieves chronological test measurements and quality/risk progression for a feed sample.")
    @GetMapping("/feed-samples/{feedSampleId}")
    public ResponseEntity<SampleHistoricalTrendsResponse> getFeedSampleTrends(
            @PathVariable Long feedSampleId,
            @RequestParam(required = false) Integer days
    ) {
        SampleHistoricalTrendsResponse response = analyticsService.getFeedSampleHistory(feedSampleId, days);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/analytics/feed-samples/{feedSampleId}/history
     * Alias for feed sample history.
     */
    @Operation(summary = "Get feed sample history (alias)", description = "Retrieves chronological test measurements and quality/risk progression for a feed sample.")
    @GetMapping("/feed-samples/{feedSampleId}/history")
    public ResponseEntity<SampleHistoricalTrendsResponse> getFeedSampleHistory(
            @PathVariable Long feedSampleId,
            @RequestParam(required = false) Integer days
    ) {
        SampleHistoricalTrendsResponse response = analyticsService.getFeedSampleHistory(feedSampleId, days);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/analytics/silage-samples/{silageSampleId}
     * Retrieve historical test trends for a silage sample.
     */
    @Operation(summary = "Get silage sample historical trends", description = "Retrieves chronological test measurements and quality/risk progression for a silage sample.")
    @GetMapping("/silage-samples/{silageSampleId}")
    public ResponseEntity<SampleHistoricalTrendsResponse> getSilageSampleTrends(
            @PathVariable Long silageSampleId,
            @RequestParam(required = false) Integer days
    ) {
        SampleHistoricalTrendsResponse response = analyticsService.getSilageSampleHistory(silageSampleId, days);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/analytics/silage-samples/{silageSampleId}/history
     * Alias for silage sample history.
     */
    @Operation(summary = "Get silage sample history (alias)", description = "Retrieves chronological test measurements and quality/risk progression for a silage sample.")
    @GetMapping("/silage-samples/{silageSampleId}/history")
    public ResponseEntity<SampleHistoricalTrendsResponse> getSilageSampleHistory(
            @PathVariable Long silageSampleId,
            @RequestParam(required = false) Integer days
    ) {
        SampleHistoricalTrendsResponse response = analyticsService.getSilageSampleHistory(silageSampleId, days);
        return ResponseEntity.ok(response);
    }
}
