# CattleFeedAI — Database Design Document

## 1. Entity List

| # | Entity | Table Name | Purpose |
|---|--------|------------|---------|
| 1 | User | `users` | Application user accounts (farmers, experts, admins) |
| 2 | Farm | `farms` | Farm profiles owned by farmers |
| 3 | Animal | `animals` | Individual cattle/livestock records |
| 4 | FeedSample | `feed_samples` | Recorded feed samples for quality testing |
| 5 | SilageSample | `silage_samples` | Recorded silage samples for quality testing |
| 6 | TestResult | `test_results` | Quality measurement results (linked to feed or silage samples) |
| 7 | HealthObservation | `health_observations` | Farmer-recorded animal health observations |
| 8 | HealthRisk | `health_risks` | Possible health risks identified from data (screening only) |
| 9 | Advisory | `advisories` | Feed, silage, storage, and health advisories per animal |
| 10 | Expert | `experts` | Expert profile extending a User account |
| 11 | Consultation | `consultations` | Farmer-expert consultation requests and responses |
| 12 | FeedPlan | `feed_plans` | Structured feeding plans/recommendations per animal |
| 13 | StorageUnit | `storage_units` | Feed/silage storage units within a farm |
| 14 | SensorReading | `sensor_readings` | Environmental sensor data from storage units |
| 15 | Alert | `alerts` | System notifications for users |

---

## 2. Entity Details

### 2.1 User

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| username | VARCHAR(50) | NOT NULL, UNIQUE |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL, never exposed in API responses |
| role | ENUM(STRING) | NOT NULL — FARMER, EXPERT, ADMIN |
| phone | VARCHAR(20) | |
| language | VARCHAR(10) | |
| is_active | BOOLEAN | NOT NULL, default TRUE |
| created_at | DATETIME | NOT NULL, auto-set |
| updated_at | DATETIME | NOT NULL, auto-set |

### 2.2 Farm

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| farm_name | VARCHAR(100) | NOT NULL |
| location | VARCHAR(255) | |
| district | VARCHAR(100) | |
| state | VARCHAR(100) | |
| pincode | VARCHAR(10) | |
| owner_id | BIGINT | FK → users(id), NOT NULL |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### 2.3 Animal

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| animal_tag | VARCHAR(50) | NOT NULL, UNIQUE per farm |
| name | VARCHAR(100) | |
| breed | VARCHAR(100) | |
| gender | ENUM(STRING) | MALE, FEMALE |
| date_of_birth | DATE | |
| weight | DECIMAL(8,2) | |
| lactation_stage | ENUM(STRING) | DRY, EARLY, MID, LATE |
| days_in_milk | INT | |
| milk_production_per_day | DECIMAL(8,2) | |
| pregnancy_status | ENUM(STRING) | PREGNANT, NOT_PREGNANT, UNKNOWN |
| feed_intake_status | ENUM(STRING) | NORMAL, REDUCED, INCREASED, UNKNOWN |
| farm_id | BIGINT | FK → farms(id), NOT NULL |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

**Composite Unique:** `(animal_tag, farm_id)`

