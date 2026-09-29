package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    List<SensorReading> findByStorageUnitId(Long storageUnitId);

    List<SensorReading> findByStorageUnitIdOrderByReadingTimeDesc(Long storageUnitId);

    Optional<SensorReading> findFirstByStorageUnitIdOrderByReadingTimeDesc(Long storageUnitId);

    List<SensorReading> findTop2ByStorageUnitIdOrderByReadingTimeDesc(Long storageUnitId);

    List<SensorReading> findTop10ByStorageUnitIdOrderByReadingTimeDesc(Long storageUnitId);
}
