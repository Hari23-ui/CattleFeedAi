package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.FeedSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedSampleRepository extends JpaRepository<FeedSample, Long> {

    List<FeedSample> findByFarmId(Long farmId);

    List<FeedSample> findByAnimalId(Long animalId);

    Optional<FeedSample> findBySampleCode(String sampleCode);

    boolean existsBySampleCode(String sampleCode);

    List<FeedSample> findByFarmOwnerId(Long ownerId);
}
