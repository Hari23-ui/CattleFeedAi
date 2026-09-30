# CattleFeedAI — Deployment Readiness Audit & Runbook

**Document Version:** 1.0.0  
**Target Environment:** Cloud Deployment (Containerized / PaaS / IaaS e.g. Render, Railway, AWS ECS/EKS, GCP Cloud Run)  
**Status:** AUDITED & CONFIGURED FOR CLOUD DEPLOYMENT (NO SECRET LEAKS, BACKWARDS-COMPATIBLE LOCAL DEV PRESERVED)

---

## 1. System Architecture Overview

CattleFeedAI is an enterprise-grade multi-tier digital cattle feed & silage quality assessment, advisory, and storage monitoring system.

```
                           +----------------------------------------+
                           |  React Native + Expo Client (Web/App)  |
                           |  - Web / Android / iOS                 |
                           |  - EXPO_PUBLIC_API_BASE_URL            |
                           +-------------------+--------------------+
                                               |
                                     HTTPS REST (JWT Bearer)
                                               |
                                               v
                           +----------------------------------------+
                           |   Spring Boot REST API (Port ${PORT})  |
                           |   - Java 17 / Spring Boot 3.2.5        |
                           |   - Multi-tenant Farmer Auth & ACL     |
                           |   - Assessment & Storage Engine        |
                           |   - SMS Notification Subsystem         |
                           +---------+--------------------+---------+
                                     |                    |
                           JDBC / SQL (HikariCP)    HTTP Multipart
                                     |                    |
                                     v                    v
                   +-------------------+        +--------------------+
                   |    MySQL 8+ DB    |        | Python FastAPI AI  |
                   | - Persistent Data |        | - Port ${PORT:8000}|
                   | - DDL auto=update |        | - Visual Screening |
                   +-------------------+        +--------------------+
```

---

## 2. Required Services

To deploy CattleFeedAI to the cloud, 4 primary services/components are required:

| Service | Technology | Minimum Resources | Network Exposure | Health Check Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **Database** | MySQL 8.0+ | 1 CPU, 1 GB RAM, 10 GB Storage | Private Internal / VPC | MySQL Ping / Port 3306 |
| **AI Microservice** | FastAPI / Python 3.10+ / Uvicorn | 0.5 CPU, 512 MB RAM | Private or Public HTTPS | `GET /health` |
| **Core API Backend** | Spring Boot 3.2.5 / JDK 17 | 1 CPU, 1–2 GB RAM | Public HTTPS | `GET /health` or `GET /actuator/health` |
| **Frontend Web/App** | Expo / React Native Web or EAS APK/IPA | Static CDN / S3 / Vercel or App Stores | Public HTTPS (Web) / Native | Static bundle index.html |

---

## 3. Environment Variables Reference

### A. Spring Boot Backend (`cattle-feed-api`)

| Variable Name | Required | Default (Local Dev) | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `8080` | Server listening port (automatically provided by Render / Heroku / Cloud Run) |
| `DATABASE_URL` | Optional | (constructed from `DB_HOST`, `DB_PORT`, `DB_NAME`) | Complete JDBC URL (e.g. `jdbc:mysql://db.host:3306/cattlefeedai?...`) |
| `DB_HOST` | Optional | `localhost` | MySQL hostname if not providing full `DATABASE_URL` |
| `DB_PORT` | Optional | `3306` | MySQL port |
| `DB_NAME` | Optional | `cattlefeedai` | MySQL database name |
| `DATABASE_USERNAME` / `DB_USERNAME` | Optional | `root` | MySQL user |
| `DATABASE_PASSWORD` / `DB_PASSWORD` | Optional | `sql@2007` (dev only) | MySQL password (**Never commit production password**) |
| `JWT_SECRET` | **Required in Prod** | Dev HMAC 256-bit string | Base64-encoded or raw 256-bit secret for signing JWTs |
| `JWT_EXPIRATION` / `JWT_EXPIRATION_MS` | Optional | `86400000` (24h) | JWT validity window in milliseconds |
| `AI_SERVICE_URL` / `AI_SERVICE_BASE_URL` | Optional | `http://localhost:8000` | Target URL for the deployed FastAPI microservice |
| `CORS_ALLOWED_ORIGINS` | Optional | Dev fallback (`localhost`, `10.0.2.2`, `*`) | Comma-separated allowed frontend domains in production |
| `APP_UPLOAD_DIR` | Optional | `uploads/sample-images` | Local directory path for image uploads (ephemeral on cloud containers) |
| `SMS_ENABLED` | Optional | `false` | Master toggle for SMS dispatch (`true` / `false`) |
| `SMS_PROVIDER` | Optional | `mock` | SMS provider (`mock`, `twilio`, `aws`) |
| `SMS_API_KEY` | Optional | `""` | Twilio Account SID or AWS Access Key |
| `SMS_API_SECRET` | Optional | `""` | Twilio Auth Token or AWS Secret Key |
| `SMS_SENDER_ID` | Optional | `CTLFED` | TRAI/DLT approved 6-character sender ID |
| `SMS_DLT_TEMPLATE_ID` | Optional | `1107161234567890123` | TRAI/DLT registered content template ID |

