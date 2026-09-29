package com.cattlefeedai.api.dto.analytics;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SampleHistoricalTrendsResponse {

    private Long sampleId;
    private String sampleCode;
    private String sampleType; // "FEED" or "SILAGE"
    private String subtype;    // e.g. CONCENTRATE, CORN_SILAGE, etc.
    private Long farmId;
    private String farmName;
    private Long animalId;
    private String animalTag;
    private LocalDate sampleDate;

    private long totalTestPoints;
    private Integer daysFilter;

    private List<HistoricalTestPointDto> testPoints;
    private Map<String, Long> qualityStatusDistribution;
    private Map<String, Long> riskDistribution;

    private String descriptiveSummary;
    private String disclaimer;
}
