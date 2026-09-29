package com.cattlefeedai.api.service.assessment;

import com.cattlefeedai.api.dto.assessment.VisualScreeningRequest;
import com.cattlefeedai.api.dto.assessment.VisualScreeningResponse;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for ingesting and processing Computer Vision / Webcam visual screening inputs.
 *
 * IMPORTANT:
 * Computer vision is designated as VISUAL SCREENING ONLY.
 * Webcams detect surface color, mould, clumping, and visible foreign material.
 * They do NOT measure chemical parameters (protein, moisture %, fiber, aflatoxin, etc.).
 */
@Service
@Transactional
public class VisualScreeningService {

    private final TestResultRepository testResultRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final SecurityUtils securityUtils;

    public static final String VISUAL_SCREENING_DISCLAIMER =
            "VISUAL SCREENING ONLY: Computer vision analysis identifies surface physical characteristics, mould discoloration, and visible foreign material. It does NOT measure chemical attributes like protein, moisture %, fiber, or aflatoxin.";

    public VisualScreeningService(
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
     * Ingest visual screening result from webcam/AI microservice and create a visual TestResult record.
     */
    public VisualScreeningResponse ingestVisualScreening(VisualScreeningRequest request) {
        if (request.getFeedSampleId() == null && request.getSilageSampleId() == null) {
            throw new InvalidRequestException("Either feedSampleId or silageSampleId must be provided");
        }
        if (request.getFeedSampleId() != null && request.getSilageSampleId() != null) {
            throw new InvalidRequestException("Cannot associate visual screening with both feed and silage simultaneously");
        }

        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = null;
        SilageSample silageSample = null;
        String sampleType;
        Long sampleId;

        if (request.getFeedSampleId() != null) {
            feedSample = feedSampleRepository.findById(request.getFeedSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + request.getFeedSampleId()));

            if (!securityUtils.isAdmin(currentUser) && !feedSample.getFarm().getOwner().getId().equals(currentUser.getId())) {
                throw new ResourceOwnershipException("Access denied: You do not own this feed sample");
            }
            sampleType = "FEED";
            sampleId = feedSample.getId();
        } else {
            silageSample = silageSampleRepository.findById(request.getSilageSampleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + request.getSilageSampleId()));

            if (!securityUtils.isAdmin(currentUser) && !silageSample.getFarm().getOwner().getId().equals(currentUser.getId())) {
                throw new ResourceOwnershipException("Access denied: You do not own this silage sample");
            }
            sampleType = "SILAGE";
            sampleId = silageSample.getId();
        }

        List<String> risks = new ArrayList<>();
        if (Boolean.TRUE.equals(request.getMouldIndication())) {
            risks.add("Visible surface mould or fungal growth detected via visual screening");
        }
        if (Boolean.TRUE.equals(request.getSpoilageIndication())) {
            risks.add("Visible surface discoloration or organoleptic spoilage detected");
        }
        if (Boolean.TRUE.equals(request.getVisibleForeignMaterialIndication())) {
            risks.add("Visible foreign particles or adulterants detected");
        }

        String visualStatus = risks.isEmpty() ? "NORMAL" : (Boolean.TRUE.equals(request.getMouldIndication()) ? "ABNORMAL" : "SUSPICIOUS");

        // Save as a TestResult with AnalysisSource.IMAGE (chemical parameters left null)
        TestResult testResult = new TestResult();
        testResult.setFeedSample(feedSample);
        testResult.setSilageSample(silageSample);
        testResult.setTestDate(LocalDate.now());
        testResult.setAnalysisSource(AnalysisSource.IMAGE);
        testResult.setMouldDetected(request.getMouldIndication());
        testResult.setSpoilageDetected(request.getSpoilageIndication());
        testResult.setAdulteration(Boolean.TRUE.equals(request.getVisibleForeignMaterialIndication()) ? "FOREIGN_MATERIAL_DETECTED" : "NONE");
        testResult.setConfidenceScore(request.getConfidenceScore());

        TestResult saved = testResultRepository.save(testResult);

        return VisualScreeningResponse.builder()
                .testResultId(saved.getId())
                .sampleType(sampleType)
                .sampleId(sampleId)
                .imageReference(request.getImageReference())
                .visualStatus(visualStatus)
                .mouldDetected(request.getMouldIndication())
                .spoilageDetected(request.getSpoilageIndication())
                .foreignMaterialDetected(request.getVisibleForeignMaterialIndication())
                .confidenceScore(request.getConfidenceScore())
                .identifiedVisualRisks(risks)
                .screeningNotes(request.getNotes())
                .screeningTimestamp(LocalDateTime.now())
                .disclaimer(VISUAL_SCREENING_DISCLAIMER)
                .build();
    }
}