### B. FastAPI AI Microservice (`ai-service`)

| Variable Name | Required | Default (Local Dev) | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `8000` | Cloud listening port (automatically populated by Render / Cloud Run) |
| `AI_SERVICE_HOST` | Optional | `0.0.0.0` | Bind host address |
| `AI_SERVICE_PORT` | Optional | `8000` | Port if `PORT` is not defined |
| `APP_ENV` | Optional | `development` | Runtime environment (`production`, `staging`, `development`) |
| `LOG_LEVEL` | Optional | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `MAX_IMAGE_SIZE_MB` | Optional | `10` | Maximum upload file size in megabytes |
| `MODEL_ENABLED` | Optional | `false` | Enable/disable ML/CV model inference |
| `MODEL_PATH` | Optional | `""` | Path to saved PyTorch / ONNX weights |

### C. Frontend (`cattle-feed-app`)

| Variable Name | Required | Default (Local Dev) | Description |
| :--- | :---: | :--- | :--- |
| `EXPO_PUBLIC_API_BASE_URL` | **Required in Prod** | `http://localhost:8080` (iOS/Web) / `http://10.0.2.2:8080` (Android) | Public HTTPS base URL of the Spring Boot backend |
| `EXPO_PUBLIC_AI_SERVICE_URL` | Optional | `http://localhost:8000` | Direct AI URL if bypassing backend proxy |

---

## 4. Local Development vs. Production Configuration

### Local Development Mode
- **Zero Config Needed**: All services default to local developer defaults when environment variables are omitted:
  - Spring Boot runs on `localhost:8080` and connects to local MySQL on `localhost:3306`.
  - FastAPI runs on `0.0.0.0:8000`.
  - Expo uses `http://localhost:8080` on web/iOS and `http://10.0.2.2:8080` on Android emulator.
  - SMS runs in `mock` provider mode (dispatches logged in-memory, zero carrier expense).

### Production Cloud Mode
- Set `DATABASE_URL` pointing to hosted managed MySQL (e.g. AWS RDS, Aiven, PlanetScale, DigitalOcean MySQL).
- Set `JWT_SECRET` to a cryptographically random 256-bit string (`openssl rand -base64 32`).
- Set `AI_SERVICE_URL` to internal or external HTTPS address of FastAPI instance.
- Set `CORS_ALLOWED_ORIGINS` to the exact frontend web domain(s) (e.g. `https://app.cattlefeedai.com`).
- Build Expo Web static bundle with `EXPO_PUBLIC_API_BASE_URL=https://api.cattlefeedai.com` or build native APK/AAB with EAS.

---

## 5. Spring Boot Deployment Requirements

1. **JDK Runtime**: JDK 17 (Eclipse Temurin / OpenJDK 17 recommended).
2. **Build Tool**: Apache Maven 3.8+. Build artifact: `mvn clean package -DskipTests` produces `target/cattle-feed-api-0.0.1-SNAPSHOT.jar`.
3. **Container Entrypoint**:
   ```bash
   java -Dserver.port=${PORT:-8080} -jar target/cattle-feed-api-0.0.1-SNAPSHOT.jar
   ```
4. **Health Probe**:
   - HTTP GET to `/health` or `/actuator/health` returns HTTP 200 `{"status": "UP", "service": "cattle-feed-api"}` without authentication.
5. **Port Flexibility**:
   - `server.port=${PORT:8080}` automatically maps to the PaaS dynamic container port assigned by Render, Railway, AWS App Runner, or GCP Cloud Run.

---

## 6. FastAPI Deployment Requirements

