package com.cattlefeedai.api.dto.consultation;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpertRecommendationRequest {

    @NotBlank(message = "Expert recommendation is required")
    private String recommendation;

    private String expertNotes;
}
