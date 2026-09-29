package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.Advisory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvisoryRepository extends JpaRepository<Advisory, Long> {

    List<Advisory> findByAnimalId(Long animalId);

    List<Advisory> findByAnimalIdAndIsReadFalse(Long animalId);

    List<Advisory> findByAnimalFarmOwnerId(Long ownerId);

    List<Advisory> findByAnimalFarmOwnerIdAndIsRead(Long ownerId, Boolean isRead);
}
