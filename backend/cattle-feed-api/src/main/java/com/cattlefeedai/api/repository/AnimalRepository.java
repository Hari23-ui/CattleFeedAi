package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {

    List<Animal> findByFarmId(Long farmId);

    Optional<Animal> findByAnimalTagAndFarmId(String animalTag, Long farmId);

    boolean existsByAnimalTagAndFarmId(String animalTag, Long farmId);

    List<Animal> findByFarmOwnerId(Long ownerId);
}
