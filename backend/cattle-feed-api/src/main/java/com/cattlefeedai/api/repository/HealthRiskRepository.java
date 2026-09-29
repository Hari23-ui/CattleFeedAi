package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.HealthRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthRiskRepository extends JpaRepository<HealthRisk, Long> {

    List<HealthRisk> findByAnimalId(Long animalId);

    List<HealthRisk> findByAnimalIdOrderByDetectedDateDesc(Long animalId);

    List<HealthRisk> findByAnimalFarmOwnerId(Long ownerId);
}
