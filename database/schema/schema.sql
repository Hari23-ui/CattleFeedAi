-- ============================================================
-- CattleFeedAI Database Schema
-- Generated from JPA Entity Design
-- Database: MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS cattlefeedai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cattlefeedai;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    language VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
) ENGINE=InnoDB;

-- ============================================================
-- 2. FARMS
-- ============================================================
CREATE TABLE farms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    farm_name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    owner_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_farms_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_farms_owner ON farms(owner_id);

-- ============================================================
-- 3. ANIMALS
-- ============================================================
CREATE TABLE animals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    animal_tag VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    breed VARCHAR(100),
    gender VARCHAR(10),
    date_of_birth DATE,
    weight DECIMAL(8,2),
    lactation_stage VARCHAR(10),
    days_in_milk INT,
    milk_production_per_day DECIMAL(8,2),
    pregnancy_status VARCHAR(20),
    feed_intake_status VARCHAR(20),
    farm_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_animals_farm FOREIGN KEY (farm_id) REFERENCES farms(id),
    CONSTRAINT uk_animals_tag_farm UNIQUE (animal_tag, farm_id)
) ENGINE=InnoDB;

CREATE INDEX idx_animals_farm ON animals(farm_id);

-- ============================================================
-- 4. FEED SAMPLES
-- ============================================================
CREATE TABLE feed_samples (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sample_code VARCHAR(50) NOT NULL,
    feed_type VARCHAR(30) NOT NULL,
    sample_date DATE NOT NULL,
    source VARCHAR(255),
    notes TEXT,
    animal_id BIGINT,
    farm_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_feed_samples_code UNIQUE (sample_code),
    CONSTRAINT fk_feed_samples_animal FOREIGN KEY (animal_id) REFERENCES animals(id),
    CONSTRAINT fk_feed_samples_farm FOREIGN KEY (farm_id) REFERENCES farms(id)
) ENGINE=InnoDB;

CREATE INDEX idx_feed_samples_farm ON feed_samples(farm_id);
CREATE INDEX idx_feed_samples_animal ON feed_samples(animal_id);

-- ============================================================
-- 5. SILAGE SAMPLES
-- ============================================================
CREATE TABLE silage_samples (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sample_code VARCHAR(50) NOT NULL,
    silage_type VARCHAR(20) NOT NULL,
    sample_date DATE NOT NULL,
    source VARCHAR(255),
    notes TEXT,
    animal_id BIGINT,
    farm_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_silage_samples_code UNIQUE (sample_code),
    CONSTRAINT fk_silage_samples_animal FOREIGN KEY (animal_id) REFERENCES animals(id),
    CONSTRAINT fk_silage_samples_farm FOREIGN KEY (farm_id) REFERENCES farms(id)
) ENGINE=InnoDB;

CREATE INDEX idx_silage_samples_farm ON silage_samples(farm_id);
CREATE INDEX idx_silage_samples_animal ON silage_samples(animal_id);

-- ============================================================
-- 6. TEST RESULTS
-- ============================================================
CREATE TABLE test_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_date DATE NOT NULL,
    moisture DECIMAL(6,2),
    crude_protein DECIMAL(6,2),
    fiber DECIMAL(6,2),
    energy_value DECIMAL(8,2),
    mineral_status VARCHAR(100),
    aflatoxin DECIMAL(8,4),
    mycotoxin DECIMAL(8,4),
    ph DECIMAL(5,2),
    adulteration VARCHAR(100),
    mould_detected BOOLEAN,
    spoilage_detected BOOLEAN,
    overall_quality VARCHAR(20),
    confidence_score DECIMAL(5,2),
    analysis_source VARCHAR(20),
    feed_sample_id BIGINT,
    silage_sample_id BIGINT,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_test_results_feed FOREIGN KEY (feed_sample_id) REFERENCES feed_samples(id),
    CONSTRAINT fk_test_results_silage FOREIGN KEY (silage_sample_id) REFERENCES silage_samples(id)
) ENGINE=InnoDB;

CREATE INDEX idx_test_results_feed ON test_results(feed_sample_id);
CREATE INDEX idx_test_results_silage ON test_results(silage_sample_id);

