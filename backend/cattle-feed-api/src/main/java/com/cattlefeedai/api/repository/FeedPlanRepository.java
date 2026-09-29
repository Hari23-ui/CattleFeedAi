package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.FeedPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface FeedPlanRepository extends JpaRepository<FeedPlan, Long> {

    List<FeedPlan> findByAnimalId(Long animalId);

    List<FeedPlan> findByAnimalIdOrderByCreatedAtDesc(Long animalId);

    List<FeedPlan> findByAnimalFarmOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @Query("SELECT COUNT(fp) FROM FeedPlan fp WHERE fp.animal.farm.owner.id = :ownerId AND UPPER(fp.status) = 'ACTIVE'")
    long countActiveByOwnerId(@Param("ownerId") Long ownerId);

    long countByAnimalFarmOwnerId(Long ownerId);
}
