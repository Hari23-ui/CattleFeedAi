package com.cattlefeedai.api.dto.consultation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationRequest {

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject must not exceed 200 characters")
    private String subject;

    @NotBlank(message = "Farmer question is required")
    private String question;

    private String additionalContext;

    private Long animalId;

    private Long feedSampleId;

    private Long silageSampleId;
}
