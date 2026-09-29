package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.AvailabilityStatus;
import com.cattlefeedai.api.entity.enums.Specialization;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "experts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Expert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200)
    private String qualification;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Specialization specialization;

    private Integer experienceYears;

    @Column(length = 50)
    private String licenseNumber;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AvailabilityStatus availabilityStatus;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @JsonIgnore
    @OneToMany(mappedBy = "expert", fetch = FetchType.LAZY)
    private List<Consultation> consultations = new ArrayList<>();

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
