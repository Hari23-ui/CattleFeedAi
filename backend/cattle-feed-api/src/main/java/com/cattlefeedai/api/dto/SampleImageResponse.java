package com.cattlefeedai.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO for sample image metadata.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SampleImageResponse {

    private Long id;
    private String sampleType;
    private Long sampleId;
    private String originalFilename;
    private String storedFilename;
    private String fileReference;
    private String contentType;
    private Long fileSize;
    private String caption;
    private LocalDateTime createdAt;
}
