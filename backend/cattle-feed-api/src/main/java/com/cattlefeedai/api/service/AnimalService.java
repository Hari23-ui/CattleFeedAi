package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.AnimalRequest;
import com.cattlefeedai.api.dto.AnimalResponse;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.DuplicateAnimalTagException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service handling Animal management business logic and ownership enforcement.
 */
@Service
@Transactional
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final FarmRepository farmRepository;
    private final SecurityUtils securityUtils;

    public AnimalService(
            AnimalRepository animalRepository,
            FarmRepository farmRepository,
            SecurityUtils securityUtils
    ) {
        this.animalRepository = animalRepository;
        this.farmRepository = farmRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a new animal under the specified farm.
     * Verifies that the authenticated farmer owns the target farm.
     * Validates that animalTag is unique within the target farm.
     */
    public AnimalResponse createAnimal(AnimalRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Farm not found with id: " + request.getFarmId()));

        validateFarmOwnership(farm, currentUser, "You cannot add an animal to a farm you do not own");

        if (animalRepository.existsByAnimalTagAndFarmId(request.getAnimalTag(), farm.getId())) {
            throw new DuplicateAnimalTagException(
                    "Animal with tag '" + request.getAnimalTag() + "' already exists in this farm");
        }

        Animal animal = new Animal();
        animal.setFarm(farm);
        animal.setAnimalTag(request.getAnimalTag());
        animal.setName(request.getName());
        animal.setBreed(request.getBreed());
        animal.setGender(request.getGender());
        animal.setDateOfBirth(request.getDateOfBirth());
        animal.setWeight(request.getWeight());
        animal.setLactationStage(request.getLactationStage());
        animal.setDaysInMilk(request.getDaysInMilk());
        animal.setMilkProductionPerDay(request.getMilkProductionPerDay());
        animal.setPregnancyStatus(request.getPregnancyStatus());
        animal.setFeedIntakeStatus(request.getFeedIntakeStatus());

        Animal savedAnimal = animalRepository.save(animal);
        return AnimalResponse.fromEntity(savedAnimal);
    }

    /**
     * Retrieve animals accessible to the authenticated user.
     * If farmId is specified, returns animals belonging to that farm (verifying ownership).
     * If farmId is omitted, returns all animals owned across the user's farms (or all animals for ADMIN).
     */
    @Transactional(readOnly = true)
    public List<AnimalResponse> getAllAnimals(Long farmId) {
        User currentUser = securityUtils.getCurrentUser();

        List<Animal> animals;
        if (farmId != null) {
            Farm farm = farmRepository.findById(farmId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Farm not found with id: " + farmId));

            validateFarmOwnership(farm, currentUser, "You do not have permission to access animals in this farm");
            animals = animalRepository.findByFarmId(farmId);
        } else {
            if (securityUtils.isAdmin(currentUser)) {
                animals = animalRepository.findAll();
            } else {
                animals = animalRepository.findByFarmOwnerId(currentUser.getId());
            }
        }

        return animals.stream()
                .map(AnimalResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve an animal by its ID.
     * Verifies that the animal exists and belongs to a farm owned by the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public AnimalResponse getAnimalById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + id));

        validateAnimalOwnership(animal, currentUser);

        return AnimalResponse.fromEntity(animal);
    }

    /**
     * Update an existing animal.
     * Verifies ownership and unique tag constraints within the farm.
     */
    public AnimalResponse updateAnimal(Long id, AnimalRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + id));

        validateAnimalOwnership(animal, currentUser);

        Farm targetFarm = animal.getFarm();
        if (request.getFarmId() != null && !request.getFarmId().equals(targetFarm.getId())) {
            Farm newFarm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Farm not found with id: " + request.getFarmId()));
            validateFarmOwnership(newFarm, currentUser, "You cannot move an animal to a farm you do not own");
            targetFarm = newFarm;
            animal.setFarm(targetFarm);
        }

        // Check animalTag uniqueness if tag or farm changed
        Optional<Animal> existing = animalRepository.findByAnimalTagAndFarmId(request.getAnimalTag(), targetFarm.getId());
        if (existing.isPresent() && !existing.get().getId().equals(animal.getId())) {
            throw new DuplicateAnimalTagException(
                    "Animal with tag '" + request.getAnimalTag() + "' already exists in this farm");
        }

        animal.setAnimalTag(request.getAnimalTag());
        animal.setName(request.getName());
        animal.setBreed(request.getBreed());
        animal.setGender(request.getGender());
        animal.setDateOfBirth(request.getDateOfBirth());
        animal.setWeight(request.getWeight());
        animal.setLactationStage(request.getLactationStage());
        animal.setDaysInMilk(request.getDaysInMilk());
        animal.setMilkProductionPerDay(request.getMilkProductionPerDay());
        animal.setPregnancyStatus(request.getPregnancyStatus());
        animal.setFeedIntakeStatus(request.getFeedIntakeStatus());

        Animal updatedAnimal = animalRepository.save(animal);
        return AnimalResponse.fromEntity(updatedAnimal);
    }

    /**
     * Delete an animal by ID.
     * Verifies that the animal exists and belongs to a farm owned by the authenticated farmer.
     */
    public void deleteAnimal(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Animal not found with id: " + id));

        validateAnimalOwnership(animal, currentUser);

        animalRepository.delete(animal);
    }

    /**
     * Validate ownership of a farm.
     */
    private void validateFarmOwnership(Farm farm, User user, String errorMessage) {
        if (!securityUtils.isAdmin(user) && !farm.getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: " + errorMessage);
        }
    }

    /**
     * Validate ownership of an animal via its associated farm.
     */
    private void validateAnimalOwnership(Animal animal, User user) {
        if (!securityUtils.isAdmin(user) && !animal.getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to access this animal");
        }
    }
}
