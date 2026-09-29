package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.evidence.EvidenceSummaryResponse;
import com.cattlefeedai.api.service.evidence.EvidenceSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing minimal, secure REST endpoints for Unified Evidence Aggregation.
 * Connects animal records, feed/silage data, lab tests, quality & risk assessments,
 * visual screening, feed plans, advisories, historical analytics, and expert consultations.
 */
@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
@Tag(name = "12. Integrated Decision Support", description = "Aggregated decision-support evidence connecting animal profiles, feed/silage records, lab tests, quality/risk assessments, AI visual screening, feed plans, advisories, and expert consultations")
public class EvidenceController {

    private final EvidenceSummaryService evidenceSummaryService;

    @Operation(summary = "Get aggregated evidence for an animal", description = "Retrieves unified decision-support evidence for a specific animal owned by the farmer or assigned to an expert consultation.")
    @GetMapping("/animals/{animalId}")
    public ResponseEntity<EvidenceSummaryResponse> getEvidenceForAnimal(@PathVariable Long animalId) {
        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForAnimal(animalId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get aggregated evidence for a consultation", description = "Retrieves unified decision-support evidence in the context of an expert consultation for the owning farmer or assigned expert.")
    @GetMapping("/consultations/{consultationId}")
    public ResponseEntity<EvidenceSummaryResponse> getEvidenceForConsultation(@PathVariable Long consultationId) {
        EvidenceSummaryResponse response = evidenceSummaryService.getEvidenceForConsultation(consultationId);
        return ResponseEntity.ok(response);
    }
}
