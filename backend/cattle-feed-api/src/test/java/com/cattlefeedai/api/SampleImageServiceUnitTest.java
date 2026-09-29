package com.cattlefeedai.api;

import com.cattlefeedai.api.dto.SampleImageResponse;
import com.cattlefeedai.api.entity.*;
import com.cattlefeedai.api.entity.enums.Role;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.SampleImageRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import com.cattlefeedai.api.service.SampleImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class SampleImageServiceUnitTest {

    private SampleImageRepository sampleImageRepository;
    private FeedSampleRepository feedSampleRepository;
    private SilageSampleRepository silageSampleRepository;
    private TestSecurityUtils securityUtils;
    private SampleImageService sampleImageService;

    static class TestSecurityUtils extends SecurityUtils {
        private User currentUser;

        public TestSecurityUtils(User user) {
            super(null);
            this.currentUser = user;
        }

        public void setCurrentUser(User user) {
            this.currentUser = user;
        }

        @Override
        public User getCurrentUser() {
            return currentUser;
        }

        @Override
        public boolean isAdmin(User user) {
            return user != null && user.getRole() == Role.ADMIN;
        }
    }

    @TempDir
    Path tempUploadDir;

    private User farmerA;
    private User farmerB;
    private Farm farmA;
    private FeedSample feedSample;
    private SilageSample silageSample;

    @BeforeEach
    void setUp() {
        sampleImageRepository = mock(SampleImageRepository.class);
        feedSampleRepository = mock(FeedSampleRepository.class);
        silageSampleRepository = mock(SilageSampleRepository.class);

        farmerA = new User();
        farmerA.setId(1L);
        farmerA.setEmail("farmerA@test.com");
        farmerA.setRole(Role.FARMER);

        farmerB = new User();
        farmerB.setId(2L);
        farmerB.setEmail("farmerB@test.com");
        farmerB.setRole(Role.FARMER);

        securityUtils = new TestSecurityUtils(farmerA);

        sampleImageService = new SampleImageService(
                sampleImageRepository,
                feedSampleRepository,
                silageSampleRepository,
                securityUtils,
                tempUploadDir.toString()
        );

        farmA = new Farm();
        farmA.setId(10L);
        farmA.setOwner(farmerA);

        feedSample = new FeedSample();
        feedSample.setId(100L);
        feedSample.setFarm(farmA);
        feedSample.setSampleCode("FEED-001");
        feedSample.setSampleDate(LocalDate.now());

        silageSample = new SilageSample();
        silageSample.setId(200L);
        silageSample.setFarm(farmA);
        silageSample.setSampleCode("SIL-001");
        silageSample.setSampleDate(LocalDate.now());
    }

    @Test
    void testUploadFeedSampleImage_Success() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));
        when(sampleImageRepository.save(any(SampleImage.class))).thenAnswer(invocation -> {
            SampleImage img = invocation.getArgument(0);
            if (img.getId() == null) img.setId(500L);
            return img;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "feed_photo.jpg",
                "image/jpeg",
                "mock-image-bytes".getBytes()
        );

        SampleImageResponse response = sampleImageService.uploadFeedSampleImage(100L, file, "Fresh batch inspection");

        assertNotNull(response);
        assertEquals("FEED", response.getSampleType());
        assertEquals(100L, response.getSampleId());
        assertEquals("feed_photo.jpg", response.getOriginalFilename());
        assertEquals("image/jpeg", response.getContentType());
        assertEquals("Fresh batch inspection", response.getCaption());
        assertTrue(response.getFileReference().contains("/api/feed-samples/100/images/"));
    }

    @Test
    void testUploadFeedSampleImage_OtherFarmer_ThrowsForbidden() {
        securityUtils.setCurrentUser(farmerB);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "feed_photo.jpg",
                "image/jpeg",
                "mock-image-bytes".getBytes()
        );

        assertThrows(ResourceOwnershipException.class, () ->
                sampleImageService.uploadFeedSampleImage(100L, file, "Intruder upload")
        );
    }

    @Test
    void testUploadFeedSampleImage_MissingSample_ThrowsNotFound() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(999L)).thenReturn(Optional.empty());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "feed_photo.jpg",
                "image/jpeg",
                "mock-image-bytes".getBytes()
        );

        assertThrows(ResourceNotFoundException.class, () ->
                sampleImageService.uploadFeedSampleImage(999L, file, "Test")
        );
    }

    @Test
    void testUploadFeedSampleImage_EmptyFile_ThrowsInvalidRequest() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));

        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        assertThrows(InvalidRequestException.class, () ->
                sampleImageService.uploadFeedSampleImage(100L, emptyFile, "Empty")
        );
    }

    @Test
    void testUploadFeedSampleImage_InvalidContentType_ThrowsInvalidRequest() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));

        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "malicious.txt",
                "text/plain",
                "hello world".getBytes()
        );

        assertThrows(InvalidRequestException.class, () ->
                sampleImageService.uploadFeedSampleImage(100L, textFile, "Invalid format")
        );
    }

    @Test
    void testUploadFeedSampleImage_OversizedFile_ThrowsInvalidRequest() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));

        byte[] bigBytes = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile oversized = new MockMultipartFile(
                "file",
                "huge.jpg",
                "image/jpeg",
                bigBytes
        );

        assertThrows(InvalidRequestException.class, () ->
                sampleImageService.uploadFeedSampleImage(100L, oversized, "Too large")
        );
    }

    @Test
    void testGetFeedSampleImages_Success() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));

        SampleImage img = new SampleImage();
        img.setId(500L);
        img.setFeedSample(feedSample);
        img.setOriginalFilename("test.png");
        img.setStoredFilename("stored-test.png");
        img.setFileReference("/api/feed-samples/100/images/500/file");
        img.setContentType("image/png");
        img.setFileSize(2048L);
        img.setCreatedAt(LocalDateTime.now());

        when(sampleImageRepository.findByFeedSampleIdOrderByCreatedAtDesc(100L))
                .thenReturn(Collections.singletonList(img));

        List<SampleImageResponse> result = sampleImageService.getFeedSampleImages(100L);
        assertEquals(1, result.size());
        assertEquals(500L, result.get(0).getId());
        assertEquals("test.png", result.get(0).getOriginalFilename());
    }

    @Test
    void testDeleteFeedSampleImage_Success() {
        securityUtils.setCurrentUser(farmerA);
        when(feedSampleRepository.findById(100L)).thenReturn(Optional.of(feedSample));

        SampleImage img = new SampleImage();
        img.setId(500L);
        img.setFeedSample(feedSample);
        img.setStoredFilename("test-delete.jpg");

        when(sampleImageRepository.findByIdAndFeedSampleId(500L, 100L)).thenReturn(Optional.of(img));

        sampleImageService.deleteFeedSampleImage(100L, 500L);

        verify(sampleImageRepository, times(1)).delete(img);
    }

    @Test
    void testSilageSampleImageWorkflow_Success() {
        securityUtils.setCurrentUser(farmerA);
        when(silageSampleRepository.findById(200L)).thenReturn(Optional.of(silageSample));
        when(sampleImageRepository.save(any(SampleImage.class))).thenAnswer(invocation -> {
            SampleImage img = invocation.getArgument(0);
            if (img.getId() == null) img.setId(600L);
            return img;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "silage_trench.jpg",
                "image/jpeg",
                "mock-silage-bytes".getBytes()
        );

        SampleImageResponse uploadRes = sampleImageService.uploadSilageSampleImage(200L, file, "Pit #3 photo");
        assertNotNull(uploadRes);
        assertEquals("SILAGE", uploadRes.getSampleType());
        assertEquals(200L, uploadRes.getSampleId());

        SampleImage img = new SampleImage();
        img.setId(600L);
        img.setSilageSample(silageSample);
        img.setStoredFilename("test-silage.jpg");

        when(sampleImageRepository.findByIdAndSilageSampleId(600L, 200L)).thenReturn(Optional.of(img));

        sampleImageService.deleteSilageSampleImage(200L, 600L);
        verify(sampleImageRepository, times(1)).delete(img);
    }
}
