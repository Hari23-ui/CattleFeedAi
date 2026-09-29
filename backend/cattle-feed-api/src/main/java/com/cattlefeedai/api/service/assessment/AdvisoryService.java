package com.cattlefeedai.api.service.assessment;

import com.cattlefeedai.api.dto.assessment.AdvisoryResponse;
import com.cattlefeedai.api.dto.assessment.RiskIndicatorDto;
import com.cattlefeedai.api.entity.Advisory;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.AdvisoryType;
import com.cattlefeedai.api.entity.enums.Priority;
import com.cattlefeedai.api.entity.enums.Severity;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AdvisoryRepository;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service managing rule-derived advisory generation, persistence, and querying.
 */
@Service
@Transactional
public class AdvisoryService {

    private final AdvisoryRepository advisoryRepository;
    private final AnimalRepository animalRepository;
    private final SecurityUtils securityUtils;
    private final com.cattlefeedai.api.service.AlertService alertService;

    public AdvisoryService(
            AdvisoryRepository advisoryRepository,
            AnimalRepository animalRepository,
            SecurityUtils securityUtils
    ) {
        this(advisoryRepository, animalRepository, securityUtils, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AdvisoryService(
            AdvisoryRepository advisoryRepository,
            AnimalRepository animalRepository,
            SecurityUtils securityUtils,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.cattlefeedai.api.service.AlertService alertService
    ) {
        this.advisoryRepository = advisoryRepository;
        this.animalRepository = animalRepository;
        this.securityUtils = securityUtils;
        this.alertService = alertService;
    }

    /**
     * Generate advisories from identified risk indicators.
     * If an animal is associated, persists the advisory to the database.
     */
    public List<AdvisoryResponse> generateAdvisories(Animal animal, List<RiskIndicatorDto> risks, Long relatedTestResultId) {
        List<AdvisoryResponse> responses = new ArrayList<>();

        if (risks == null || risks.isEmpty()) {
            return responses;
        }

        for (RiskIndicatorDto risk : risks) {
            Priority priority = mapSeverityToPriority(risk.getSeverity());
            AdvisoryType type = mapCategoryToType(risk.getCategory());

            Advisory savedAdvisory = null;
            if (animal != null) {
                Advisory advisory = new Advisory();
                advisory.setAnimal(animal);
                advisory.setTitle(risk.getRiskTitle());
                advisory.setMessage(risk.getDescription());
                advisory.setAdvisoryType(type);
                advisory.setPriority(priority);
                advisory.setIsRead(false);
                savedAdvisory = advisoryRepository.save(advisory);

                if (priority == Priority.HIGH && alertService != null && animal.getFarm() != null && animal.getFarm().getOwner() != null) {
                    alertService.createAlert(
                            animal.getFarm().getOwner(),
                            "Urgent Advisory: " + risk.getRiskTitle(),
                            risk.getDescription(),
                            alertService.mapAdvisoryCategoryToAlertType(risk.getCategory()),
                            Severity.HIGH,
                            "ADVISORY",
                            savedAdvisory.getId()
                    );
                }
            }

            AdvisoryResponse resp = AdvisoryResponse.builder()
                    .id(savedAdvisory != null ? savedAdvisory.getId() : null)
                    .animalId(animal != null ? animal.getId() : null)
                    .animalTag(animal != null ? animal.getAnimalTag() : null)
                    .category(risk.getCategory())
                    .priority(priority)
                    .title(risk.getRiskTitle())
                    .message(risk.getDescription())
                    .recommendedAction(risk.getMitigationRecommendation())
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            responses.add(resp);
        }

        return responses;
    }

    /**
     * Retrieve advisories accessible to the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<AdvisoryResponse> getAdvisories(Long animalId, Boolean isRead) {
        User currentUser = securityUtils.getCurrentUser();

        List<Advisory> advisories;
        if (animalId != null) {
            Animal animal = animalRepository.findById(animalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));

            if (!securityUtils.isAdmin(currentUser) && !animal.getFarm().getOwner().getId().equals(currentUser.getId())) {
                throw new ResourceOwnershipException("Access denied: You do not have permission to view advisories for this animal");
            }

            if (Boolean.TRUE.equals(isRead)) {
                advisories = advisoryRepository.findByAnimalId(animalId).stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsRead()))
                        .toList();
            } else if (Boolean.FALSE.equals(isRead)) {
                advisories = advisoryRepository.findByAnimalIdAndIsReadFalse(animalId);
            } else {
                advisories = advisoryRepository.findByAnimalId(animalId);
            }
        } else {
            if (securityUtils.isAdmin(currentUser)) {
                advisories = advisoryRepository.findAll();
            } else {
                if (isRead != null) {
                    advisories = advisoryRepository.findByAnimalFarmOwnerIdAndIsRead(currentUser.getId(), isRead);
                } else {
                    advisories = advisoryRepository.findByAnimalFarmOwnerId(currentUser.getId());
                }
            }
        }

        return advisories.stream()
                .map(a -> AdvisoryResponse.fromEntity(a, null, null))
                .toList();
    }

    /**
     * Retrieve a specific advisory by ID.
     */
    @Transactional(readOnly = true)
    public AdvisoryResponse getAdvisoryById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Advisory advisory = advisoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Advisory not found with id: " + id));

        if (!securityUtils.isAdmin(currentUser) && !advisory.getAnimal().getFarm().getOwner().getId().equals(currentUser.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to view this advisory");
        }

        return AdvisoryResponse.fromEntity(advisory, null, null);
    }

    /**
     * Mark an advisory as read.
     */
    public AdvisoryResponse markAsRead(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Advisory advisory = advisoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Advisory not found with id: " + id));

        if (!securityUtils.isAdmin(currentUser) && !advisory.getAnimal().getFarm().getOwner().getId().equals(currentUser.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to modify this advisory");
        }

        advisory.setIsRead(true);
        Advisory saved = advisoryRepository.save(advisory);
        return AdvisoryResponse.fromEntity(saved, null, null);
    }

    private Priority mapSeverityToPriority(Severity severity) {
        if (severity == null) {
            return Priority.LOW;
        }
        return switch (severity) {
            case CRITICAL, HIGH -> Priority.HIGH;
            case WARNING -> Priority.MEDIUM;
            case NORMAL, INFO -> Priority.LOW;
        };
    }

    private AdvisoryType mapCategoryToType(AdvisoryCategory category) {
        if (category == null) {
            return AdvisoryType.GENERAL;
        }
        return switch (category) {
            case FEED -> AdvisoryType.FEED;
            case SILAGE -> AdvisoryType.SILAGE;
            case STORAGE -> AdvisoryType.STORAGE;
            case NUTRITION -> AdvisoryType.NUTRITION;
            case CONTAMINATION -> AdvisoryType.FEED;
            case HEALTH_SCREENING -> AdvisoryType.HEALTH_RISK;
            case EXPERT_CONSULTATION -> AdvisoryType.GENERAL;
        };
    }
}
