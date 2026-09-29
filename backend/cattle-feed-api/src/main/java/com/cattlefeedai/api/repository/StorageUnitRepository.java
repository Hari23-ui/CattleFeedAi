package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.StorageUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StorageUnitRepository extends JpaRepository<StorageUnit, Long> {

    List<StorageUnit> findByFarmId(Long farmId);

    @Query("SELECT s FROM StorageUnit s WHERE s.farm.owner.id = :ownerId ORDER BY s.id DESC")
    List<StorageUnit> findByFarmOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT s FROM StorageUnit s WHERE s.farm.id = :farmId AND s.farm.owner.id = :ownerId ORDER BY s.id DESC")
    List<StorageUnit> findByFarmIdAndFarmOwnerId(@Param("farmId") Long farmId, @Param("ownerId") Long ownerId);
}
