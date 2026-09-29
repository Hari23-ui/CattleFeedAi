package com.cattlefeedai.api.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * DTO representing physical image quality assessment results.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageQualityDto {

    private String status;
    private List<String> issues;
    private Map<String, Object> metrics;
}
