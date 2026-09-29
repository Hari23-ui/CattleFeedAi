package com.cattlefeedai.api.dto;

import com.cattlefeedai.api.entity.SilageSample;
import com.cattlefeedai.api.entity.enums.SilageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Safe response payload for a SilageSample.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SilageSampleResponse {

    private Long id;
    private Long farmId;
    private Long animalId;
    private String sampleCode;
    private SilageType silageType;
    private LocalDate sampleDate;
    private String source;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SilageSampleResponse fromEntity(SilageSample entity) {
        if (entity == null) {
            return null;
        }
        return SilageSampleResponse.builder()
                .id(entity.getId())
                .farmId(entity.getFarm() != null ? entity.getFarm().getId() : null)
                .animalId(entity.getAnimal() != null ? entity.getAnimal().getId() : null)
                .sampleCode(entity.getSampleCode())
                .silageType(entity.getSilageType())
                .sampleDate(entity.getSampleDate())
                .source(entity.getSource())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
