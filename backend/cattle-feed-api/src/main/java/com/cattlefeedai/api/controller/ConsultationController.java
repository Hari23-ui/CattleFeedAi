package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.consultation.ConsultationRequest;
import com.cattlefeedai.api.dto.consultation.ConsultationResponse;
import com.cattlefeedai.api.dto.consultation.ExpertRecommendationRequest;
import com.cattlefeedai.api.service.ConsultationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Expert Consultation endpoints.
 * Handles the complete advisory workflow between Farmers and Experts.
 */
@RestController
@RequestMapping("/api/consultations")
@Tag(name = "7. Expert Consultation", description = "Advisory consultations between farmers and veterinary/nutrition experts")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    /**
     * POST /api/consultations - Farmer requests a new consultation.
     */
    @Operation(summary = "Request consultation", description = "Farmer submits a new consultation request with optional animal or feed/silage sample reference.")
    @PostMapping
    public ResponseEntity<ConsultationResponse> createConsultation(
            @Valid @RequestBody ConsultationRequest request
    ) {
        ConsultationResponse response = consultationService.createConsultation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/consultations - List consultations for authenticated user.
     * Farmers see their own requests; Experts see assigned or available open requests.
     */
    @Operation(summary = "List consultations", description = "Retrieves consultations scoped to current authenticated user (farmer sees own, expert sees assigned/available).")
    @GetMapping
    public ResponseEntity<List<ConsultationResponse>> getAllConsultations() {
        List<ConsultationResponse> list = consultationService.getAllConsultations();
        return ResponseEntity.ok(list);
    }

    /**
     * GET /api/consultations/{id} - Get consultation details by ID.
     */
    @Operation(summary = "Get consultation details", description = "Retrieves full consultation details including animal profile, feed/silage lab test results, and AI visual screening if available.")
    @GetMapping("/{id}")
    public ResponseEntity<ConsultationResponse> getConsultationById(@PathVariable Long id) {
        ConsultationResponse response = consultationService.getConsultationById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/consultations/{id}/accept - Expert accepts a consultation.
     */
    @Operation(summary = "Accept consultation", description = "Expert accepts an open consultation request, moving its status to ACCEPTED.")
    @PutMapping("/{id}/accept")
    public ResponseEntity<ConsultationResponse> acceptConsultation(@PathVariable Long id) {
        ConsultationResponse response = consultationService.acceptConsultation(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/consultations/{id}/review - Expert moves consultation into review.
     */
    @Operation(summary = "Start consultation review", description = "Expert moves an accepted consultation into IN_REVIEW while analyzing clinical/nutritional data.")
    @PutMapping("/{id}/review")
    public ResponseEntity<ConsultationResponse> startReview(@PathVariable Long id) {
        ConsultationResponse response = consultationService.startReview(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/consultations/{id}/respond - Expert submits professional recommendation and notes.
     */
    @Operation(summary = "Respond to consultation", description = "Expert submits professional advisory recommendations and notes, moving status to RESPONDED.")
    @PutMapping("/{id}/respond")
    public ResponseEntity<ConsultationResponse> respondConsultation(
            @PathVariable Long id,
            @Valid @RequestBody ExpertRecommendationRequest request
    ) {
        ConsultationResponse response = consultationService.respondConsultation(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/consultations/{id}/complete - Expert marks consultation as completed.
     */
    @Operation(summary = "Complete consultation", description = "Expert concludes the consultation workflow, moving status to COMPLETED and recording completion timestamp.")
    @PutMapping("/{id}/complete")
    public ResponseEntity<ConsultationResponse> completeConsultation(@PathVariable Long id) {
        ConsultationResponse response = consultationService.completeConsultation(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/consultations/{id}/cancel - Farmer cancels consultation.
     */
    @Operation(summary = "Cancel consultation", description = "Farmer cancels an eligible consultation before review/response, moving status to CANCELLED.")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ConsultationResponse> cancelConsultation(@PathVariable Long id) {
        ConsultationResponse response = consultationService.cancelConsultation(id);
        return ResponseEntity.ok(response);
    }
}
