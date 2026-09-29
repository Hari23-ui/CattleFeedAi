# CattleFeedAI

**Digital Cattle Feed & Silage Quality Assessment, Advisory & Expert Consultation System**

---

## 1. System Overview

CattleFeedAI is an evidence-based digital decision-support platform designed for dairy farmers, veterinarians, and animal nutrition experts. It provides comprehensive herd and feed management:
- **Farm & Livestock Inventory**: Profile management for dairy herds, tracking breeds, weights, lactation stages, days in milk, and milk yields.
- **Feed & Silage Quality Assessment**: Rule-based screening evaluating chemical composition (crude protein, moisture, fiber, aflatoxin, pH, minerals) from certified laboratory test results.
- **AI Visual Screening Microservice**: High-reliability visual screening of feed and silage surface images (detecting surface discoloration, foreign matter, and visible mould) with deterministic visual fallback.
- **Feed Planning**: Software-driven daily ration scheduling linking animals, feeds, silages, quantities, and frequencies.
- **Animal Health Risk Screening**: Contextual correlation of feed intake, milk production, and feed quality deviations without automated disease diagnosis.
- **In-App Notifications & Alerts**: Real-time hazard alerting for unsafe feeds, high risk indices, and urgent management advisories.
- **Professional Expert Consultation Workflow**: Direct collaboration channel connecting farmers with Veterinarians and Veterinary Nutritionists, supported by unified multi-source evidence dossiers.
- **Historical Herd Analytics**: Longitudinal trends tracking feed quality variations, nutritional stability, and livestock health indicators over time.

---

## 2. System Architecture & Runtime Layers

```
  ┌────────────────────────────────────────────────────────┐
  │         React Native / Expo Mobile Application         │
  │    (TypeScript, Cross-Platform iOS / Android / Web)    │
  └───────────────────────────┬────────────────────────────┘
                              │ HTTP / REST (JWT Auth)
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │            Spring Boot Backend Application             │
  │     (Java 17, Spring Security, Data JPA, Port 8080)    │
  └───────────────┬────────────────────────┬───────────────┘
                  │                        │ HTTP / REST
                  │ MySQL 8+               │ (Multipart)
                  ▼                        ▼
  ┌────────────────────────────┐ ┌─────────────────────────┐
  │       MySQL Database       │ │   FastAPI AI Service    │
  │ (Port 3306, 16 Tables, FK) │ │(Python 3.10+, Port 8000)│
  └────────────────────────────┘ └─────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Default Port | Description |
|---|---|---|---|
| **Frontend** | React Native, Expo, TypeScript | 8081 / Expo | Mobile-first client application |
| **Backend** | Java 17, Spring Boot 3.x, Spring Data JPA, Spring Security | 8080 | Enterprise REST API, JWT auth, business logic |
| **Database** | MySQL 8.0+ | 3306 | Relational persistence, 26 foreign key constraints |
| **AI Microservice** | Python 3.10+, FastAPI, Uvicorn, Pillow, NumPy | 8000 | Computer-vision visual screening & deterministic fallback |

---

## 4. Scientific Boundaries & Legal Disclaimers

CattleFeedAI strictly enforces scientific boundaries across all user interfaces, APIs, and microservices:
1. **Camera Images Do NOT Measure Chemistry**: Ordinary smartphone cameras cannot measure crude protein, moisture %, dry matter, fiber, energy value (TDN/NEL), aflatoxin/mycotoxin concentration, minerals, urea, or pH. Any camera-derived output is strictly visual surface screening (`AI VISUAL SCREENING` or `DETERMINISTIC_VISUAL_SCREENING`).
2. **Laboratory Measurements Only From Certified Tests**: All chemical and nutritional values displayed in the system originate solely from recorded laboratory test results (`LABORATORY DATA`).
3. **Non-Diagnostic Livestock Health Screening**: The health screening module identifies potential nutritional and management risk indicators. It strictly does **not** provide veterinary disease diagnosis, guaranteed treatments, or automated veterinary prescriptions.
4. **Professional Terminology**: Qualified consultants are exclusively designated as **Veterinarians**, **Veterinary Nutritionists**, or **Animal Nutrition Experts**. Human nutrition terminology (such as "dietician") is strictly prohibited and absent from the platform.

---

## 5. Prerequisites

Before running CattleFeedAI, ensure the following software is installed on your workstation:
- **Java 17 JDK** (Eclipse Temurin or OpenJDK 17)
- **Apache Maven 3.8+**
- **MySQL 8.0+** running locally or accessible via network
- **Node.js 18+** (LTS recommended) and **npm**
- **Python 3.10+** (with virtual environment capability)
- **Expo CLI** (`npm install -g expo-cli` or via `npx expo`)

---

## 6. Startup Instructions

Follow this exact sequence to start all runtime services:

### Step 1: Start MySQL Database
Ensure MySQL Server is running on port `3306`. Create the database if not present:
```sql
CREATE DATABASE IF NOT EXISTS cattlefeedai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Configure your credentials in `backend/cattle-feed-api/src/main/resources/application.properties` or set environment variables `DB_USERNAME` and `DB_PASSWORD`.

