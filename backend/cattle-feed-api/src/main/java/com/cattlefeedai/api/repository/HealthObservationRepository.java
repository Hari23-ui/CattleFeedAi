package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.HealthObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthObservationRepository extends JpaRepository<HealthObservation, Long> {

    List<HealthObservation> findByAnimalId(Long animalId);

    List<HealthObservation> findByAnimalIdOrderByObservationDateDesc(Long animalId);
}
