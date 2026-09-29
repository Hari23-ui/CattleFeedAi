package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.SampleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SampleImageRepository extends JpaRepository<SampleImage, Long> {

    List<SampleImage> findByFeedSampleIdOrderByCreatedAtDesc(Long feedSampleId);

    List<SampleImage> findBySilageSampleIdOrderByCreatedAtDesc(Long silageSampleId);

    Optional<SampleImage> findByIdAndFeedSampleId(Long id, Long feedSampleId);

    Optional<SampleImage> findByIdAndSilageSampleId(Long id, Long silageSampleId);

    Optional<SampleImage> findByStoredFilename(String storedFilename);
}
