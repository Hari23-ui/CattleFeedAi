package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.FeedType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "feed_samples", uniqueConstraints = {
        @UniqueConstraint(columnNames = "sample_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sample_code", nullable = false, unique = true, length = 50)
    private String sampleCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FeedType feedType;

    @Column(nullable = false)
    private LocalDate sampleDate;

    @Column(length = 255)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id")
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @JsonIgnore
    @OneToMany(mappedBy = "feedSample", fetch = FetchType.LAZY)
    private List<TestResult> testResults = new ArrayList<>();

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
