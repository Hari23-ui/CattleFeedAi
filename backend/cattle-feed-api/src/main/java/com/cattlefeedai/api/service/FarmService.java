package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.FarmRequest;
import com.cattlefeedai.api.dto.FarmResponse;
import com.cattlefeedai.api.entity.Animal;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.AnimalRepository;
import com.cattlefeedai.api.repository.FarmRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling Farm management business logic and ownership enforcement.
 */
@Service
@Transactional
public class FarmService {

    private final FarmRepository farmRepository;
    private final AnimalRepository animalRepository;
    private final SecurityUtils securityUtils;

    public FarmService(
            FarmRepository farmRepository,
            AnimalRepository animalRepository,
            SecurityUtils securityUtils
    ) {
        this.farmRepository = farmRepository;
        this.animalRepository = animalRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Create a new farm for the currently authenticated user.
     * Owner is strictly assigned from the JWT user.
     */
    public FarmResponse createFarm(FarmRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = new Farm();
        farm.setFarmName(request.getFarmName());
        farm.setLocation(request.getLocation());
        farm.setDistrict(request.getDistrict());
        farm.setState(request.getState());
        farm.setPincode(request.getPincode());
        farm.setOwner(currentUser);

        Farm savedFarm = farmRepository.save(farm);
        return FarmResponse.fromEntity(savedFarm);
    }

    /**
     * Retrieve all farms accessible to the user.
     * ADMIN gets all farms; FARMER gets only their owned farms.
     */
    @Transactional(readOnly = true)
    public List<FarmResponse> getAllFarms() {
        User currentUser = securityUtils.getCurrentUser();

        List<Farm> farms;
        if (securityUtils.isAdmin(currentUser)) {
            farms = farmRepository.findAll();
        } else {
            farms = farmRepository.findByOwnerId(currentUser.getId());
        }

        return farms.stream()
                .map(FarmResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve a farm by ID.
     * Verifies ownership if caller is not ADMIN.
     */
    @Transactional(readOnly = true)
    public FarmResponse getFarmById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + id));

        validateFarmOwnership(farm, currentUser);

        return FarmResponse.fromEntity(farm);
    }

    /**
     * Update an existing farm.
     * Verifies ownership if caller is not ADMIN.
     */
    public FarmResponse updateFarm(Long id, FarmRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + id));

        validateFarmOwnership(farm, currentUser);

        farm.setFarmName(request.getFarmName());
        farm.setLocation(request.getLocation());
        farm.setDistrict(request.getDistrict());
        farm.setState(request.getState());
        farm.setPincode(request.getPincode());

        Farm updatedFarm = farmRepository.save(farm);
        return FarmResponse.fromEntity(updatedFarm);
    }

    /**
     * Delete a farm and its associated animals.
     * Verifies ownership if caller is not ADMIN.
     */
    public void deleteFarm(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + id));

        validateFarmOwnership(farm, currentUser);

        // Delete associated animals to maintain foreign key integrity
        List<Animal> animals = animalRepository.findByFarmId(id);
        if (!animals.isEmpty()) {
            animalRepository.deleteAll(animals);
        }

        farmRepository.delete(farm);
    }

    /**
     * Helper to validate that the current user owns the farm or is an ADMIN.
     */
    private void validateFarmOwnership(Farm farm, User user) {
        if (!securityUtils.isAdmin(user) && !farm.getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not have permission to access this farm");
        }
    }
}
