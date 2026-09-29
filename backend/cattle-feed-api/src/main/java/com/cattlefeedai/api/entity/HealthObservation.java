package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.ActivityStatus;
import com.cattlefeedai.api.entity.enums.AppetiteStatus;
import com.cattlefeedai.api.entity.enums.MilkProductionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_observations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HealthObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate observationDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AppetiteStatus appetiteStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MilkProductionStatus milkProductionStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ActivityStatus activityStatus;

    @Column(length = 500)
    private String digestiveObservation;

    @Column(length = 500)
    private String visibleSigns;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
