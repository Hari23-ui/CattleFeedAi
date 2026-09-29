package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.Expert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExpertRepository extends JpaRepository<Expert, Long> {

    Optional<Expert> findByUserId(Long userId);
}
