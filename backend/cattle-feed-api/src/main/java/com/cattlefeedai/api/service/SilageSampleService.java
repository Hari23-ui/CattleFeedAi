package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.SilageSampleRequest;
import com.cattlefeedai.api.dto.SilageSampleResponse;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.DuplicateSampleCodeException;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.repository.TestResultRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling SilageSample business logic and hierarchical ownership enforcement.
 */
@Service
@Transactional
public class SilageSampleService {

    private final SilageSampleRepository silageSampleRepository;
    private final FarmRepository farmRepository;
    private final AnimalRepository animalRepository;
    private final TestResultRepository testResultRepository;
    private final SecurityUtils securityUtils;

    public SilageSampleService(
            SilageSampleRepository silageSampleRepository,
            FarmRepository farmRepository,
            AnimalRepository animalRepository,
            TestResultRepository testResultRepository,
            SecurityUtils securityUtils
    ) {
        this.silageSampleRepository = silageSampleRepository;
        this.farmRepository = farmRepository;
        this.animalRepository = animalRepository;
        this.testResultRepository = testResultRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a new SilageSample under the specified farm.
     * Verifies that the authenticated farmer owns the farm.
     * If animalId is provided, verifies that the animal exists and belongs to that farm.
     */
    public SilageSampleResponse createSilageSample(SilageSampleRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Farm not found with id: " + request.getFarmId()));

        validateFarmOwnership(farm, currentUser);

        Animal animal = null;
        if (request.getAnimalId() != null) {
            animal = animalRepository.findById(request.getAnimalId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Animal not found with id: " + request.getAnimalId()));
            if (!animal.getFarm().getId().equals(farm.getId())) {
                throw new InvalidRequestException(
                        "Animal with id " + request.getAnimalId() + " does not belong to farm with id " + farm.getId());
            }
        }

        if (silageSampleRepository.existsBySampleCode(request.getSampleCode())) {
            throw new DuplicateSampleCodeException(
                    "Silage sample with code '" + request.getSampleCode() + "' already exists");
        }

        SilageSample silageSample = new SilageSample();
        silageSample.setFarm(farm);
        silageSample.setAnimal(animal);
        silageSample.setSampleCode(request.getSampleCode());
        silageSample.setSilageType(request.getSilageType());
        silageSample.setSampleDate(request.getSampleDate());
        silageSample.setSource(request.getSource());
        silageSample.setNotes(request.getNotes());

        SilageSample saved = silageSampleRepository.save(silageSample);
        return SilageSampleResponse.fromEntity(saved);
    }

    /**
     * Retrieve silage samples accessible to the authenticated user.
     * Optionally filtered by farmId or animalId.
     */
    @Transactional(readOnly = true)
    public List<SilageSampleResponse> getAllSilageSamples(Long farmId, Long animalId) {
        User currentUser = securityUtils.getCurrentUser();

        List<SilageSample> samples;

        if (farmId != null) {
            Farm farm = farmRepository.findById(farmId)
                    .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + farmId));
            validateFarmOwnership(farm, currentUser);

            if (animalId != null) {
                Animal animal = animalRepository.findById(animalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));
                if (!animal.getFarm().getId().equals(farmId)) {
                    throw new InvalidRequestException(
                            "Animal with id " + animalId + " does not belong to farm with id " + farmId);
                }
                samples = silageSampleRepository.findByAnimalId(animalId);
            } else {
                samples = silageSampleRepository.findByFarmId(farmId);
            }
        } else if (animalId != null) {
            Animal animal = animalRepository.findById(animalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));
            validateFarmOwnership(animal.getFarm(), currentUser);
            samples = silageSampleRepository.findByAnimalId(animalId);
        } else {
            if (securityUtils.isAdmin(currentUser)) {
                samples = silageSampleRepository.findAll();
            } else {
                samples = silageSampleRepository.findByFarmOwnerId(currentUser.getId());
            }
        }

        return samples.stream()
                .map(SilageSampleResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve a SilageSample by ID.
     * Verifies ownership: User -> Farm -> SilageSample.
     */
    @Transactional(readOnly = true)
    public SilageSampleResponse getSilageSampleById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        SilageSample sample = silageSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + id));

        validateFarmOwnership(sample.getFarm(), currentUser);

        return SilageSampleResponse.fromEntity(sample);
    }

    /**
     * Update an existing SilageSample.
     */
    public SilageSampleResponse updateSilageSample(Long id, SilageSampleRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        SilageSample sample = silageSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + id));

        validateFarmOwnership(sample.getFarm(), currentUser);

        Farm targetFarm = sample.getFarm();
        if (request.getFarmId() != null && !request.getFarmId().equals(targetFarm.getId())) {
            Farm newFarm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Farm not found with id: " + request.getFarmId()));
            validateFarmOwnership(newFarm, currentUser);
            targetFarm = newFarm;
            sample.setFarm(targetFarm);
        }

        if (request.getAnimalId() != null) {
            Animal animal = animalRepository.findById(request.getAnimalId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Animal not found with id: " + request.getAnimalId()));
            if (!animal.getFarm().getId().equals(targetFarm.getId())) {
                throw new InvalidRequestException(
                        "Animal with id " + request.getAnimalId() + " does not belong to farm with id " + targetFarm.getId());
            }
            sample.setAnimal(animal);
        } else {
            sample.setAnimal(null);
        }

        if (!sample.getSampleCode().equals(request.getSampleCode())) {
            if (silageSampleRepository.existsBySampleCode(request.getSampleCode())) {
                throw new DuplicateSampleCodeException(
                        "Silage sample with code '" + request.getSampleCode() + "' already exists");
            }
            sample.setSampleCode(request.getSampleCode());
        }

        sample.setSilageType(request.getSilageType());
        sample.setSampleDate(request.getSampleDate());
        sample.setSource(request.getSource());
        sample.setNotes(request.getNotes());

        SilageSample updated = silageSampleRepository.save(sample);
        return SilageSampleResponse.fromEntity(updated);
    }

    /**
     * Delete a SilageSample and its associated TestResults.
     */
    public void deleteSilageSample(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        SilageSample sample = silageSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + id));

        validateFarmOwnership(sample.getFarm(), currentUser);

        List<TestResult> testResults = testResultRepository.findBySilageSampleId(id);
        if (!testResults.isEmpty()) {
            testResultRepository.deleteAll(testResults);
        }

        silageSampleRepository.delete(sample);
    }

    /**
     * Helper to validate that caller owns the farm or is ADMIN.
     */
    private void validateFarmOwnership(Farm farm, User user) {
        if (!securityUtils.isAdmin(user) && !farm.getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException(
                    "Access denied: You do not have permission to access resources on this farm");
        }
    }
}
