package com.cattlefeedai.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity representing an image attachment for a FeedSample or SilageSample.
 * Supports image capture from mobile camera or PC webcam, as well as gallery upload.
 */
@Entity
@Table(name = "sample_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SampleImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feed_sample_id")
    private FeedSample feedSample;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silage_sample_id")
    private SilageSample silageSample;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false, unique = true, length = 255)
    private String storedFilename;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_reference", nullable = false, length = 500)
    private String fileReference;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(length = 255)
    private String caption;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
