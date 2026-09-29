package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.AnalysisSource;
import com.cattlefeedai.api.entity.enums.OverallQuality;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate testDate;

    // ── Measured Parameters (all nullable) ─────────────────────

    @Column(precision = 6, scale = 2)
    private BigDecimal moisture;

    @Column(precision = 6, scale = 2)
    private BigDecimal crudeProtein;

    @Column(precision = 6, scale = 2)
    private BigDecimal fiber;

    @Column(precision = 8, scale = 2)
    private BigDecimal energyValue;

    @Column(length = 100)
    private String mineralStatus;

    @Column(precision = 8, scale = 4)
    private BigDecimal aflatoxin;

    @Column(precision = 8, scale = 4)
    private BigDecimal mycotoxin;

    @Column(precision = 5, scale = 2)
    private BigDecimal ph;

    @Column(length = 100)
    private String adulteration;

    private Boolean mouldDetected;

    private Boolean spoilageDetected;

    // ── Quality Assessment ─────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private OverallQuality overallQuality;

    @Column(precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AnalysisSource analysisSource;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feed_sample_id")
    private FeedSample feedSample;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silage_sample_id")
    private SilageSample silageSample;

    // ── Lifecycle Callbacks ────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
