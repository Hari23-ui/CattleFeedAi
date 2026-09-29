package com.cattlefeedai.api.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO representing an identified visual surface observation.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisualIndicatorDto {

    private String type;
    private String label;
    private BigDecimal confidence;
    private String severity;
    private String evidence;
}