1. **Python Runtime**: Python 3.10 or 3.11.
2. **Dependencies**: `pip install -r requirements.txt`.
3. **Execution Command**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
   ```
   Or directly:
   ```bash
   python -m app.main
   ```
4. **Health Probe**:
   - HTTP GET to `/health` returns HTTP 200 `{"status": "UP", "service": "cattlefeedai-ai-service"}`.
5. **Scientific Guardrail Preservation**:
   - AI endpoints perform strictly non-diagnostic surface visual screening; no chemical predictions or disease diagnoses are executed.

---

## 7. MySQL Deployment Requirements

1. **Engine**: MySQL 8.0+ with InnoDB storage engine.
2. **Character Set**: `utf8mb4`, Collation: `utf8mb4_unicode_ci`.
3. **Initial Schema**:
   - DDL schema is pre-defined in `database/schema/schema.sql`.
   - Spring Boot runs with `spring.jpa.hibernate.ddl-auto=update` by default, which creates or updates tables automatically upon first connection without dropping data.
4. **Connection Pool**: HikariCP handles connection pooling with automatic reconnection and keep-alive verification queries.
5. **Database Preservation**:
   - Schema was NOT altered and remains 100% MySQL native.
   - Do NOT migrate to PostgreSQL or NoSQL.

---

## 8. Image Storage Limitation & Cloud Persistent Storage Strategy

### Current Implementation
- `SampleImageService` writes uploaded files to local disk under `uploads/sample-images/` (configurable via `app.upload.dir=${APP_UPLOAD_DIR:uploads/sample-images}`).
- File paths are saved in the `sample_images.file_path` column in MySQL.

### Cloud Ephemeral Container Limitation
> [!WARNING]
> On serverless and PaaS container platforms (such as Render, Heroku, or basic Cloud Run containers), the local container filesystem is **ephemeral**.
> - Uploaded images will be lost whenever the container restarts, redeploys, or scales to zero.
> - Multiple load-balanced instances will NOT share local filesystem storage.

### Production Solution (Future Migration)
To achieve persistent image storage in production without local filesystem dependency:
1. **Cloud Object Storage**: Integrate an S3-compatible storage client (`AWS S3`, `Cloudflare R2`, `Google Cloud Storage`, or `MinIO`).
2. **Storage Interface**: Refactor `SampleImageService` with a pluggable `ImageStorageProvider` interface (`LocalStorageProvider` vs `S3StorageProvider`).
3. **Persistent Volume (Alternative)**: On AWS ECS/EKS or DigitalOcean Kubernetes, mount a persistent volume (EFS / CSI volume) to `/uploads/sample-images`.

---

## 9. Expo / EAS Frontend Requirements

1. **Web Deployment**:
   - Build static assets:
     ```bash
     npx expo export -p web
     ```
   - Serves the generated `dist/` directory via any static hosting (Netlify, Vercel, AWS S3 + CloudFront, Render Static Site).
   - Inject environment variable before export:
     ```bash
     EXPO_PUBLIC_API_BASE_URL=https://<your-spring-boot-domain> npx expo export -p web
     ```

2. **Mobile Deployment (Android / iOS)**:
   - Use EAS Build (`eas build -p android --profile production` / `eas build -p ios --profile production`).
   - Store `EXPO_PUBLIC_API_BASE_URL` in `eas.json` under the target profile environment variables.
   - Secure token storage utilizes `expo-secure-store` on native devices (falling back to web storage on web platforms).

---

## 10. Security Audit Findings

| Audit Check | Status | Verification Detail |
| :--- | :---: | :--- |
| **Source Code Secrets** | **CLEAN** | No production passwords, cloud API keys, or carrier secrets are hardcoded in git. |
| **Local Dev Defaults** | **ISOLATED** | Default values (e.g. dev password `sql@2007`, dev HMAC key) are protected behind environment variable overrides `${ENV_VAR:default}`. |
| **JWT Authentication** | **ACTIVE** | Stateless token auth with BCrypt hashing (`BCryptPasswordEncoder`). Tokens verified on every protected route. |
| **Farmer ACL Isolation** | **VERIFIED** | All farm, animal, feed sample, silage, test result, feed plan, and storage unit queries strictly enforce `owner_id = currentUser.id`. |
| **CORS Policy** | **SECURED** | Configurable via `CORS_ALLOWED_ORIGINS`. Dev fallback allows local toolchains without wildcard exposure in production. |
| **Public vs Protected Routes** | **VERIFIED** | Only `/api/auth/**`, `/health`, `/actuator/health`, `/v3/api-docs`, and `/swagger-ui/**` are public. All domain APIs require valid JWT. |

---

## 11. Test Verification Summary

All automated test suites across all 3 tiers were executed and passed cleanly:

- **Frontend (Jest & React Native Testing Library)**:
  - `npm test -- --runInBand`: **40 test suites passed, 400 / 400 tests passed (100%)**
  - `npx tsc --noEmit`: **0 TypeScript errors**
- **Backend (Spring Boot JUnit 5 & MockMvc)**:
  - `mvn test`: **168 / 168 tests passed (100%)**
  - Package artifact: `mvn package -DskipTests` completed with **BUILD SUCCESS**
- **AI Service (Pytest & FastAPI TestClient)**:
  - `pytest`: **45 / 45 tests passed (100%)**

---

## 12. Remaining Deployment Work (When Ready to Deploy)

When the decision is made to deploy to cloud infrastructure:
1. **Provision MySQL Database**: Launch managed MySQL 8 instance on cloud provider, create `cattlefeedai` database.
2. **Deploy FastAPI Service**: Deploy `ai-service` container on PaaS; note internal/public URL.
3. **Deploy Spring Boot API**: Set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, and `AI_SERVICE_URL`; deploy.
4. **Deploy Frontend**: Set `EXPO_PUBLIC_API_BASE_URL` to the live Spring Boot API URL; export and deploy web assets or native build.
5. **Configure Production Carrier SMS (Optional)**: If live Indian SMS is needed, configure TRAI DLT approved headers and credentials in backend environment variables.
