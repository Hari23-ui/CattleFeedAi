package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.FeedSampleRequest;
import com.cattlefeedai.api.dto.FeedSampleResponse;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.DuplicateSampleCodeException;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.TestResultRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling FeedSample business logic and hierarchical ownership enforcement.
 */
@Service
@Transactional
public class FeedSampleService {

    private final FeedSampleRepository feedSampleRepository;
    private final FarmRepository farmRepository;
    private final AnimalRepository animalRepository;
    private final TestResultRepository testResultRepository;
    private final SecurityUtils securityUtils;

    public FeedSampleService(
            FeedSampleRepository feedSampleRepository,
            FarmRepository farmRepository,
            AnimalRepository animalRepository,
            TestResultRepository testResultRepository,
            SecurityUtils securityUtils
    ) {
        this.feedSampleRepository = feedSampleRepository;
        this.farmRepository = farmRepository;
        this.animalRepository = animalRepository;
        this.testResultRepository = testResultRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a new FeedSample under the specified farm.
     * Verifies that the authenticated farmer owns the farm.
     * If animalId is provided, verifies that the animal exists and belongs to that farm.
     */
    public FeedSampleResponse createFeedSample(FeedSampleRequest request) {
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

        if (feedSampleRepository.existsBySampleCode(request.getSampleCode())) {
            throw new DuplicateSampleCodeException(
                    "Feed sample with code '" + request.getSampleCode() + "' already exists");
        }

        FeedSample feedSample = new FeedSample();
        feedSample.setFarm(farm);
        feedSample.setAnimal(animal);
        feedSample.setSampleCode(request.getSampleCode());
        feedSample.setFeedType(request.getFeedType());
        feedSample.setSampleDate(request.getSampleDate());
        feedSample.setSource(request.getSource());
        feedSample.setNotes(request.getNotes());

        FeedSample saved = feedSampleRepository.save(feedSample);
        return FeedSampleResponse.fromEntity(saved);
    }

    /**
     * Retrieve feed samples accessible to the authenticated user.
     * Optionally filtered by farmId or animalId.
     */
    @Transactional(readOnly = true)
    public List<FeedSampleResponse> getAllFeedSamples(Long farmId, Long animalId) {
        User currentUser = securityUtils.getCurrentUser();

        List<FeedSample> samples;

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
                samples = feedSampleRepository.findByAnimalId(animalId);
            } else {
                samples = feedSampleRepository.findByFarmId(farmId);
            }
        } else if (animalId != null) {
            Animal animal = animalRepository.findById(animalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + animalId));
            validateFarmOwnership(animal.getFarm(), currentUser);
            samples = feedSampleRepository.findByAnimalId(animalId);
        } else {
            if (securityUtils.isAdmin(currentUser)) {
                samples = feedSampleRepository.findAll();
            } else {
                samples = feedSampleRepository.findByFarmOwnerId(currentUser.getId());
            }
        }

        return samples.stream()
                .map(FeedSampleResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve a FeedSample by ID.
     * Verifies ownership: User -> Farm -> FeedSample.
     */
    @Transactional(readOnly = true)
    public FeedSampleResponse getFeedSampleById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        FeedSample sample = feedSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + id));

        validateFarmOwnership(sample.getFarm(), currentUser);

        return FeedSampleResponse.fromEntity(sample);
    }

    /**
     * Update an existing FeedSample.
     */
    public FeedSampleResponse updateFeedSample(Long id, FeedSampleRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        FeedSample sample = feedSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + id));

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
            if (feedSampleRepository.existsBySampleCode(request.getSampleCode())) {
                throw new DuplicateSampleCodeException(
                        "Feed sample with code '" + request.getSampleCode() + "' already exists");
            }
            sample.setSampleCode(request.getSampleCode());
        }

        sample.setFeedType(request.getFeedType());
        sample.setSampleDate(request.getSampleDate());
        sample.setSource(request.getSource());
        sample.setNotes(request.getNotes());

        FeedSample updated = feedSampleRepository.save(sample);
        return FeedSampleResponse.fromEntity(updated);
    }

    /**
     * Delete a FeedSample and its associated TestResults.
     */
    public void deleteFeedSample(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        FeedSample sample = feedSampleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + id));

        validateFarmOwnership(sample.getFarm(), currentUser);

        List<TestResult> testResults = testResultRepository.findByFeedSampleId(id);
        if (!testResults.isEmpty()) {
            testResultRepository.deleteAll(testResults);
        }

        feedSampleRepository.delete(sample);
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
