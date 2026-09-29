package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.Consultation;
import com.cattlefeedai.api.entity.enums.ConsultationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    List<Consultation> findByFarmerId(Long farmerId);

    List<Consultation> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    List<Consultation> findByExpertId(Long expertId);

    List<Consultation> findByExpertIdOrderByCreatedAtDesc(Long expertId);

    List<Consultation> findByStatus(ConsultationStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Consultation c WHERE c.expert.id = :expertId OR (c.expert IS NULL AND c.status = :requestedStatus) ORDER BY c.createdAt DESC")
    List<Consultation> findAvailableOrAssignedToExpert(
            @org.springframework.data.repository.query.Param("expertId") Long expertId,
            @org.springframework.data.repository.query.Param("requestedStatus") ConsultationStatus requestedStatus
    );

    List<Consultation> findByAnimalId(Long animalId);

    List<Consultation> findAllByOrderByCreatedAtDesc();
}
