package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByUserId(Long userId);

    List<Alert> findByUserIdAndIsReadFalse(Long userId);

    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    boolean existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(
            Long userId,
            String relatedEntityType,
            Long relatedEntityId,
            String title
    );

    @Modifying
    @Query("UPDATE Alert a SET a.isRead = true WHERE a.user.id = :userId AND a.isRead = false")
    int markAllAsReadForUser(@Param("userId") Long userId);
}
