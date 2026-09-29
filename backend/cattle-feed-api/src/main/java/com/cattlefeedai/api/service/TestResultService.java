package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.TestResultRequest;
import com.cattlefeedai.api.dto.TestResultResponse;
import com.cattlefeedai.api.entity.Farm;
import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.TestResult;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.entity.enums.AnalysisSource;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.repository.TestResultRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service handling TestResult recording and historical retrieval.
 * Every test records a new TestResult instance, preserving historical measurements.
 */
@Service
@Transactional
public class TestResultService {

    private final TestResultRepository testResultRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final SecurityUtils securityUtils;

    public TestResultService(
            TestResultRepository testResultRepository,
            FeedSampleRepository feedSampleRepository,
            SilageSampleRepository silageSampleRepository,
            SecurityUtils securityUtils
    ) {
        this.testResultRepository = testResultRepository;
        this.feedSampleRepository = feedSampleRepository;
        this.silageSampleRepository = silageSampleRepository;
        this.securityUtils = securityUtils;
    }

    /**
     * Record a new test result.
     * Always creates a new record to preserve full measurement history.
     */
    public TestResultResponse createTestResult(TestResultRequest request) {
        if (request.getFeedSampleId() == null && request.getSilageSampleId() == null) {
            throw new InvalidRequestException("Either feedSampleId or silageSampleId must be provided");
        }
        if (request.getFeedSampleId() != null && request.getSilageSampleId() != null) {
            throw new InvalidRequestException(
                    "A test result must be associated with either a feed sample or a silage sample, not both");
        }

        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = null;
        SilageSample silageSample = null;

        if (request.getFeedSampleId() != null) {
            feedSample = feedSampleRepository.findById(request.getFeedSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Feed sample not found with id: " + request.getFeedSampleId()));
            validateFarmOwnership(feedSample.getFarm(), currentUser, "this feed sample");
        } else {
            silageSample = silageSampleRepository.findById(request.getSilageSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Silage sample not found with id: " + request.getSilageSampleId()));
            validateFarmOwnership(silageSample.getFarm(), currentUser, "this silage sample");
        }

        TestResult testResult = new TestResult();
        testResult.setFeedSample(feedSample);
        testResult.setSilageSample(silageSample);
        testResult.setTestDate(request.getTestDate() != null ? request.getTestDate() : LocalDate.now());
        testResult.setMoisture(request.getMoisture());
        testResult.setCrudeProtein(request.getCrudeProtein());
        testResult.setFiber(request.getFiber());
        testResult.setEnergyValue(request.getEnergyValue());
        testResult.setMineralStatus(request.getMineralStatus());
        testResult.setAflatoxin(request.getAflatoxin());
        testResult.setMycotoxin(request.getMycotoxin());
        testResult.setPh(request.getPh());
        testResult.setAdulteration(request.getAdulteration());
        testResult.setMouldDetected(request.getMouldDetected());
        testResult.setSpoilageDetected(request.getSpoilageDetected());
        testResult.setConfidenceScore(request.getConfidenceScore());
        testResult.setAnalysisSource(request.getAnalysisSource() != null ? request.getAnalysisSource() : AnalysisSource.MANUAL);

        TestResult saved = testResultRepository.save(testResult);
        return TestResultResponse.fromEntity(saved);
    }

    /**
     * Retrieve a specific test result by ID.
     */
    @Transactional(readOnly = true)
    public TestResultResponse getTestResultById(Long id) {
        User currentUser = securityUtils.getCurrentUser();

        TestResult testResult = testResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test result not found with id: " + id));

        Farm farm = testResult.getFeedSample() != null
                ? testResult.getFeedSample().getFarm()
                : (testResult.getSilageSample() != null ? testResult.getSilageSample().getFarm() : null);

        if (farm != null) {
            validateFarmOwnership(farm, currentUser, "this test result");
        }

        return TestResultResponse.fromEntity(testResult);
    }

    /**
     * Retrieve all historical test results for a given feed sample in ascending date order.
     */
    @Transactional(readOnly = true)
    public List<TestResultResponse> getTestResultsByFeedSampleId(Long feedSampleId) {
        User currentUser = securityUtils.getCurrentUser();

        FeedSample feedSample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Feed sample not found with id: " + feedSampleId));

        validateFarmOwnership(feedSample.getFarm(), currentUser, "this feed sample");

        List<TestResult> results = testResultRepository.findByFeedSampleIdOrderByTestDateAsc(feedSampleId);
        return results.stream()
                .map(TestResultResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieve all historical test results for a given silage sample in ascending date order.
     */
    @Transactional(readOnly = true)
    public List<TestResultResponse> getTestResultsBySilageSampleId(Long silageSampleId) {
        User currentUser = securityUtils.getCurrentUser();

        SilageSample silageSample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Silage sample not found with id: " + silageSampleId));

        validateFarmOwnership(silageSample.getFarm(), currentUser, "this silage sample");

        List<TestResult> results = testResultRepository.findBySilageSampleIdOrderByTestDateAsc(silageSampleId);
        return results.stream()
                .map(TestResultResponse::fromEntity)
                .toList();
    }

    /**
     * Helper to validate that caller owns the farm or is ADMIN.
     */
    private void validateFarmOwnership(Farm farm, User user, String resourceDesc) {
        if (!securityUtils.isAdmin(user) && !farm.getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException(
                    "Access denied: You do not have permission to access " + resourceDesc);
        }
    }
}
