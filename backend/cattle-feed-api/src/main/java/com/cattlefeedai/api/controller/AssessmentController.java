package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.AnimalHealthScreeningResponse;
import com.cattlefeedai.api.dto.assessment.AssessmentSummaryResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.VisualScreeningRequest;
import com.cattlefeedai.api.dto.assessment.VisualScreeningResponse;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.repository.TestResultRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.assessment.AdvisoryService;
import com.cattlefeedai.api.service.assessment.AnimalHealthScreeningService;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import com.cattlefeedai.api.service.assessment.VisualScreeningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing endpoints for Quality Assessment, Risk Screening,
 * Animal Health Screening, and Webcam Visual Ingestion.
 */
@RestController
@RequestMapping("/api/assessments")
@Tag(name = "7. Quality & Risk Assessment", description = "Quality assessment, risk screening, animal health screening, and webcam visual screening ingestion")
public class AssessmentController {

    private final QualityAssessmentService qualityAssessmentService;
    private final RiskAssessmentService riskAssessmentService;
    private final AnimalHealthScreeningService animalHealthScreeningService;
    private final AdvisoryService advisoryService;
    private final VisualScreeningService visualScreeningService;
    private final TestResultRepository testResultRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final SecurityUtils securityUtils;
    private final com.cattlefeedai.api.service.AlertService alertService;

    public AssessmentController(
            QualityAssessmentService qualityAssessmentService,
            RiskAssessmentService riskAssessmentService,
            AnimalHealthScreeningService animalHealthScreeningService,
            AdvisoryService advisoryService,
            VisualScreeningService visualScreeningService,
            TestResultRepository testResultRepository,
            FeedSampleRepository feedSampleRepository,
            SilageSampleRepository silageSampleRepository,
            SecurityUtils securityUtils,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.cattlefeedai.api.service.AlertService alertService
    ) {
        this.qualityAssessmentService = qualityAssessmentService;
        this.riskAssessmentService = riskAssessmentService;
        this.animalHealthScreeningService = animalHealthScreeningService;
        this.advisoryService = advisoryService;
        this.visualScreeningService = visualScreeningService;
        this.testResultRepository = testResultRepository;
        this.feedSampleRepository = feedSampleRepository;
        this.silageSampleRepository = silageSampleRepository;
        this.securityUtils = securityUtils;
        this.alertService = alertService;
    }

