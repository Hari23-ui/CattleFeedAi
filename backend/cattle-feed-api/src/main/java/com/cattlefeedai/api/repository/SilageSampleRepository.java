package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.SilageSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SilageSampleRepository extends JpaRepository<SilageSample, Long> {

    List<SilageSample> findByFarmId(Long farmId);

    List<SilageSample> findByAnimalId(Long animalId);

    Optional<SilageSample> findBySampleCode(String sampleCode);

    boolean existsBySampleCode(String sampleCode);

    List<SilageSample> findByFarmOwnerId(Long ownerId);
}
