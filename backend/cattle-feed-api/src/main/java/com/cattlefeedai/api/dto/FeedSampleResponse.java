package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.FeedSample;
import com.cattlefeedai.api.entity.enums.FeedType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Safe response payload for a FeedSample.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedSampleResponse {

    private Long id;
    private Long farmId;
    private Long animalId;
    private String sampleCode;
    private FeedType feedType;
    private LocalDate sampleDate;
    private String source;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FeedSampleResponse fromEntity(FeedSample entity) {
        if (entity == null) {
            return null;
        }
        return FeedSampleResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarm() != null ? entity.getFarm().getId() : null)
                .animalId(entity.getAnimal() != null ? entity.getAnimal().getId() : null)
                .sampleCode(entity.getSampleCode())
                .feedType(entity.getFeedType())
                .sampleDate(entity.getSampleDate())
                .source(entity.getSource())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
