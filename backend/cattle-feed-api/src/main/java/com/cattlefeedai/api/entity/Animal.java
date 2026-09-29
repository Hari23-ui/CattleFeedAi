package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "animals", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"animal_tag", "farm_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "animal_tag", nullable = false, length = 50)
    private String animalTag;

    @Column(length = 100)
    private String name;

    @Column(length = 100)
    private String breed;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    private LocalDate dateOfBirth;

    @Column(precision = 8, scale = 2)
    private BigDecimal weight;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private LactationStage lactationStage;

    private Integer daysInMilk;

    @Column(precision = 8, scale = 2)
    private BigDecimal milkProductionPerDay;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PregnancyStatus pregnancyStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private FeedIntakeStatus feedIntakeStatus;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @JsonIgnore
    @OneToMany(mappedBy = "animal", fetch = FetchType.LAZY)
    private List<FeedSample> feedSamples = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "animal", fetch = FetchType.LAZY)
    private List<SilageSample> silageSamples = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "animal", fetch = FetchType.LAZY)
    private List<HealthObservation> healthObservations = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "animal", fetch = FetchType.LAZY)
    private List<HealthRisk> healthRisks = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "animal", fetch = FetchType.LAZY)
    private List<Advisory> advisories = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "animal", fetch = FetchType.LAZY)
    private List<FeedPlan> feedPlans = new ArrayList<>();

    // ── Lifecycle Callbacks ────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