### 2.4 FeedSample

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| sample_code | VARCHAR(50) | NOT NULL, UNIQUE |
| feed_type | ENUM(STRING) | NOT NULL |
| sample_date | DATE | NOT NULL |
| source | VARCHAR(255) | |
| notes | TEXT | |
| animal_id | BIGINT | FK → animals(id), nullable |
| farm_id | BIGINT | FK → farms(id), NOT NULL |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### 2.5 SilageSample

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| sample_code | VARCHAR(50) | NOT NULL, UNIQUE |
| silage_type | ENUM(STRING) | NOT NULL |
| sample_date | DATE | NOT NULL |
| source | VARCHAR(255) | |
| notes | TEXT | |
| animal_id | BIGINT | FK → animals(id), nullable |
| farm_id | BIGINT | FK → farms(id), NOT NULL |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### 2.6 TestResult

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| test_date | DATE | NOT NULL |
| moisture | DECIMAL(6,2) | nullable |
| crude_protein | DECIMAL(6,2) | nullable |
| fiber | DECIMAL(6,2) | nullable |
| energy_value | DECIMAL(8,2) | nullable |
| mineral_status | VARCHAR(100) | nullable |
| aflatoxin | DECIMAL(8,4) | nullable |
| mycotoxin | DECIMAL(8,4) | nullable |
| ph | DECIMAL(5,2) | nullable |
| adulteration | VARCHAR(100) | nullable |
| mould_detected | BOOLEAN | nullable |
| spoilage_detected | BOOLEAN | nullable |
| overall_quality | ENUM(STRING) | GOOD, MODERATE, POOR, UNSAFE, UNKNOWN |
| confidence_score | DECIMAL(5,2) | nullable |
| analysis_source | ENUM(STRING) | MANUAL, LAB, NIR, IOT, AI, IMAGE |
| feed_sample_id | BIGINT | FK → feed_samples(id), nullable |
| silage_sample_id | BIGINT | FK → silage_samples(id), nullable |
| created_at | DATETIME | NOT NULL |

**Design Note:** All measurement fields are nullable because different test types provide different subsets of measurements. Historical records are never overwritten — each test creates a new row.

### 2.7 HealthObservation

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| observation_date | DATE | NOT NULL |
| appetite_status | ENUM(STRING) | NORMAL, REDUCED, INCREASED, UNKNOWN |
| milk_production_status | ENUM(STRING) | NORMAL, REDUCED, INCREASED, UNKNOWN |
| activity_status | ENUM(STRING) | NORMAL, REDUCED, ABNORMAL, UNKNOWN |
| digestive_observation | VARCHAR(500) | |
| visible_signs | VARCHAR(500) | |
| notes | TEXT | |
| animal_id | BIGINT | FK → animals(id), NOT NULL |
| created_at | DATETIME | NOT NULL |

**Important:** This stores observations, not diagnoses.

### 2.8 HealthRisk

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| risk_type | VARCHAR(100) | NOT NULL |
| risk_level | ENUM(STRING) | NOT NULL — LOW, MEDIUM, HIGH, UNKNOWN |
| description | TEXT | |
| detected_date | DATE | NOT NULL |
| source | ENUM(STRING) | RULE_BASED, AI, EXPERT |
| recommendation | TEXT | |
| animal_id | BIGINT | FK → animals(id), NOT NULL |
| created_at | DATETIME | NOT NULL |

**Important:** This entity represents **health-risk screening only**. It does NOT perform or claim disease diagnosis.

### 2.9 Advisory

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| title | VARCHAR(200) | NOT NULL |
| message | TEXT | NOT NULL |
| advisory_type | ENUM(STRING) | NOT NULL |
| priority | ENUM(STRING) | NOT NULL — LOW, MEDIUM, HIGH |
| is_read | BOOLEAN | NOT NULL, default FALSE |
| animal_id | BIGINT | FK → animals(id), NOT NULL |
| created_at | DATETIME | NOT NULL |

### 2.10 Expert

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| qualification | VARCHAR(200) | |
| specialization | ENUM(STRING) | ANIMAL_NUTRITION, VETERINARY, DAIRY_MANAGEMENT, OTHER |
| experience_years | INT | |
| license_number | VARCHAR(50) | |
| bio | TEXT | |
| availability_status | ENUM(STRING) | AVAILABLE, BUSY, OFFLINE |
| user_id | BIGINT | FK → users(id), NOT NULL, UNIQUE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

**Note:** Expert does not duplicate User data. It extends a User with role=EXPERT via a 1:1 relationship.