### Step 2: Start Spring Boot Backend
```bash
cd backend/cattle-feed-api
mvn spring-boot:run
```
- **Port**: `8080`
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI Specification**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Step 3: Start FastAPI AI Microservice
```bash
cd ai-service
# On Windows:
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- **Port**: `8000`
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Service Info**: [http://localhost:8000/api/v1/info](http://localhost:8000/api/v1/info)
- **Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 4: Start React Native / Expo Frontend
```bash
cd frontend/cattle-feed-app
npm install
npx expo start
```

### Network Configuration for Testing:
- **Web / iOS Simulator**: Uses `http://localhost:8080` by default.
- **Android Emulator**: Uses `http://10.0.2.2:8080` (automatically mapped by the app config).
- **Physical Mobile Device**: Connect your mobile device to the same Wi-Fi network as your host computer. Set the environment variable in `.env` before launching Expo:
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://<YOUR_COMPUTER_LAN_IP>:8080
  EXPO_PUBLIC_AI_SERVICE_URL=http://<YOUR_COMPUTER_LAN_IP>:8000
  ```
  *(Example: `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080`)*

---

## 7. Automated Test Suite Execution

All layers feature automated unit, integration, and security test suites:

### Backend Unit & Integration Tests (Spring Boot)
```bash
cd backend/cattle-feed-api
mvn test
```
*Total: 130 tests, 0 failures, 0 errors.*

### Frontend Unit & Workflow Tests (Jest)
```bash
cd frontend/cattle-feed-app
npm test
npm run type-check
```
*Total: 34 suites, 336 tests, 0 failures. TypeScript check: 0 errors.*

### AI Service Tests (Pytest)
```bash
cd ai-service
pytest -v
```
*Total: 45 tests, 0 failures.*

### Live Pipeline & Milestone Regression Tests
Run against active Spring Boot (8080) and FastAPI (8000) instances:
```bash
# Core CRUD & Livestock Management
node verify_m62_real_backend.mjs

# Feed, Silage & Laboratory Tests
node verify_m63_real_backend.mjs

# Quality & Risk Assessment Engines
node verify_m64_real_backend.mjs

# Animal Health Screening
node verify_m65_real_backend.mjs

# Sample Image Storage & MIME Validation
node verify_m66_real_backend.mjs

# AI Visual Screening Integration
node verify_m72_real_pipeline.mjs
node verify_m73_real_pipeline.mjs

# Expert Consultation Lifecycle
node verify_m8_real_pipeline.mjs

# Historical Herd Analytics
node verify_m9_real_pipeline.mjs

# M13 Comprehensive Cross-Owner Security & Isolation
node verify_m13_cross_owner_security.mjs

# M13 Complete End-to-End Workflow Demonstration
node verify_m13_end_to_end_demo.mjs
```

---

## 8. Milestone Completion Summary

- **M1–M5**: Core domain models, MySQL database schema, farm & animal profiles, feed/silage sample records, and laboratory test result tracking.
- **M6.1–M6.5**: Rule-based feed quality engine, multi-dimensional risk assessment, animal health screening, and advisory generation.
- **M6.6**: Secure multipart image storage, UUID file naming, MIME validation, and path traversal protection.
- **M7.1–M7.3**: FastAPI computer-vision service, deterministic visual fallback, spatial inspection, and strict boundary isolation.
- **M8**: Complete expert consultation workflow (REQUESTED, ACCEPTED, IN_REVIEW, RESPONDED, COMPLETED) with role-based security.
- **M9**: Historical trend analytics with chronological aggregations, parameter tracking, and zero null-defaulting integrity.
- **M10**: In-app notifications & hazard alerts workflow, unread counter badges, and atomic deduplication.
- **M11**: Feed planning & ration scheduling module integrated with the Unified Farmer Dashboard.
- **M12**: Aggregated decision-support evidence dossiers (`EvidenceSummaryService`) connecting all previous milestones.
- **M13**: Final system hardening, comprehensive cross-owner security verification, end-to-end workflow validation, and release readiness.

---

## 9. Security & Access Control Summary

- **Role-Based Access Control**:
  - `FARMER`: Access to own farms, animals, feed/silage samples, lab results, feed plans, alerts, and submitted consultations.
  - `EXPERT`: Access to public consultation queue, assigned consultations, and linked animal evidence dossiers.
  - `ADMIN`: Comprehensive administrative management across platform entities.
- **Data Isolation**: Verified 100% isolation between tenant records. Farmer A cannot view, mutate, or delete Farmer B's data (enforced via 403 Forbidden). Unassigned experts cannot inspect or modify consultations assigned to other experts.
- **Image Security**: Validated MIME inspection, strict file-size ceilings (10 MB), UUID file naming, and path traversal prevention.
