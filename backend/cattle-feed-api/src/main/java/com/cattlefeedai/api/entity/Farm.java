package com.cattlefeedai.api.entity;

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
@Table(name = "farms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Farm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String farmName;

    @Column(length = 255)
    private String location;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @JsonIgnore
    @OneToMany(mappedBy = "farm", fetch = FetchType.LAZY)
    private List<Animal> animals = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "farm", fetch = FetchType.LAZY)
    private List<FeedSample> feedSamples = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "farm", fetch = FetchType.LAZY)
    private List<SilageSample> silageSamples = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "farm", fetch = FetchType.LAZY)
    private List<StorageUnit> storageUnits = new ArrayList<>();

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