-- ============================================================
-- 7. HEALTH OBSERVATIONS
-- ============================================================
CREATE TABLE health_observations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    observation_date DATE NOT NULL,
    appetite_status VARCHAR(20),
    milk_production_status VARCHAR(20),
    activity_status VARCHAR(20),
    digestive_observation VARCHAR(500),
    visible_signs VARCHAR(500),
    notes TEXT,
    animal_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_health_obs_animal FOREIGN KEY (animal_id) REFERENCES animals(id)
) ENGINE=InnoDB;

CREATE INDEX idx_health_obs_animal ON health_observations(animal_id);

-- ============================================================
-- 8. HEALTH RISKS (Screening Only — NOT Diagnosis)
-- ============================================================
CREATE TABLE health_risks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    risk_type VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    description TEXT,
    detected_date DATE NOT NULL,
    source VARCHAR(20),
    recommendation TEXT,
    animal_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_health_risks_animal FOREIGN KEY (animal_id) REFERENCES animals(id)
) ENGINE=InnoDB;

CREATE INDEX idx_health_risks_animal ON health_risks(animal_id);

-- ============================================================
-- 9. ADVISORIES
-- ============================================================
CREATE TABLE advisories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    advisory_type VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    animal_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_advisories_animal FOREIGN KEY (animal_id) REFERENCES animals(id)
) ENGINE=InnoDB;

CREATE INDEX idx_advisories_animal ON advisories(animal_id);

-- ============================================================
-- 10. EXPERTS
-- ============================================================
CREATE TABLE experts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    qualification VARCHAR(200),
    specialization VARCHAR(30),
    experience_years INT,
    license_number VARCHAR(50),
    bio TEXT,
    availability_status VARCHAR(20),
    user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_experts_user UNIQUE (user_id),
    CONSTRAINT fk_experts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. CONSULTATIONS
-- ============================================================
CREATE TABLE consultations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_date DATE NOT NULL,
    subject VARCHAR(200) NOT NULL,
    farmer_message TEXT NOT NULL,
    expert_response TEXT,
    status VARCHAR(20) NOT NULL,
    response_date DATE,
    farmer_id BIGINT NOT NULL,
    expert_id BIGINT,
    animal_id BIGINT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_consultations_farmer FOREIGN KEY (farmer_id) REFERENCES users(id),
    CONSTRAINT fk_consultations_expert FOREIGN KEY (expert_id) REFERENCES experts(id),
    CONSTRAINT fk_consultations_animal FOREIGN KEY (animal_id) REFERENCES animals(id)
) ENGINE=InnoDB;

CREATE INDEX idx_consultations_farmer ON consultations(farmer_id);
CREATE INDEX idx_consultations_expert ON consultations(expert_id);

-- ============================================================
-- 12. FEED PLANS
-- ============================================================
CREATE TABLE feed_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20),
    animal_id BIGINT NOT NULL,
    expert_id BIGINT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_feed_plans_animal FOREIGN KEY (animal_id) REFERENCES animals(id),
    CONSTRAINT fk_feed_plans_expert FOREIGN KEY (expert_id) REFERENCES experts(id)
) ENGINE=InnoDB;

CREATE INDEX idx_feed_plans_animal ON feed_plans(animal_id);

-- ============================================================
-- 13. STORAGE UNITS
-- ============================================================
CREATE TABLE storage_units (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    storage_type VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    capacity VARCHAR(100),
    farm_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_storage_units_farm FOREIGN KEY (farm_id) REFERENCES farms(id)
) ENGINE=InnoDB;

CREATE INDEX idx_storage_units_farm ON storage_units(farm_id);

-- ============================================================
-- 14. SENSOR READINGS (Future IoT Integration)
-- ============================================================
CREATE TABLE sensor_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reading_time DATETIME NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    ph DECIMAL(5,2),
    gas_level DECIMAL(8,4),
    mould_risk_indicator DECIMAL(5,2),
    source VARCHAR(10),
    storage_unit_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_sensor_readings_storage FOREIGN KEY (storage_unit_id) REFERENCES storage_units(id)
) ENGINE=InnoDB;

CREATE INDEX idx_sensor_readings_storage ON sensor_readings(storage_unit_id);

-- ============================================================
-- 15. ALERTS
-- ============================================================
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(20) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_alerts_user ON alerts(user_id);
