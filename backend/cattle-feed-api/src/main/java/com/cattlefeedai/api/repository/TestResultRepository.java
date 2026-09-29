package com.cattlefeedai.api.repository;

import com.cattlefeedai.api.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    List<TestResult> findByFeedSampleId(Long feedSampleId);

    List<TestResult> findBySilageSampleId(Long silageSampleId);

    List<TestResult> findByFeedSampleIdOrderByTestDateAsc(Long feedSampleId);

    List<TestResult> findBySilageSampleIdOrderByTestDateAsc(Long silageSampleId);

    List<TestResult> findByFeedSampleIdOrderByTestDateDesc(Long feedSampleId);

    List<TestResult> findBySilageSampleIdOrderByTestDateDesc(Long silageSampleId);

    @org.springframework.data.jpa.repository.Query("SELECT tr FROM TestResult tr LEFT JOIN tr.feedSample fs LEFT JOIN fs.farm f1 LEFT JOIN tr.silageSample ss LEFT JOIN ss.farm f2 WHERE f1.owner.id = :ownerId OR f2.owner.id = :ownerId ORDER BY tr.testDate DESC")
    List<TestResult> findByOwnerId(@org.springframework.data.repository.query.Param("ownerId") Long ownerId);

    @org.springframework.data.jpa.repository.Query("SELECT tr FROM TestResult tr LEFT JOIN tr.feedSample fs LEFT JOIN fs.farm f1 LEFT JOIN tr.silageSample ss LEFT JOIN ss.farm f2 WHERE (f1.owner.id = :ownerId OR f2.owner.id = :ownerId) AND tr.testDate >= :startDate ORDER BY tr.testDate DESC")
    List<TestResult> findByOwnerIdAndStartDate(@org.springframework.data.repository.query.Param("ownerId") Long ownerId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.Query("SELECT tr FROM TestResult tr LEFT JOIN tr.feedSample fs LEFT JOIN tr.silageSample ss WHERE (fs.animal.id = :animalId) OR (ss.animal.id = :animalId) ORDER BY tr.testDate ASC")
    List<TestResult> findByAnimalIdOrderByTestDateAsc(@org.springframework.data.repository.query.Param("animalId") Long animalId);

    @org.springframework.data.jpa.repository.Query("SELECT tr FROM TestResult tr LEFT JOIN tr.feedSample fs LEFT JOIN tr.silageSample ss WHERE ((fs.animal.id = :animalId) OR (ss.animal.id = :animalId)) AND tr.testDate >= :startDate ORDER BY tr.testDate ASC")
    List<TestResult> findByAnimalIdAndStartDateOrderByTestDateAsc(@org.springframework.data.repository.query.Param("animalId") Long animalId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.Query("SELECT tr FROM TestResult tr WHERE tr.feedSample.id = :feedSampleId AND tr.testDate >= :startDate ORDER BY tr.testDate ASC")
    List<TestResult> findByFeedSampleIdAndStartDateOrderByTestDateAsc(@org.springframework.data.repository.query.Param("feedSampleId") Long feedSampleId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.Query("SELECT tr FROM TestResult tr WHERE tr.silageSample.id = :silageSampleId AND tr.testDate >= :startDate ORDER BY tr.testDate ASC")
    List<TestResult> findBySilageSampleIdAndStartDateOrderByTestDateAsc(@org.springframework.data.repository.query.Param("silageSampleId") Long silageSampleId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate);

    List<TestResult> findAllByOrderByTestDateDesc();

    List<TestResult> findByTestDateGreaterThanEqualOrderByTestDateDesc(java.time.LocalDate startDate);
}
