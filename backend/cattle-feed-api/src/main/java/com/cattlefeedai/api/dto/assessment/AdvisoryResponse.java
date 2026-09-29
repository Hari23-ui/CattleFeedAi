package com.cattlefeedai.api.dto.assessment;

import com.cattlefeedai.api.entity.Advisory;
import com.cattlefeedai.api.entity.enums.AdvisoryCategory;
import com.cattlefeedai.api.entity.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Safe Advisory response DTO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvisoryResponse {

    private Long id;
    private Long animalId;
    private String animalTag;
    private AdvisoryCategory category;
    private Priority priority;
    private String title;
    private String message;
    private String recommendedAction;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static AdvisoryResponse fromEntity(Advisory advisory, String recommendedAction, AdvisoryCategory category) {
        if (advisory == null) {
            return null;
        }
        return AdvisoryResponse.builder()
                .id(advisory.getId())
                .animalId(advisory.getAnimal() != null ? advisory.getAnimal().getId() : null)
                .animalTag(advisory.getAnimal() != null ? advisory.getAnimal().getAnimalTag() : null)
                .category(category != null ? category : (advisory.getAdvisoryType() != null ? AdvisoryCategory.valueOf(advisory.getAdvisoryType().name()) : null))
                .priority(advisory.getPriority())
                .title(advisory.getTitle())
                .message(advisory.getMessage())
                .recommendedAction(recommendedAction)
                .isRead(advisory.getIsRead())
                .createdAt(advisory.getCreatedAt())
                .build();
    }
}
