package com.cattlefeedai.api.service;

import com.cattlefeedai.api.dto.SampleImageResponse;
import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.SampleImage;
import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.User;
import com.cattlefeedai.api.exception.InvalidRequestException;
import com.cattlefeedai.api.exception.ResourceNotFoundException;
import com.cattlefeedai.api.exception.ResourceOwnershipException;
import com.cattlefeedai.api.repository.FeedSampleRepository;
import com.cattlefeedai.api.repository.SampleImageRepository;
import com.cattlefeedai.api.repository.SilageSampleRepository;
import com.cattlefeedai.api.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing feed and silage sample images (capture, upload, retrieval, deletion).
 */
@Service
@Transactional
public class SampleImageService {

    private final SampleImageRepository sampleImageRepository;
    private final FeedSampleRepository feedSampleRepository;
    private final SilageSampleRepository silageSampleRepository;
    private final SecurityUtils securityUtils;
    private final Path storageDirectory;

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public SampleImageService(
            SampleImageRepository sampleImageRepository,
            FeedSampleRepository feedSampleRepository,
            SilageSampleRepository silageSampleRepository,
            SecurityUtils securityUtils,
            @Value("${app.upload.dir:uploads/sample-images}") String uploadDir
    ) {
        this.sampleImageRepository = sampleImageRepository;
        this.feedSampleRepository = feedSampleRepository;
        this.silageSampleRepository = silageSampleRepository;
        this.securityUtils = securityUtils;
        this.storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + this.storageDirectory, e);
        }
    }

    // ── Feed Sample Image Operations ──────────────────────────────────────────

    public SampleImageResponse uploadFeedSampleImage(Long feedSampleId, MultipartFile file, String caption) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFeedOwnership(feedSample, currentUser);
        validateImageFile(file);

        String storedFilename = storeFileOnDisk(file);
        Path targetPath = this.storageDirectory.resolve(storedFilename);

        SampleImage image = new SampleImage();
        image.setFeedSample(feedSample);
        image.setOriginalFilename(cleanFilename(file.getOriginalFilename()));
        image.setStoredFilename(storedFilename);
        image.setFilePath(targetPath.toString());
        image.setContentType(file.getContentType());
        image.setFileSize(file.getSize());
        image.setCaption(caption);
        image.setCreatedAt(LocalDateTime.now());
        // Temporary placeholder; updated after save with generated ID
        image.setFileReference("/api/feed-samples/" + feedSampleId + "/images/pending/file");

        SampleImage saved = sampleImageRepository.save(image);
        saved.setFileReference("/api/feed-samples/" + feedSampleId + "/images/" + saved.getId() + "/file");
        saved = sampleImageRepository.save(saved);

        return mapToResponse(saved, "FEED", feedSampleId);
    }

    @Transactional(readOnly = true)
    public List<SampleImageResponse> getFeedSampleImages(Long feedSampleId) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFeedOwnership(feedSample, currentUser);

        return sampleImageRepository.findByFeedSampleIdOrderByCreatedAtDesc(feedSampleId).stream()
                .map(img -> mapToResponse(img, "FEED", feedSampleId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SampleImageResponse getFeedSampleImageById(Long feedSampleId, Long imageId) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFeedOwnership(feedSample, currentUser);

        SampleImage image = sampleImageRepository.findByIdAndFeedSampleId(imageId, feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId + " for feed sample: " + feedSampleId));

        return mapToResponse(image, "FEED", feedSampleId);
    }

    @Transactional(readOnly = true)
    public Resource loadFeedSampleImageResource(Long feedSampleId, Long imageId) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFeedOwnership(feedSample, currentUser);

        SampleImage image = sampleImageRepository.findByIdAndFeedSampleId(imageId, feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId + " for feed sample: " + feedSampleId));

        return loadResourceFromDisk(image.getStoredFilename());
    }

    public void deleteFeedSampleImage(Long feedSampleId, Long imageId) {
        User currentUser = securityUtils.getCurrentUser();
        FeedSample feedSample = feedSampleRepository.findById(feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Feed sample not found with id: " + feedSampleId));

        validateFeedOwnership(feedSample, currentUser);

        SampleImage image = sampleImageRepository.findByIdAndFeedSampleId(imageId, feedSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId + " for feed sample: " + feedSampleId));

        deleteFileFromDisk(image.getStoredFilename());
        sampleImageRepository.delete(image);
    }

    // ── Silage Sample Image Operations ────────────────────────────────────────

    public SampleImageResponse uploadSilageSampleImage(Long silageSampleId, MultipartFile file, String caption) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample silageSample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateSilageOwnership(silageSample, currentUser);
        validateImageFile(file);

        String storedFilename = storeFileOnDisk(file);
        Path targetPath = this.storageDirectory.resolve(storedFilename);

        SampleImage image = new SampleImage();
        image.setSilageSample(silageSample);
        image.setOriginalFilename(cleanFilename(file.getOriginalFilename()));
        image.setStoredFilename(storedFilename);
        image.setFilePath(targetPath.toString());
        image.setContentType(file.getContentType());
        image.setFileSize(file.getSize());
        image.setCaption(caption);
        image.setCreatedAt(LocalDateTime.now());
        image.setFileReference("/api/silage-samples/" + silageSampleId + "/images/pending/file");

        SampleImage saved = sampleImageRepository.save(image);
        saved.setFileReference("/api/silage-samples/" + silageSampleId + "/images/" + saved.getId() + "/file");
        saved = sampleImageRepository.save(saved);

        return mapToResponse(saved, "SILAGE", silageSampleId);
    }

    @Transactional(readOnly = true)
    public List<SampleImageResponse> getSilageSampleImages(Long silageSampleId) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample silageSample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateSilageOwnership(silageSample, currentUser);

        return sampleImageRepository.findBySilageSampleIdOrderByCreatedAtDesc(silageSampleId).stream()
                .map(img -> mapToResponse(img, "SILAGE", silageSampleId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SampleImageResponse getSilageSampleImageById(Long silageSampleId, Long imageId) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample silageSample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateSilageOwnership(silageSample, currentUser);

        SampleImage image = sampleImageRepository.findByIdAndSilageSampleId(imageId, silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId + " for silage sample: " + silageSampleId));

        return mapToResponse(image, "SILAGE", silageSampleId);
    }

    @Transactional(readOnly = true)
    public Resource loadSilageSampleImageResource(Long silageSampleId, Long imageId) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample silageSample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateSilageOwnership(silageSample, currentUser);

        SampleImage image = sampleImageRepository.findByIdAndSilageSampleId(imageId, silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId + " for silage sample: " + silageSampleId));

        return loadResourceFromDisk(image.getStoredFilename());
    }

    public void deleteSilageSampleImage(Long silageSampleId, Long imageId) {
        User currentUser = securityUtils.getCurrentUser();
        SilageSample silageSample = silageSampleRepository.findById(silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Silage sample not found with id: " + silageSampleId));

        validateSilageOwnership(silageSample, currentUser);

        SampleImage image = sampleImageRepository.findByIdAndSilageSampleId(imageId, silageSampleId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId + " for silage sample: " + silageSampleId));

        deleteFileFromDisk(image.getStoredFilename());
        sampleImageRepository.delete(image);
    }

    // ── Helper & Validation Methods ───────────────────────────────────────────

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Image file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidRequestException("Image file size exceeds maximum limit of 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidRequestException(
                    "Invalid image content type: " + contentType + ". Allowed types: image/jpeg, image/png, image/webp"
            );
        }
    }

    private String storeFileOnDisk(MultipartFile file) {
        String original = cleanFilename(file.getOriginalFilename());
        String extension = "";
        int dotIndex = original.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = original.substring(dotIndex).toLowerCase();
        } else {
            String ct = file.getContentType();
            if ("image/png".equalsIgnoreCase(ct)) extension = ".png";
            else if ("image/webp".equalsIgnoreCase(ct)) extension = ".webp";
            else extension = ".jpg";
        }

        // Generate safe UUID filename to prevent collisions and path traversal
        String storedFilename = UUID.randomUUID().toString() + extension;
        Path destinationFile = this.storageDirectory.resolve(storedFilename).normalize().toAbsolutePath();

        if (!destinationFile.getParent().equals(this.storageDirectory)) {
            throw new InvalidRequestException("Cannot store file outside current directory");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            return storedFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image file on disk", e);
        }
    }

    private Resource loadResourceFromDisk(String storedFilename) {
        try {
            Path file = this.storageDirectory.resolve(storedFilename).normalize().toAbsolutePath();
            if (!file.getParent().equals(this.storageDirectory)) {
                throw new InvalidRequestException("Access denied: Invalid file path");
            }
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Image file not found on disk: " + storedFilename);
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Image file not found: " + storedFilename);
        }
    }

    private void deleteFileFromDisk(String storedFilename) {
        try {
            Path file = this.storageDirectory.resolve(storedFilename).normalize().toAbsolutePath();
            if (file.getParent().equals(this.storageDirectory)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException ignored) {
            // Ignore disk deletion errors if file is already gone
        }
    }

    private void validateFeedOwnership(FeedSample sample, User user) {
        if (!securityUtils.isAdmin(user) && !sample.getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not own this feed sample");
        }
    }

    private void validateSilageOwnership(SilageSample sample, User user) {
        if (!securityUtils.isAdmin(user) && !sample.getFarm().getOwner().getId().equals(user.getId())) {
            throw new ResourceOwnershipException("Access denied: You do not own this silage sample");
        }
    }

    private String cleanFilename(String originalFilename) {
        if (originalFilename == null) return "image.jpg";
        return Paths.get(originalFilename).getFileName().toString();
    }

    private SampleImageResponse mapToResponse(SampleImage image, String sampleType, Long sampleId) {
        return SampleImageResponse.builder()
                .id(image.getId())
                .sampleType(sampleType)
                .sampleId(sampleId)
                .originalFilename(image.getOriginalFilename())
                .storedFilename(image.getStoredFilename())
                .fileReference(image.getFileReference())
                .contentType(image.getContentType())
                .fileSize(image.getFileSize())
                .caption(image.getCaption())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