### 2.11 Consultation

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| request_date | DATE | NOT NULL |
| subject | VARCHAR(200) | NOT NULL |
| farmer_message | TEXT | NOT NULL |
| expert_response | TEXT | nullable |
| status | ENUM(STRING) | NOT NULL |
| response_date | DATE | nullable |
| farmer_id | BIGINT | FK → users(id), NOT NULL |
| expert_id | BIGINT | FK → experts(id), nullable |
| animal_id | BIGINT | FK → animals(id), nullable |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### 2.12 FeedPlan

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| plan_name | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| start_date | DATE | NOT NULL |
| end_date | DATE | nullable |
| status | VARCHAR(20) | |
| animal_id | BIGINT | FK → animals(id), NOT NULL |
| expert_id | BIGINT | FK → experts(id), nullable |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### 2.13 StorageUnit

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| name | VARCHAR(100) | NOT NULL |
| storage_type | ENUM(STRING) | NOT NULL |
| location | VARCHAR(255) | |
| capacity | VARCHAR(100) | |
| farm_id | BIGINT | FK → farms(id), NOT NULL |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### 2.14 SensorReading

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| reading_time | DATETIME | NOT NULL |
| temperature | DECIMAL(5,2) | nullable |
| humidity | DECIMAL(5,2) | nullable |
| ph | DECIMAL(5,2) | nullable |
| gas_level | DECIMAL(8,4) | nullable |
| mould_risk_indicator | DECIMAL(5,2) | nullable |
| source | ENUM(STRING) | MANUAL, IOT |
| storage_unit_id | BIGINT | FK → storage_units(id), NOT NULL |
| created_at | DATETIME | NOT NULL |

**Note:** This entity is designed for future IoT (ESP32) integration. Currently supports manual data entry.

### 2.15 Alert

| Field | Type | Constraints |
|-------|------|-------------|
| id | BIGINT | PK, auto-generated |
| title | VARCHAR(200) | NOT NULL |
| message | TEXT | NOT NULL |
| alert_type | ENUM(STRING) | NOT NULL |
| severity | ENUM(STRING) | NOT NULL — INFO, WARNING, CRITICAL |
| is_read | BOOLEAN | NOT NULL, default FALSE |
| user_id | BIGINT | FK → users(id), NOT NULL |
| created_at | DATETIME | NOT NULL |

---

## 3. Enum Definitions

| Enum | Values | Used By |
|------|--------|---------|
| Role | FARMER, EXPERT, ADMIN | User |
| Gender | MALE, FEMALE | Animal |
| LactationStage | DRY, EARLY, MID, LATE | Animal |
| PregnancyStatus | PREGNANT, NOT_PREGNANT, UNKNOWN | Animal |
| FeedIntakeStatus | NORMAL, REDUCED, INCREASED, UNKNOWN | Animal |
| FeedType | CATTLE_FEED_PELLET, FEED_MASH, MINERAL_MIXTURE, GREEN_FODDER, DRY_FODDER, OTHER | FeedSample |
| SilageType | MAIZE, SORGHUM, NAPIER, MIXED, OTHER | SilageSample |
| AnalysisSource | MANUAL, LAB, NIR, IOT, AI, IMAGE | TestResult |
| OverallQuality | GOOD, MODERATE, POOR, UNSAFE, UNKNOWN | TestResult |
| AppetiteStatus | NORMAL, REDUCED, INCREASED, UNKNOWN | HealthObservation |
| MilkProductionStatus | NORMAL, REDUCED, INCREASED, UNKNOWN | HealthObservation |
| ActivityStatus | NORMAL, REDUCED, ABNORMAL, UNKNOWN | HealthObservation |
| RiskLevel | LOW, MEDIUM, HIGH, UNKNOWN | HealthRisk |
| RiskSource | RULE_BASED, AI, EXPERT | HealthRisk |
| AdvisoryType | FEED, SILAGE, STORAGE, NUTRITION, HEALTH_RISK, GENERAL | Advisory |
| Priority | LOW, MEDIUM, HIGH | Advisory |
| Specialization | ANIMAL_NUTRITION, VETERINARY, DAIRY_MANAGEMENT, OTHER | Expert |
| AvailabilityStatus | AVAILABLE, BUSY, OFFLINE | Expert |
| ConsultationStatus | REQUESTED, IN_REVIEW, RESPONDED, CLOSED, CANCELLED | Consultation |
| StorageType | FEED_STORAGE, SILAGE_STORAGE, MIXED_STORAGE, OTHER | StorageUnit |
| SensorSource | MANUAL, IOT | SensorReading |
| AlertType | FEED_QUALITY, SILAGE_QUALITY, STORAGE, HEALTH_RISK, CONSULTATION, GENERAL | Alert |
| Severity | INFO, WARNING, CRITICAL | Alert |

