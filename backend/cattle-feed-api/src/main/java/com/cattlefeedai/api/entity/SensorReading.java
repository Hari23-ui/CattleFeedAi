package com.cattlefeedai.api.entity;

import com.cattlefeedai.api.entity.enums.SensorSource;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stores sensor readings from storage units.
 * Designed for future IoT (ESP32) integration.
 * Currently supports manual data entry.
 */
@Entity
@Table(name = "sensor_readings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime readingTime;

    @Column(precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(precision = 5, scale = 2)
    private BigDecimal humidity;

    @Column(precision = 5, scale = 2)
    private BigDecimal ph;

    @Column(precision = 8, scale = 4)
    private BigDecimal gasLevel;

    @Column(precision = 5, scale = 2)
    private BigDecimal mouldRiskIndicator;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private SensorSource source;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ──────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "storage_unit_id", nullable = false)
    private StorageUnit storageUnit;

    // ── Lifecycle Callbacks ────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
