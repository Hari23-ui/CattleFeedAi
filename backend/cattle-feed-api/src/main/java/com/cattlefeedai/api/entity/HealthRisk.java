package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.RiskLevel;
import com.cattlefeedai.api.entity.enums.RiskSource;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a possible health risk identified from available data.
 * This is health-risk screening only — NOT definitive disease diagnosis.
 */
@Entity
@Table(name = "health_risks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HealthRisk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String riskType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RiskLevel riskLevel;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate detectedDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RiskSource source;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    // ── Lifecycle Callbacks ────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