---

## 4. Relationship Map

```
User
 ├── 1:N → Farm (owner)
 ├── 1:1 → Expert (when role = EXPERT)
 ├── 1:N → Consultation (as farmer)
 └── 1:N → Alert

Farm
 ├── N:1 → User (owner)
 ├── 1:N → Animal
 ├── 1:N → FeedSample
 ├── 1:N → SilageSample
 └── 1:N → StorageUnit

Animal
 ├── N:1 → Farm
 ├── 1:N → FeedSample
 ├── 1:N → SilageSample
 ├── 1:N → HealthObservation
 ├── 1:N → HealthRisk
 ├── 1:N → Advisory
 └── 1:N → FeedPlan

FeedSample
 ├── N:1 → Farm
 ├── N:1 → Animal (optional)
 └── 1:N → TestResult

SilageSample
 ├── N:1 → Farm
 ├── N:1 → Animal (optional)
 └── 1:N → TestResult

TestResult
 ├── N:1 → FeedSample (optional)
 └── N:1 → SilageSample (optional)

Expert
 ├── 1:1 → User
 └── 1:N → Consultation

Consultation
 ├── N:1 → User (farmer)
 ├── N:1 → Expert (optional)
 └── N:1 → Animal (optional)

FeedPlan
 ├── N:1 → Animal
 └── N:1 → Expert (optional)

StorageUnit
 ├── N:1 → Farm
 └── 1:N → SensorReading

Alert
 └── N:1 → User
```

---

## 5. Historical Data Preservation

The database design preserves all historical test records. When a new test is performed on the same sample, a new `TestResult` row is created — existing records are never overwritten.

Example flow:

```
Animal COW001 → FeedSample FS-001 → TestResult #1 (protein=18)
                                   → TestResult #2 (protein=20)
                                   → TestResult #3 (protein=17)
```

All three records remain, enabling:
- Test history retrieval
- Graph/chart visualization
- Trend analysis over time
- Advisory generation based on trends

---

## 6. Future IoT Integration

The `SensorReading` entity is pre-designed for ESP32/IoT integration:

- `source` field distinguishes `MANUAL` vs `IOT` entries
- All measurement fields are nullable (different sensors measure different parameters)
- `StorageUnit` → `SensorReading` (1:N) models the physical relationship
- The `AnalysisSource` enum in `TestResult` includes `IOT` and `NIR` values

No ESP32 code is implemented. The schema is ready to receive IoT data when hardware integration is built.

---

## 7. Future AI Integration

The schema supports future AI/ML integration:

- `TestResult.analysisSource` can be `AI` or `IMAGE`
- `HealthRisk.source` can be `AI`
- The `RiskSource` enum distinguishes rule-based, AI, and expert-originated risks
- TestResult measurement fields are nullable to accommodate AI predictions arriving at different times

---

## 8. Health-Risk Screening Limitation

> **IMPORTANT:** The `HealthRisk` entity represents **health-risk screening only**. The system identifies **possible health risks** based on available data. It does **NOT** perform or claim definitive disease diagnosis.

> **IMPORTANT:** Smartphone cameras **cannot** chemically measure protein, moisture, aflatoxin, or mycotoxin levels. Any future camera-based features will be limited to visual inspection only and will clearly state their limitations.
