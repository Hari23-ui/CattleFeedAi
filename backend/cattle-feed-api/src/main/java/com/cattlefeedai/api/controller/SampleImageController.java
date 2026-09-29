package com.cattlefeedai.api.controller;

import com.cattlefeedai.api.dto.SampleImageResponse;
import com.cattlefeedai.api.dto.ai.VisualAnalysisResponse;
import com.cattlefeedai.api.service.SampleImageService;
import com.cattlefeedai.api.service.ai.AiServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST controller for Feed and Silage sample image attachments and visual AI screening.
 * Handles mobile camera capture, PC webcam uploads, and automated visual screening.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "4.1 Sample Images", description = "Endpoints for capturing, uploading, viewing, managing, and analyzing feed and silage sample images")
public class SampleImageController {

    private final SampleImageService sampleImageService;
    private final AiServiceClient aiServiceClient;

    public SampleImageController(SampleImageService sampleImageService, AiServiceClient aiServiceClient) {
        this.sampleImageService = sampleImageService;
        this.aiServiceClient = aiServiceClient;
    }

    // ── Feed Sample Image Endpoints ───────────────────────────────────────────

    @Operation(summary = "Upload image for feed sample", description = "Uploads a photo captured via mobile camera, PC webcam, or gallery for a feed sample.")
    @PostMapping(value = "/feed-samples/{feedSampleId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SampleImageResponse> uploadFeedSampleImage(
            @PathVariable Long feedSampleId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption
    ) {
        SampleImageResponse response = sampleImageService.uploadFeedSampleImage(feedSampleId, file, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "List feed sample images", description = "Retrieves all image attachments associated with a feed sample.")
    @GetMapping("/feed-samples/{feedSampleId}/images")
    public ResponseEntity<List<SampleImageResponse>> getFeedSampleImages(@PathVariable Long feedSampleId) {
        List<SampleImageResponse> responses = sampleImageService.getFeedSampleImages(feedSampleId);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get feed sample image metadata", description = "Retrieves metadata for a specific feed sample image.")
    @GetMapping("/feed-samples/{feedSampleId}/images/{imageId}")
    public ResponseEntity<SampleImageResponse> getFeedSampleImageById(
            @PathVariable Long feedSampleId,
            @PathVariable Long imageId
    ) {
        SampleImageResponse response = sampleImageService.getFeedSampleImageById(feedSampleId, imageId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Download/serve feed sample image file", description = "Streams the binary image file for viewing in UI or downloading.")
    @GetMapping("/feed-samples/{feedSampleId}/images/{imageId}/file")
    public ResponseEntity<Resource> getFeedSampleImageFile(
            @PathVariable Long feedSampleId,
            @PathVariable Long imageId
    ) {
        SampleImageResponse metadata = sampleImageService.getFeedSampleImageById(feedSampleId, imageId);
        Resource resource = sampleImageService.loadFeedSampleImageResource(feedSampleId, imageId);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(metadata.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.IMAGE_JPEG;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getOriginalFilename() + "\"")
                .body(resource);
    }

    @Operation(summary = "Analyze feed sample image with AI", description = "Forwards the stored sample image to the Python FastAPI microservice for visual screening.")
    @PostMapping("/feed-samples/{feedSampleId}/images/{imageId}/analyze")
    public ResponseEntity<VisualAnalysisResponse> analyzeFeedSampleImage(
            @PathVariable Long feedSampleId,
            @PathVariable Long imageId
    ) {
        SampleImageResponse metadata = sampleImageService.getFeedSampleImageById(feedSampleId, imageId);
        Resource resource = sampleImageService.loadFeedSampleImageResource(feedSampleId, imageId);
        try {
            byte[] imageBytes = resource.getInputStream().readAllBytes();
            VisualAnalysisResponse response = aiServiceClient.analyzeImage(
                    imageBytes,
                    metadata.getOriginalFilename(),
                    metadata.getContentType()
            );
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read sample image resource from disk: " + e.getMessage(), e);
        }
    }

    @Operation(summary = "Delete feed sample image", description = "Deletes an image attachment and removes the stored file from disk.")
    @DeleteMapping("/feed-samples/{feedSampleId}/images/{imageId}")
    public ResponseEntity<Void> deleteFeedSampleImage(
            @PathVariable Long feedSampleId,
            @PathVariable Long imageId
    ) {
        sampleImageService.deleteFeedSampleImage(feedSampleId, imageId);
        return ResponseEntity.noContent().build();
    }

    // ── Silage Sample Image Endpoints ─────────────────────────────────────────

    @Operation(summary = "Upload image for silage sample", description = "Uploads a photo captured via mobile camera, PC webcam, or gallery for a silage sample.")
    @PostMapping(value = "/silage-samples/{silageSampleId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SampleImageResponse> uploadSilageSampleImage(
            @PathVariable Long silageSampleId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption
    ) {
        SampleImageResponse response = sampleImageService.uploadSilageSampleImage(silageSampleId, file, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "List silage sample images", description = "Retrieves all image attachments associated with a silage sample.")
    @GetMapping("/silage-samples/{silageSampleId}/images")
    public ResponseEntity<List<SampleImageResponse>> getSilageSampleImages(@PathVariable Long silageSampleId) {
        List<SampleImageResponse> responses = sampleImageService.getSilageSampleImages(silageSampleId);
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get silage sample image metadata", description = "Retrieves metadata for a specific silage sample image.")
    @GetMapping("/silage-samples/{silageSampleId}/images/{imageId}")
    public ResponseEntity<SampleImageResponse> getSilageSampleImageById(
            @PathVariable Long silageSampleId,
            @PathVariable Long imageId
    ) {
        SampleImageResponse response = sampleImageService.getSilageSampleImageById(silageSampleId, imageId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Download/serve silage sample image file", description = "Streams the binary image file for viewing in UI or downloading.")
    @GetMapping("/silage-samples/{silageSampleId}/images/{imageId}/file")
    public ResponseEntity<Resource> getSilageSampleImageFile(
            @PathVariable Long silageSampleId,
            @PathVariable Long imageId
    ) {
        SampleImageResponse metadata = sampleImageService.getSilageSampleImageById(silageSampleId, imageId);
        Resource resource = sampleImageService.loadSilageSampleImageResource(silageSampleId, imageId);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(metadata.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.IMAGE_JPEG;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getOriginalFilename() + "\"")
                .body(resource);
    }

    @Operation(summary = "Analyze silage sample image with AI", description = "Forwards the stored sample image to the Python FastAPI microservice for visual screening.")
    @PostMapping("/silage-samples/{silageSampleId}/images/{imageId}/analyze")
    public ResponseEntity<VisualAnalysisResponse> analyzeSilageSampleImage(
            @PathVariable Long silageSampleId,
            @PathVariable Long imageId
    ) {
        SampleImageResponse metadata = sampleImageService.getSilageSampleImageById(silageSampleId, imageId);
        Resource resource = sampleImageService.loadSilageSampleImageResource(silageSampleId, imageId);
        try {
            byte[] imageBytes = resource.getInputStream().readAllBytes();
            VisualAnalysisResponse response = aiServiceClient.analyzeImage(
                    imageBytes,
                    metadata.getOriginalFilename(),
                    metadata.getContentType()
            );
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read sample image resource from disk: " + e.getMessage(), e);
        }
    }

    @Operation(summary = "Delete silage sample image", description = "Deletes an image attachment and removes the stored file from disk.")
    @DeleteMapping("/silage-samples/{silageSampleId}/images/{imageId}")
    public ResponseEntity<Void> deleteSilageSampleImage(
            @PathVariable Long silageSampleId,
            @PathVariable Long imageId
    ) {
        sampleImageService.deleteSilageSampleImage(silageSampleId, imageId);
        return ResponseEntity.noContent().build();
    }
}
