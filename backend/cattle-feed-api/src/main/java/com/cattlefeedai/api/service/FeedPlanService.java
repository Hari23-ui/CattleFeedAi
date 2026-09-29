package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.FeedPlanRequest;
import com.cattlefeedai.api.dto.FeedPlanResponse;
import com.cattlefeedai.api.dto.assessment.QualityAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskAssessmentResponse;
import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.assessment.QualityAssessmentService;
import com.cattlefeedai.api.service.assessment.RiskAssessmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Service managing Feed Planning records and decision-support context.
 * Strict ownership isolation: Farmers can only access and manage feed plans
 * for animals/farms they own.
 * Cross-owner operations throw ResourceOwnershipException (403).
 * Non-diagnostic presentation layer: reuses authoritative assessment/advisory engines.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class FeedPlanService {

    private static final String SCIENTIFIC_SAFETY_DISCLAIMER =
            "Informational feed planning record only. Non-diagnostic. " +
            "Does not constitute veterinary prescription or diagnosis. " +
            "Consult a qualified Veterinarian, Veterinary Nutritionist, or Animal Nutrition Expert " +
            "for clinical or dietary interventions.";

    private final FeedPlanRepository feedPlanRepository;
    private final AnimalRepository animalRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final TestResultRepository testResultRepository;
    private final QualityAssessmentService qualityAssessmentService;
    private final RiskAssessmentService riskAssessmentService;
    private final AdvisoryRepository advisoryRepository;
    private final SecurityUtils securityUtils;

    /**
     * Create a new feed plan for an animal owned by the authenticated farmer.
     */
    public FeedPlanResponse createFeedPlan(FeedPlanRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        Animal animal = animalRepository.findById(request.getAnimalId())
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + request.getAnimalId()));
        validateAnimalOwnership(animal, currentUser);

        FeedSample feedSample = null;
        if (request.getFeedSampleId() != null) {
            feedSample = feedSampleRepository.findById(request.getFeedSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + request.getFeedSampleId()));
            validateFeedSampleOwnership(feedSample, currentUser);
        }

        SilageSample silageSample = null;
        if (request.getSilageSampleId() != null) {
            silageSample = silageSampleRepository.findById(request.getSilageSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + request.getSilageSampleId()));
            validateSilageSampleOwnership(silageSample, currentUser);
        }

        FeedPlan feedPlan = new FeedPlan();
        feedPlan.setPlanName(request.getPlanName().trim());
        feedPlan.setDescription(request.getDescription());
        feedPlan.setStartDate(request.getStartDate());
        feedPlan.setEndDate(request.getEndDate());
        feedPlan.setStatus(request.getStatus() != null && !request.getStatus().isBlank()
                ? request.getStatus().trim().toUpperCase() : "ACTIVE");
        feedPlan.setPlannedQuantity(request.getPlannedQuantity());
        feedPlan.setFrequency(request.getFrequency());
        feedPlan.setNotes(request.getNotes());
        feedPlan.setAnimal(animal);
        feedPlan.setFeedSample(feedSample);
        feedPlan.setSilageSample(silageSample);

        FeedPlan saved = feedPlanRepository.save(feedPlan);
        log.info("Created FeedPlan [id={}] for animal [id={}] by user [id={}]",
                saved.getId(), animal.getId(), currentUser.getId());

        return toResponse(saved);
    }

    /**
     * Retrieve all feed plans for animals owned by the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public List<FeedPlanResponse> getFeedPlans() {
        User currentUser = securityUtils.getCurrentUser();
        List<FeedPlan> plans = feedPlanRepository.findByAnimalFarmOwnerIdOrderByCreatedAtDesc(currentUser.getId());
        return plans.stream().map(this::toResponse).toList();
    }

    /**
     * Retrieve a specific feed plan by ID with strict ownership validation.
     */
    @Transactional(readOnly = true)
    public FeedPlanResponse getFeedPlanById(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        FeedPlan plan = feedPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed plan not found with id: " + id));

        validateFeedPlanOwnership(plan, currentUser);
        return toResponse(plan);
    }

    /**
     * Update an existing feed plan.
     */
    public FeedPlanResponse updateFeedPlan(Long id, FeedPlanRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        FeedPlan plan = feedPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed plan not found with id: " + id));

        validateFeedPlanOwnership(plan, currentUser);

        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        if (request.getAnimalId() != null && !request.getAnimalId().equals(plan.getAnimal().getId())) {
            Animal newAnimal = animalRepository.findById(request.getAnimalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + request.getAnimalId()));
            validateAnimalOwnership(newAnimal, currentUser);
            plan.setAnimal(newAnimal);
        }

        if (request.getFeedSampleId() != null) {
            FeedSample newFeed = feedSampleRepository.findById(request.getFeedSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + request.getFeedSampleId()));
            validateFeedSampleOwnership(newFeed, currentUser);
            plan.setFeedSample(newFeed);
        } else {
            plan.setFeedSample(null);
        }

        if (request.getSilageSampleId() != null) {
            SilageSample newSilage = silageSampleRepository.findById(request.getSilageSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + request.getSilageSampleId()));
            validateSilageSampleOwnership(newSilage, currentUser);
            plan.setSilageSample(newSilage);
        } else {
            plan.setSilageSample(null);
        }

        plan.setPlanName(request.getPlanName().trim());
        plan.setDescription(request.getDescription());
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            plan.setStatus(request.getStatus().trim().toUpperCase());
        }
        plan.setPlannedQuantity(request.getPlannedQuantity());
        plan.setFrequency(request.getFrequency());
        plan.setNotes(request.getNotes());

        FeedPlan updated = feedPlanRepository.save(plan);
        log.info("Updated FeedPlan [id={}] by user [id={}]", updated.getId(), currentUser.getId());

        return toResponse(updated);
    }

    /**
     * Delete a feed plan by ID with strict ownership validation.
     */
    public void deleteFeedPlan(Long id) {
        User currentUser = securityUtils.getCurrentUser();
        FeedPlan plan = feedPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed plan not found with id: " + id));

        validateFeedPlanOwnership(plan, currentUser);
        feedPlanRepository.delete(plan);
        log.info("Deleted FeedPlan [id={}] by user [id={}]", id, currentUser.getId());
    }

    // ── Ownership Validation Helpers ───────────────────────────

    private void validateAnimalOwnership(Animal animal, User user) {
        if (!securityUtils.isAdmin(user) && !animal.getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to access this animal");
        }
    }

    private void validateFeedSampleOwnership(FeedSample sample, User user) {
        if (!securityUtils.isAdmin(user) && !sample.getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not own this feed sample");
        }
    }

    private void validateSilageSampleOwnership(SilageSample sample, User user) {
        if (!securityUtils.isAdmin(user) && !sample.getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not own this silage sample");
        }
    }

    private void validateFeedPlanOwnership(FeedPlan plan, User user) {
        if (!securityUtils.isAdmin(user) && !plan.getAnimal().getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to access this feed plan");
        }
    }

    // ── Response Mapping & Context Gathering ───────────────────

    public FeedPlanResponse toResponse(FeedPlan plan) {
        Animal animal = plan.getAnimal();
        FeedPlanResponse.AnimalSummaryDto animalDto = null;
        if (animal != null) {
            animalDto = FeedPlanResponse.AnimalSummaryDto.builder()
                    .id(animal.getId())
                    .animalTag(animal.getAnimalTag())
                    .name(animal.getName())
                    .breed(animal.getBreed())
                    .category(animal.getLactationStage() != null ? animal.getLactationStage().name() : null)
                    .farmId(animal.getFarm() != null ? animal.getFarm().getId() : null)
                    .farmName(animal.getFarm() != null ? animal.getFarm().getFarmName() : null)
                    .build();
        }

        FeedPlanResponse.FeedSampleSummaryDto feedDto = null;
        if (plan.getFeedSample() != null) {
            FeedSample fs = plan.getFeedSample();
            feedDto = FeedPlanResponse.FeedSampleSummaryDto.builder()
                    .id(fs.getId())
                    .sampleCode(fs.getSampleCode())
                    .feedType(fs.getFeedType() != null ? fs.getFeedType().name() : null)
                    .sampleDate(fs.getSampleDate())
                    .source(fs.getSource())
                    .build();
        }

        FeedPlanResponse.SilageSampleSummaryDto silageDto = null;
        if (plan.getSilageSample() != null) {
            SilageSample ss = plan.getSilageSample();
            silageDto = FeedPlanResponse.SilageSampleSummaryDto.builder()
                    .id(ss.getId())
                    .sampleCode(ss.getSampleCode())
                    .silageType(ss.getSilageType() != null ? ss.getSilageType().name() : null)
                    .sampleDate(ss.getSampleDate())
                    .source(ss.getSource())
                    .build();
        }

        // Gather existing test result and quality/risk assessment
        TestResult latestTest = null;
        if (plan.getFeedSample() != null) {
            List<TestResult> tests = testResultRepository.findByFeedSampleIdOrderByTestDateDesc(plan.getFeedSample().getId());
            if (!tests.isEmpty()) {
                latestTest = tests.get(0);
            }
        } else if (plan.getSilageSample() != null) {
            List<TestResult> tests = testResultRepository.findBySilageSampleIdOrderByTestDateDesc(plan.getSilageSample().getId());
            if (!tests.isEmpty()) {
                latestTest = tests.get(0);
            }
        }

        FeedPlanResponse.TestResultSummaryDto testDto = null;
        String qualityStatus = "Not Available";
        String riskLevel = "Not Available";
        List<RiskIndicatorDto> riskIndicators = Collections.emptyList();

        if (latestTest != null) {
            testDto = FeedPlanResponse.TestResultSummaryDto.builder()
                    .id(latestTest.getId())
                    .testDate(latestTest.getTestDate())
                    .laboratory(latestTest.getAnalysisSource() != null ? latestTest.getAnalysisSource().name() : "N/A")
                    .moisture(latestTest.getMoisture() != null ? latestTest.getMoisture().doubleValue() : null)
                    .crudeProtein(latestTest.getCrudeProtein() != null ? latestTest.getCrudeProtein().doubleValue() : null)
                    .acidDetergentFiber(latestTest.getFiber() != null ? latestTest.getFiber().doubleValue() : null)
                    .neutralDetergentFiber(null)
                    .ph(latestTest.getPh() != null ? latestTest.getPh().doubleValue() : null)
                    .notes(latestTest.getAdulteration())
                    .build();

            try {
                QualityAssessmentResponse qa = qualityAssessmentService.assessQuality(latestTest);
                if (qa != null && qa.getQualityStatus() != null) {
                    qualityStatus = qa.getQualityStatus().name();
                }
            } catch (Exception e) {
                log.debug("Could not assess quality for test result {}: {}", latestTest.getId(), e.getMessage());
            }

            try {
                RiskAssessmentResponse ra = riskAssessmentService.assessRisk(latestTest);
                if (ra != null) {
                    if (ra.getOverallRiskLevel() != null) {
                        riskLevel = ra.getOverallRiskLevel().name();
                    }
                    if (ra.getAllRisks() != null) {
                        riskIndicators = ra.getAllRisks();
                    }
                }
            } catch (Exception e) {
                log.debug("Could not assess risk for test result {}: {}", latestTest.getId(), e.getMessage());
            }
        }

        // Gather recent advisories for this animal
        List<FeedPlanResponse.AdvisorySummaryDto> advisoryDtos = Collections.emptyList();
        if (animal != null && animal.getId() != null) {
            List<Advisory> advisories = advisoryRepository.findByAnimalId(animal.getId());
            if (advisories != null && !advisories.isEmpty()) {
                advisoryDtos = advisories.stream()
                        .limit(5)
                        .map(a -> FeedPlanResponse.AdvisorySummaryDto.builder()
                                .id(a.getId())
                                .category(a.getAdvisoryType() != null ? a.getAdvisoryType().name() : null)
                                .priority(a.getPriority() != null ? a.getPriority().name() : null)
                                .title(a.getTitle())
                                .message(a.getMessage())
                                .isRead(a.getIsRead())
                                .createdAt(a.getCreatedAt())
                                .build())
                        .toList();
            }
        }

        return FeedPlanResponse.builder()
                .id(plan.getId())
                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .status(plan.getStatus())
                .plannedQuantity(plan.getPlannedQuantity())
                .frequency(plan.getFrequency())
                .notes(plan.getNotes())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .animal(animalDto)
                .feedSample(feedDto)
                .silageSample(silageDto)
                .latestTestResult(testDto)
                .qualityStatus(qualityStatus)
                .riskLevel(riskLevel)
                .riskIndicators(riskIndicators)
                .recentAdvisories(advisoryDtos)
                .disclaimer(SCIENTIFIC_SAFETY_DISCLAIMER)
                .build();
    }
}