    /**
     * GET /api/assessments/test-results/{testResultId}
     * Runs and returns Quality Assessment on a specific test result.
     */
    @Operation(summary = "Get quality assessment", description = "Evaluates 11 parameters from a test result against baseline rules and returns a structured quality status (GOOD, ACCEPTABLE, NEEDS_ATTENTION, UNSAFE, INSUFFICIENT_DATA).")
    @GetMapping("/test-results/{testResultId}")
    public ResponseEntity<QualityAssessmentResponse> getQualityAssessment(@PathVariable Long testResultId) {
        TestResult testResult = getValidatedTestResult(testResultId);
        QualityAssessmentResponse response = qualityAssessmentService.assessQuality(testResult);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/assessments/test-results/{testResultId}/risk
     * Runs and returns Risk Assessment on a specific test result.
     */
    @Operation(summary = "Get risk assessment", description = "Identifies contamination risks, nutritional imbalances, and storage/spoilage risks using non-diagnostic risk terminology.")
    @GetMapping("/test-results/{testResultId}/risk")
    public ResponseEntity<RiskAssessmentResponse> getRiskAssessment(@PathVariable Long testResultId) {
        TestResult testResult = getValidatedTestResult(testResultId);
        RiskAssessmentResponse response = riskAssessmentService.assessRisk(testResult);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/assessments/test-results/{testResultId}
     * Evaluates Quality + Risk Assessment and generates persistent Advisories.
     */
    @Operation(summary = "Evaluate test result and generate advisories", description = "Evaluates quality & risk layers and automatically generates/persists advisories for the animal associated with the sample.")
    @PostMapping("/test-results/{testResultId}")
    public ResponseEntity<AssessmentSummaryResponse> evaluateAndGenerateAdvisories(@PathVariable Long testResultId) {
        TestResult testResult = getValidatedTestResult(testResultId);

        QualityAssessmentResponse quality = qualityAssessmentService.assessQuality(testResult);
        RiskAssessmentResponse risk = riskAssessmentService.assessRisk(testResult);

        Animal animal = null;
        if (testResult.getFeedSample() != null) {
            animal = testResult.getFeedSample().getAnimal();
        } else if (testResult.getSilageSample() != null) {
            animal = testResult.getSilageSample().getAnimal();
        }

        List<AdvisoryResponse> advisories = advisoryService.generateAdvisories(animal, risk.getAllRisks(), testResult.getId());

        Farm farm = testResult.getFeedSample() != null ? testResult.getFeedSample().getFarm()
                : (testResult.getSilageSample() != null ? testResult.getSilageSample().getFarm() : null);

        if (farm != null && alertService != null) {
            alertService.processAssessmentAlerts(farm, quality, risk, advisories, testResult.getId());
        }

        AssessmentSummaryResponse summary = AssessmentSummaryResponse.builder()
                .qualityAssessment(quality)
                .riskAssessment(risk)
                .generatedAdvisories(advisories)
                .build();

        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/assessments/feed-samples/{feedSampleId}
     * Evaluates latest test result for a feed sample.
     */
    @Operation(summary = "Get latest feed sample assessment", description = "Evaluates the most recent test result recorded for a feed sample.")
    @GetMapping("/feed-samples/{feedSampleId}")
    public ResponseEntity<QualityAssessmentResponse> getLatestFeedSampleAssessment(@PathVariable Long feedSampleId) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample sample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFarmOwnership(sample.getFarm(), currentUser);

        List<TestResult> tests = testResultRepository.findByFeedSampleIdOrderByTestDateAsc(feedSampleId);
        if (tests.isEmpty()) {
            throw new ResourceNotFoundException("No test results found for feed sample id: " + feedSampleId);
        }

        TestResult latestTest = tests.get(tests.size() - 1);
        return ResponseEntity.ok(qualityAssessmentService.assessQuality(latestTest));
    }

    /**
     * GET /api/assessments/silage-samples/{silageSampleId}
     * Evaluates latest test result for a silage sample.
     */
    @Operation(summary = "Get latest silage sample assessment", description = "Evaluates the most recent test result recorded for a silage sample.")
    @GetMapping("/silage-samples/{silageSampleId}")
    public ResponseEntity<QualityAssessmentResponse> getLatestSilageSampleAssessment(@PathVariable Long silageSampleId) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample sample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateFarmOwnership(sample.getFarm(), currentUser);

        List<TestResult> tests = testResultRepository.findBySilageSampleIdOrderByTestDateAsc(silageSampleId);
        if (tests.isEmpty()) {
            throw new ResourceNotFoundException("No test results found for silage sample id: " + silageSampleId);
        }

        TestResult latestTest = tests.get(tests.size() - 1);
        return ResponseEntity.ok(qualityAssessmentService.assessQuality(latestTest));
    }

    /**
     * GET /api/assessments/animals/{animalId}/health-screening
     * Non-diagnostic health screening correlating animal profile, feed history, and health observations.
     */
    @Operation(summary = "Animal health risk screening", description = "Non-diagnostic multi-factor screening correlating animal lactation demands, feed test history, and health observations.")
    @GetMapping("/animals/{animalId}/health-screening")
    public ResponseEntity<AnimalHealthScreeningResponse> screenAnimalHealth(@PathVariable Long animalId) {
        AnimalHealthScreeningResponse response = animalHealthScreeningService.screenAnimalHealth(animalId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/assessments/visual-screening
     * Ingest visual screening result from webcam / external Computer Vision service.
     */
    @Operation(summary = "Ingest webcam / Computer Vision visual screening", description = "Receives external webcam visual screening inferences (mould, spoilage, foreign material) marked as VISUAL SCREENING ONLY.")
    @PostMapping("/visual-screening")
    public ResponseEntity<VisualScreeningResponse> ingestVisualScreening(@Valid @RequestBody VisualScreeningRequest request) {
        VisualScreeningResponse response = visualScreeningService.ingestVisualScreening(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private TestResult getValidatedTestResult(Long testResultId) {
        User currentUser = securityUtils.getCurrentUser();
        TestResult testResult = testResultRepository.findById(testResultId)
                .orElseThrow(() -> new ResourceNotFoundException("Test result not found with id: " + testResultId));

        Farm farm = testResult.getFeedSample() != null ? testResult.getFeedSample().getFarm()
                : (testResult.getSilageSample() != null ? testResult.getSilageSample().getFarm() : null);

        if (farm != null) {
            validateFarmOwnership(farm, currentUser);
        }
        return testResult;
    }

    private void validateFarmOwnership(Farm farm, User user) {
        if (!securityUtils.isAdmin(user) && !farm.getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException(
                    "Access denied: You do not have permission to access resources on this farm");
        }
    }
}
