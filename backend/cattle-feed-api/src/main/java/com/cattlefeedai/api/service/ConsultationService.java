package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.consultation.ConsultationRequest;
import com.cattlefeedai.api.dto.consultation.ConsultationResponse;
import com.cattlefeedai.api.dto.consultation.ExpertRecommendationRequest;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.ConsultationStatus;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.*;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing expert consultations, ownership enforcement,
 * and valid consultation lifecycle state transitions.
 */
@Service
@Transactional
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final ExpertRepository expertRepository;
    private final AnimalRepository animalRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final TestResultRepository testResultRepository;
    private final SampleImageRepository sampleImageRepository;
    private final HealthRiskRepository healthRiskRepository;
    private final AdvisoryRepository advisoryRepository;
    private final SecurityUtils securityUtils;

    public ConsultationService(
            ConsultationRepository consultationRepository,
            ExpertRepository expertRepository,
            AnimalRepository animalRepository,
            FeedSampleRepository feedSampleRepository,
            SilageSampleRepository silageSampleRepository,
            TestResultRepository testResultRepository,
            SampleImageRepository sampleImageRepository,
            HealthRiskRepository healthRiskRepository,
            AdvisoryRepository advisoryRepository,
            SecurityUtils securityUtils
    ) {
        this.consultationRepository = consultationRepository;
        this.expertRepository = expertRepository;
        this.animalRepository = animalRepository;
        this.feedSampleRepository = feedSampleRepository;
        this.silageSampleRepository = silageSampleRepository;
        this.testResultRepository = testResultRepository;
        this.sampleImageRepository = sampleImageRepository;
        this.healthRiskRepository = healthRiskRepository;
        this.advisoryRepository = advisoryRepository;
        this.securityUtils = securityUtils;
    }

    // ── Create Consultation (Farmer) ──────────────────────────────

    public ConsultationResponse createConsultation(ConsultationRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new InvalidRequestException("Subject is required");
        }
        if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
            throw new InvalidRequestException("Farmer question is required");
        }

        Animal animal = null;
        if (request.getAnimalId() != null) {
            animal = animalRepository.findById(request.getAnimalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + request.getAnimalId()));
            if (!securityUtils.isAdmin(currentUser) && (animal.getFarm() == null ||
                    !animal.getFarm().getOwner().getId().equals(currentUser.getId()))) {
                throw new ResourceOwnershipException("You do not own the selected animal");
            }
        }

        FeedSample feedSample = null;
        if (request.getFeedSampleId() != null) {
            feedSample = feedSampleRepository.findById(request.getFeedSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + request.getFeedSampleId()));
            if (!securityUtils.isAdmin(currentUser) && (feedSample.getFarm() == null ||
                    !feedSample.getFarm().getOwner().getId().equals(currentUser.getId()))) {
                throw new ResourceOwnershipException("You do not own the selected feed sample");
            }
        }

        SilageSample silageSample = null;
        if (request.getSilageSampleId() != null) {
            silageSample = silageSampleRepository.findById(request.getSilageSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + request.getSilageSampleId()));
            if (!securityUtils.isAdmin(currentUser) && (silageSample.getFarm() == null ||
                    !silageSample.getFarm().getOwner().getId().equals(currentUser.getId()))) {
                throw new ResourceOwnershipException("You do not own the selected silage sample");
            }
        }

        Consultation consultation = new Consultation();
        consultation.setFarmer(currentUser);
        consultation.setRequestDate(LocalDate.now());
        consultation.setSubject(request.getSubject().trim());
        consultation.setFarmerMessage(request.getQuestion().trim());
        consultation.setAdditionalContext(request.getAdditionalContext() != null ? request.getAdditionalContext().trim() : null);
        consultation.setStatus(ConsultationStatus.REQUESTED);
        consultation.setAnimal(animal);
        consultation.setFeedSample(feedSample);
        consultation.setSilageSample(silageSample);

        Consultation saved = consultationRepository.save(consultation);
        return mapToSummaryResponse(saved);
    }

    // ── Get All Consultations ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConsultationResponse> getAllConsultations() {
        User currentUser = securityUtils.getCurrentUser();

        if (securityUtils.isAdmin(currentUser)) {
            return consultationRepository.findAllByOrderByCreatedAtDesc()
                    .stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
        }

        if (currentUser.getRole() == Role.EXPERT) {
            Expert expert = expertRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found for user: " + currentUser.getEmail()));
            return consultationRepository.findAvailableOrAssignedToExpert(expert.getId(), ConsultationStatus.REQUESTED)
                    .stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
        }

        // FARMER role
        return consultationRepository.findByFarmerIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(this::mapToSummaryResponse).collect(Collectors.toList());
    }

    // ── Get Consultation By ID ───────────────────────────────────

    @Transactional(readOnly = true)
    public ConsultationResponse getConsultationById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        // Enforce ownership / authorization
        if (!securityUtils.isAdmin(currentUser)) {
            if (currentUser.getRole() == Role.FARMER) {
                if (!consultation.getFarmer().getId().equals(currentUser.getId())) {
                    throw new ResourceOwnershipException("You are not authorized to view another farmer's consultation");
                }
            } else if (currentUser.getRole() == Role.EXPERT) {
                Expert expert = expertRepository.findByUserId(currentUser.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found for user: " + currentUser.getEmail()));
                if (consultation.getExpert() != null && !consultation.getExpert().getId().equals(expert.getId())) {
                    throw new ResourceOwnershipException("You are not authorized to view a consultation assigned to another expert");
                }
            }
        }

        return mapToDetailResponse(consultation);
    }

    // ── Accept Consultation (Expert) ─────────────────────────────

    public ConsultationResponse acceptConsultation(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        if (currentUser.getRole() != Role.EXPERT && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("Only an expert can accept a consultation");
        }

        Expert expert = expertRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found for user: " + currentUser.getEmail()));

        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        if (consultation.getStatus() != ConsultationStatus.REQUESTED) {
            throw new InvalidRequestException("Consultation cannot be accepted in status: " + consultation.getStatus());
        }

        if (consultation.getExpert() != null && !consultation.getExpert().getId().equals(expert.getId())) {
            throw new InvalidRequestException("Consultation is already assigned to another expert");
        }

        consultation.setExpert(expert);
        consultation.setStatus(ConsultationStatus.ACCEPTED);

        Consultation updated = consultationRepository.save(consultation);
        return mapToDetailResponse(updated);
    }

    // ── Move to IN_REVIEW (Expert) ────────────────────────────────

    public ConsultationResponse startReview(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        if (currentUser.getRole() != Role.EXPERT && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("Only an expert can review a consultation");
        }

        Expert expert = expertRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found for user: " + currentUser.getEmail()));

        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        if (consultation.getExpert() == null) {
            consultation.setExpert(expert);
        } else if (!consultation.getExpert().getId().equals(expert.getId()) && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("You are not the assigned expert for this consultation");
        }

        if (consultation.getStatus() != ConsultationStatus.REQUESTED && consultation.getStatus() != ConsultationStatus.ACCEPTED && consultation.getStatus() != ConsultationStatus.IN_REVIEW) {
            throw new InvalidRequestException("Cannot move consultation to IN_REVIEW from status: " + consultation.getStatus());
        }

        consultation.setStatus(ConsultationStatus.IN_REVIEW);
        Consultation updated = consultationRepository.save(consultation);
        return mapToDetailResponse(updated);
    }

    // ── Respond to Consultation (Expert) ─────────────────────────

    public ConsultationResponse respondConsultation(Long id, ExpertRecommendationRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        if (currentUser.getRole() != Role.EXPERT && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("Only an expert can respond to a consultation");
        }

        if (request.getRecommendation() == null || request.getRecommendation().trim().isEmpty()) {
            throw new InvalidRequestException("Recommendation is required");
        }

        Expert expert = expertRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found for user: " + currentUser.getEmail()));

        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        if (consultation.getExpert() == null) {
            consultation.setExpert(expert);
        } else if (!consultation.getExpert().getId().equals(expert.getId()) && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("You are not the assigned expert for this consultation");
        }

        if (consultation.getStatus() != ConsultationStatus.IN_REVIEW && consultation.getStatus() != ConsultationStatus.ACCEPTED) {
            throw new InvalidRequestException("Cannot respond to consultation in status: " + consultation.getStatus());
        }

        consultation.setExpertResponse(request.getRecommendation().trim());
        consultation.setExpertNotes(request.getExpertNotes() != null ? request.getExpertNotes().trim() : null);
        consultation.setResponseDate(LocalDate.now());
        consultation.setStatus(ConsultationStatus.RESPONDED);

        Consultation updated = consultationRepository.save(consultation);
        return mapToDetailResponse(updated);
    }

    // ── Complete Consultation (Expert) ───────────────────────────

    public ConsultationResponse completeConsultation(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        if (currentUser.getRole() != Role.EXPERT && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("Only an expert can complete a consultation");
        }

        Expert expert = expertRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found for user: " + currentUser.getEmail()));

        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        if (consultation.getExpert() != null && !consultation.getExpert().getId().equals(expert.getId()) && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("You are not the assigned expert for this consultation");
        }

        if (consultation.getStatus() != ConsultationStatus.RESPONDED) {
            throw new InvalidRequestException("Consultation must be responded before it can be marked completed. Current status: " + consultation.getStatus());
        }

        consultation.setStatus(ConsultationStatus.COMPLETED);
        consultation.setCompletedAt(LocalDateTime.now());

        Consultation updated = consultationRepository.save(consultation);
        return mapToDetailResponse(updated);
    }

    // ── Cancel Consultation (Farmer) ──────────────────────────────

    public ConsultationResponse cancelConsultation(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        if (!consultation.getFarmer().getId().equals(currentUser.getId()) && !securityUtils.isAdmin(currentUser)) {
            throw new ResourceOwnershipException("You can only cancel your own consultation");
        }

        if (consultation.getStatus() != ConsultationStatus.REQUESTED && consultation.getStatus() != ConsultationStatus.ACCEPTED) {
            throw new InvalidRequestException("Consultation cannot be cancelled in status: " + consultation.getStatus());
        }

        consultation.setStatus(ConsultationStatus.CANCELLED);
        Consultation updated = consultationRepository.save(consultation);
        return mapToDetailResponse(updated);
    }

    // ── DTO Mapping Helpers ───────────────────────────────────────

    private ConsultationResponse mapToSummaryResponse(Consultation c) {
        return ConsultationResponse.builder()
                .id(c.getId())
                .subject(c.getSubject())
                .question(c.getFarmerMessage())
                .additionalContext(c.getAdditionalContext())
                .status(c.getStatus())
                .requestDate(c.getRequestDate())
                .responseDate(c.getResponseDate())
                .completedAt(c.getCompletedAt())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .farmerId(c.getFarmer() != null ? c.getFarmer().getId() : null)
                .farmerName(c.getFarmer() != null ? c.getFarmer().getUsername() : null)
                .farmerEmail(c.getFarmer() != null ? c.getFarmer().getEmail() : null)
                .farmerPhone(c.getFarmer() != null ? c.getFarmer().getPhone() : null)
                .expertId(c.getExpert() != null ? c.getExpert().getId() : null)
                .expertName(c.getExpert() != null && c.getExpert().getUser() != null ? c.getExpert().getUser().getUsername() : null)
                .expertEmail(c.getExpert() != null && c.getExpert().getUser() != null ? c.getExpert().getUser().getEmail() : null)
                .expertPhone(c.getExpert() != null && c.getExpert().getUser() != null ? c.getExpert().getUser().getPhone() : null)
                .expertQualification(c.getExpert() != null ? c.getExpert().getQualification() : null)
                .expertSpecialization(c.getExpert() != null ? c.getExpert().getSpecialization() : null)
                .expertExperienceYears(c.getExpert() != null ? c.getExpert().getExperienceYears() : null)
                .expertLicenseNumber(c.getExpert() != null ? c.getExpert().getLicenseNumber() : null)
                .expertRecommendation(c.getExpertResponse())
                .expertNotes(c.getExpertNotes())
                .animalId(c.getAnimal() != null ? c.getAnimal().getId() : null)
                .animalTag(c.getAnimal() != null ? c.getAnimal().getAnimalTag() : null)
                .feedSampleId(c.getFeedSample() != null ? c.getFeedSample().getId() : null)
                .feedSampleCode(c.getFeedSample() != null ? c.getFeedSample().getSampleCode() : null)
                .silageSampleId(c.getSilageSample() != null ? c.getSilageSample().getId() : null)
                .silageSampleCode(c.getSilageSample() != null ? c.getSilageSample().getSampleCode() : null)
                .build();
    }

    private ConsultationResponse mapToDetailResponse(Consultation c) {
        ConsultationResponse resp = mapToSummaryResponse(c);

        // Populate Animal details if linked
        if (c.getAnimal() != null) {
            Animal a = c.getAnimal();
            String ageStr = "Not Available";
            if (a.getDateOfBirth() != null) {
                Period p = Period.between(a.getDateOfBirth(), LocalDate.now());
                ageStr = p.getYears() + " yrs " + p.getMonths() + " mos";
            }

            resp.setAnimal(ConsultationResponse.AnimalSummaryDto.builder()
                    .id(a.getId())
                    .animalTag(a.getAnimalTag())
                    .name(a.getName() != null ? a.getName() : "Not Available")
                    .breed(a.getBreed() != null ? a.getBreed() : "Not Available")
                    .species("Cattle")
                    .gender(a.getGender() != null ? a.getGender().name() : "Not Available")
                    .dateOfBirth(a.getDateOfBirth())
                    .age(ageStr)
                    .weight(a.getWeight())
                    .lactationStage(a.getLactationStage() != null ? a.getLactationStage().name() : "Not Available")
                    .daysInMilk(a.getDaysInMilk())
                    .milkProductionPerDay(a.getMilkProductionPerDay())
                    .pregnancyStatus(a.getPregnancyStatus() != null ? a.getPregnancyStatus().name() : "Not Available")
                    .feedIntakeStatus(a.getFeedIntakeStatus() != null ? a.getFeedIntakeStatus().name() : "Not Available")
                    .build());

            // Health screenings for this animal
            List<HealthRisk> risks = healthRiskRepository.findByAnimalIdOrderByDetectedDateDesc(a.getId());
            if (risks != null && !risks.isEmpty()) {
                resp.setHealthRisks(risks.stream().map(r -> ConsultationResponse.HealthRiskSummaryDto.builder()
                        .id(r.getId())
                        .riskType(r.getRiskType())
                        .riskLevel(r.getRiskLevel() != null ? r.getRiskLevel().name() : "Not Available")
                        .description(r.getDescription())
                        .detectedDate(r.getDetectedDate())
                        .source(r.getSource() != null ? r.getSource().name() : "Not Available")
                        .recommendation(r.getRecommendation())
                        .build()).collect(Collectors.toList()));
            } else {
                resp.setHealthRisks(Collections.emptyList());
            }

            // Advisories for this animal
            List<Advisory> advList = advisoryRepository.findByAnimalId(a.getId());
            if (advList != null && !advList.isEmpty()) {
                resp.setAdvisories(advList.stream().map(ad -> ConsultationResponse.AdvisorySummaryDto.builder()
                        .id(ad.getId())
                        .title(ad.getTitle())
                        .message(ad.getMessage())
                        .advisoryType(ad.getAdvisoryType() != null ? ad.getAdvisoryType().name() : "Not Available")
                        .priority(ad.getPriority() != null ? ad.getPriority().name() : "Not Available")
                        .isRead(ad.getIsRead())
                        .createdAt(ad.getCreatedAt())
                        .build()).collect(Collectors.toList()));
            } else {
                resp.setAdvisories(Collections.emptyList());
            }
        } else {
            resp.setHealthRisks(Collections.emptyList());
            resp.setAdvisories(Collections.emptyList());
        }

        // Populate Feed Sample details if linked
        if (c.getFeedSample() != null) {
            FeedSample fs = c.getFeedSample();
            List<TestResult> trList = testResultRepository.findByFeedSampleId(fs.getId());
            List<ConsultationResponse.TestResultSummaryDto> testDtos = trList != null ? trList.stream().map(this::mapTestResult).collect(Collectors.toList()) : Collections.emptyList();

            String latestQual = trList != null && !trList.isEmpty() && trList.get(trList.size() - 1).getOverallQuality() != null
                    ? trList.get(trList.size() - 1).getOverallQuality().name() : "Not Available";

            List<SampleImage> imgList = sampleImageRepository.findByFeedSampleIdOrderByCreatedAtDesc(fs.getId());
            List<ConsultationResponse.SampleImageSummaryDto> imgDtos = imgList != null ? imgList.stream().map(this::mapSampleImage).collect(Collectors.toList()) : Collections.emptyList();

            resp.setFeedSample(ConsultationResponse.FeedSampleSummaryDto.builder()
                    .id(fs.getId())
                    .sampleCode(fs.getSampleCode())
                    .feedType(fs.getFeedType() != null ? fs.getFeedType().name() : "Not Available")
                    .source(fs.getSource() != null ? fs.getSource() : "Not Available")
                    .sampleDate(fs.getSampleDate())
                    .notes(fs.getNotes())
                    .testResults(testDtos)
                    .latestQuality(latestQual)
                    .images(imgDtos)
                    .build());
        }

        // Populate Silage Sample details if linked
        if (c.getSilageSample() != null) {
            SilageSample ss = c.getSilageSample();
            List<TestResult> trList = testResultRepository.findBySilageSampleId(ss.getId());
            List<ConsultationResponse.TestResultSummaryDto> testDtos = trList != null ? trList.stream().map(this::mapTestResult).collect(Collectors.toList()) : Collections.emptyList();

            String latestQual = trList != null && !trList.isEmpty() && trList.get(trList.size() - 1).getOverallQuality() != null
                    ? trList.get(trList.size() - 1).getOverallQuality().name() : "Not Available";

            List<SampleImage> imgList = sampleImageRepository.findBySilageSampleIdOrderByCreatedAtDesc(ss.getId());
            List<ConsultationResponse.SampleImageSummaryDto> imgDtos = imgList != null ? imgList.stream().map(this::mapSampleImage).collect(Collectors.toList()) : Collections.emptyList();

            resp.setSilageSample(ConsultationResponse.SilageSampleSummaryDto.builder()
                    .id(ss.getId())
                    .sampleCode(ss.getSampleCode())
                    .silageType(ss.getSilageType() != null ? ss.getSilageType().name() : "Not Available")
                    .source(ss.getSource() != null ? ss.getSource() : "Not Available")
                    .sampleDate(ss.getSampleDate())
                    .notes(ss.getNotes())
                    .testResults(testDtos)
                    .latestQuality(latestQual)
                    .images(imgDtos)
                    .build());
        }

        return resp;
    }

    private ConsultationResponse.TestResultSummaryDto mapTestResult(TestResult tr) {
        return ConsultationResponse.TestResultSummaryDto.builder()
                .id(tr.getId())
                .testDate(tr.getTestDate())
                .analysisSource(tr.getAnalysisSource() != null ? tr.getAnalysisSource().name() : "Not Available")
                .overallQuality(tr.getOverallQuality() != null ? tr.getOverallQuality().name() : "Not Available")
                .moisture(tr.getMoisture())
                .crudeProtein(tr.getCrudeProtein())
                .fiber(tr.getFiber())
                .ph(tr.getPh())
                .mouldDetected(tr.getMouldDetected())
                .spoilageDetected(tr.getSpoilageDetected())
                .confidenceScore(tr.getConfidenceScore())
                .build();
    }

    private ConsultationResponse.SampleImageSummaryDto mapSampleImage(SampleImage img) {
        return ConsultationResponse.SampleImageSummaryDto.builder()
                .id(img.getId())
                .originalFilename(img.getOriginalFilename())
                .storedFilename(img.getStoredFilename())
                .fileReference(img.getFileReference())
                .contentType(img.getContentType())
                .fileSize(img.getFileSize())
                .caption(img.getCaption())
                .createdAt(img.getCreatedAt())
                .build();
    }
}
