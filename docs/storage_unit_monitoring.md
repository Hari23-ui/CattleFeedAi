# CattleFeedAI — Storage Unit Monitoring & Hardware Sensor Alerts

## 1. Architecture Overview

The **Storage Unit Monitoring Module** provides end-to-end hardware sensor telemetry ingestion, environmental condition monitoring, sudden-change anomaly detection, and in-app alerts for physical feed storage units (silage bunkers, silos, pits, and feed store rooms).

```
┌─────────────────────────────────────────────────────────┐
│ Physical Hardware / ESP32 Sensor Array                  │
│ (DHT22 / DS18B20 Temp Probe, Industrial pH Sensor Probe)│
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP POST / JSON Telemetry
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Spring Boot REST API (/api/storage-units/**)            │
│ (Secured with JWT, Farm Ownership Hierarchy)            │
└──────────────────────────┬──────────────────────────────┘
                           │ Persist SensorReading
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Storage Monitoring Engine (StorageMonitoringService)    │
│ - Sudden Temp Change Detection (≥ 3.0°C delta)         │
│ - Sudden pH Change Detection (≥ 0.5 delta)             │
│ - Configurable Threshold Limits (5.0–35.0°C, 3.5–5.5 pH)│
│ - Hardware Inactivity Detection (> 24 hours offline)   │
└──────────────────────────┬──────────────────────────────┘
                           │ Deduplicated Event Generation
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Alert Engine (AlertService — M10 Framework)            │
│ (AlertType.STORAGE, Deduplicated by title & unit ID)    │
└──────────────────────────┬──────────────────────────────┘
                           │ Push Notification / Polling
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Farmer Mobile Application (React Native Web / Mobile)   │
│ - Dashboard Storage Monitoring Card                     │
│ - Storage Unit List & Telemetry Summary                 │
│ - Storage Unit Details & Chronological History Table    │
│ - Unread Alert Count & Alert Detail Views               │
└─────────────────────────────────────────────────────────┘
```

> **IMPORTANT SCOPE NOTICE:**
> - **IoT Hardware Integration:** Fully supported and integrated in this post-M13 module via HTTP REST ingestion and ESP32 telemetry pipelines.
> - **NIR (Near-Infrared) Spectroscopy:** Remains independent future scope and is separate from continuous storage unit condition monitoring.

---

## 2. Hardware → API Telemetry Flow

1. An ESP32 or compatible IoT micro-controller reads digital temperature probes (e.g., DS18B20 sealed probe placed into the silage clamp core) and analog pH electrode measurements.
2. The device packages measurements into a JSON payload:
   ```json
   {
     "deviceId": "ESP32-STORAGE-001",
     "timestamp": "2026-09-29T20:30:00",
     "temperature": 28.4,
     "ph": 4.2,
     "humidity": 65.0
   }
   ```
3. The device issues an HTTP POST to:
   `POST /api/storage-units/{storageUnitId}/sensor-readings`
4. The Spring Boot backend validates farm ownership through standard authentication tokens.
5. The `StorageUnitService` stores the record in `sensor_readings`. Missing measurements remain `null` and are never coerced to zero.
6. The `StorageMonitoringService` compares the new reading against previous readings and configured bounds.
7. If an anomalous condition is detected and no unread alert exists with that title for this unit, an alert is persisted via `AlertService` with `AlertType.STORAGE`.
8. The farmer application displays the updated reading and alert badge across the Dashboard and Storage Unit screens.

---

## 3. StorageUnit Model

The `StorageUnit` entity represents a physical feed storage location owned by a farm:

- **Entity:** `com.cattlefeedai.api.entity.StorageUnit`
- **Table:** `storage_units`
- **Fields:**
  - `id` (Long, Primary Key)
  - `name` (String, max 100) — e.g. "Maize Silage Bunker 01"
  - `storageType` (StorageType enum) — `FEED_STORAGE`, `SILAGE_STORAGE`, `MIXED_STORAGE`, `OTHER`
  - `location` (String, max 255) — e.g. "North Field Sector 2"
  - `capacity` (String, max 100) — e.g. "50 Metric Tons"
  - `deviceId` (String, max 100) — Hardware device identifier (e.g. "ESP32-STORAGE-001")
  - `farm` (ManyToOne to `Farm`, enforces ownership: `User → Farm → StorageUnit`)
  - `createdAt`, `updatedAt` (LocalDateTime)

---

## 4. SensorReading Model

The `SensorReading` entity stores chronological telemetry readings:

- **Entity:** `com.cattlefeedai.api.entity.SensorReading`
- **Table:** `sensor_readings`
- **Fields:**
  - `id` (Long, Primary Key)
  - `storageUnit` (ManyToOne to `StorageUnit`)
  - `deviceId` (String, max 100) — Recording hardware device identifier
  - `readingTime` (LocalDateTime) — Reading timestamp
  - `temperature` (BigDecimal, scale 2) — Temperature in °C (Nullable)
  - `ph` (BigDecimal, scale 2) — pH measurement (Nullable)
  - `humidity` (BigDecimal, scale 2) — Relative humidity % (Nullable)
  - `gasLevel` (BigDecimal, scale 4) — Optional gas telemetry (Nullable)
  - `mouldRiskIndicator` (BigDecimal, scale 2) — Optional indicator (Nullable)
  - `source` (SensorSource enum) — `IOT`, `MANUAL`
  - `createdAt` (LocalDateTime)

> **Nullable Rule:** Missing telemetry values remain `null`. A null reading displays as `Not Available` in the user interface and is NEVER converted to `0°C` or `0.0 pH`.

---

## 5. Storage Monitoring Engine

The `StorageMonitoringService` centralizes condition evaluations using configurable monitoring thresholds:

### Condition Rules:

1. **Sudden Temperature Change:**
   - Evaluated between the current reading and the immediate previous reading.
   - If `|current_temp - previous_temp| >= temperatureSuddenChange` (default: 3.0°C):
     - Severity: `WARNING`
     - Status Text: *"Temperature change detected. Review the storage unit."*

2. **Abnormal Temperature Thresholds:**
   - If `current_temp > temperatureMax` (default: 35.0°C) or `current_temp < temperatureMin` (default: 5.0°C):
     - Severity: `HIGH`
     - Status Text: *"Temperature outside configured storage threshold. Potential storage condition concern. Review recommended."*

3. **Sudden pH Change:**
   - Evaluated between the current reading and the immediate previous reading.
   - If `|current_ph - previous_ph| >= phSuddenChange` (default: 0.5):
     - Severity: `WARNING`
     - Status Text: *"pH change detected. Review the storage condition and consider appropriate testing."*

4. **Abnormal pH Thresholds:**
   - If `current_ph > phMax` (default: 5.5) or `current_ph < phMin` (default: 3.5):
     - Severity: `HIGH`
     - Status Text: *"pH outside configured storage threshold. Review the storage condition and consider testing."*

5. **Device Inactivity / Offline Condition:**
   - If no sensor reading has arrived for over `offlineThresholdHours` (default: 24h):
     - Monitoring Status becomes `NO_RECENT_DATA` or `OFFLINE`.
     - Severity: `WARNING`
     - Title: *"Storage Sensor Offline: {Unit Name}"*
     - Status Text: *"No sensor reading has been received from {Device ID} since {Time}. Check device connectivity."*

---

## 6. Alert Generation & Deduplication

Alerts reuse the existing Milestone 10 notification architecture (`AlertService`):

- **AlertType:** `AlertType.STORAGE`
- **Related Entity:** `"STORAGE_UNIT"`
- **Related Entity ID:** `storageUnit.getId()`
- **Deduplication:** Before saving a new alert, the system checks:
  `alertRepository.existsByUserIdAndRelatedEntityTypeAndRelatedEntityIdAndTitle(...)`
  If an unread alert with the identical title already exists for that user and storage unit, duplicate creation is suppressed.
- **Alert In-App Integration:**
  Storage alerts automatically appear in:
  - Global Dashboard Unread Alert Badge (e.g. `🔔 3 unread alerts`)
  - Farmer Alert List Screen (`/api/alerts`)
  - Storage Unit Details Screen (`View Alerts` button)

---

## 7. REST API Endpoints

All endpoints are prefixed with `/api/storage-units` and secured by JWT authentication:

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/storage-units` | Create a new storage unit under an owned farm | `201 Created` |
| `GET` | `/api/storage-units` | List storage units for caller (optional `?farmId=X`) | `200 OK` |
| `GET` | `/api/storage-units/summary` | Aggregated dashboard monitoring statistics | `200 OK` |
| `GET` | `/api/storage-units/{id}` | Retrieve storage unit with latest telemetry & status | `200 OK` |
| `PUT` | `/api/storage-units/{id}` | Update storage unit specifications | `200 OK` |
| `DELETE` | `/api/storage-units/{id}` | Delete storage unit and its sensor readings | `204 No Content` |
| `POST` | `/api/storage-units/{id}/sensor-readings` | Ingest sensor telemetry from ESP32 or manual entry | `201 Created` |
| `GET` | `/api/storage-units/{id}/sensor-readings` | Retrieve historical sensor readings (descending) | `200 OK` |
| `GET` | `/api/storage-units/{id}/sensor-readings/latest` | Retrieve single latest sensor reading | `200 OK` |

---

## 8. Frontend Screens

1. **Dashboard Card (`DashboardScreen.tsx`):**
   - Displays total monitored units, active monitoring count, attention required count, and offline count.
   - Shows badge: `MONITORING` or `⚠ ATTENTION`.
   - "View Storage Units →" navigation action.

2. **Storage Unit List Screen (`StorageUnitListScreen.tsx`):**
   - Summary metric banner (Total, Monitoring, Attention, Offline).
   - Farm filter chips for multi-farm owners.
   - Storage unit cards with live telemetry (Temperature, pH, Last Updated, Hardware ID).
   - Status badges: `MONITORING`, `NORMAL`, `⚠ ATTENTION REQUIRED`, `NO RECENT DATA`, `OFFLINE`.
   - Active alert counter chip.
   - "+ Add Storage Unit" action.

3. **Storage Unit Details Screen (`StorageUnitDetailsScreen.tsx`):**
   - Unit specifications and hardware device info.
   - 4-metric telemetry grid: Temperature, pH, Relative Humidity, Last Updated.
   - "+ Ingest Telemetry" and "View Alerts" quick actions.
   - Chronological Sensor Reading History Table with change delta badges (e.g. `(+3.6°C)`, `(+0.7 pH)`).
   - Prominent storage condition monitoring notice.

4. **Register Storage Unit Screen (`AddStorageUnitScreen.tsx`):**
   - Target farm selector.
   - Storage type selector (`SILAGE_STORAGE`, `FEED_STORAGE`, etc.).
   - Capacity, location, and device ID inputs.

5. **Ingest Sensor Telemetry Screen (`RecordSensorReadingScreen.tsx`):**
   - Target unit reference.
   - Device identifier input (defaults to unit device ID).
   - Numeric inputs for Temperature, pH, and Humidity.
   - Source selector (`IOT` vs `MANUAL`).

---

## 9. API Security & Ownership

- **Strict Multi-Tenant Isolation:**
  - `User → Farm → StorageUnit → SensorReading`.
  - Farmer A can NEVER access or ingest data into Farmer B's storage units (`403 Forbidden`).
  - Accessing non-existent storage units returns `404 Not Found`.
  - Unauthenticated requests return `401 Unauthorized`.
- **Spring Security Configuration:**
  - Stateless JWT token filtering.
  - Zero modifications to security filters for M1–M13.
  - CSRF disabled for stateless REST; CORS enabled for mobile and web clients.

---

## 10. Configurable Thresholds

Threshold parameters are declared in `StorageMonitoringConfig.java` with property prefix `storage.monitoring`:

```properties
# Default Configuration (Override via environment variables or application.properties)
storage.monitoring.temperature-min=5.0
storage.monitoring.temperature-max=35.0
storage.monitoring.temperature-sudden-change=3.0
storage.monitoring.ph-min=3.5
storage.monitoring.ph-max=5.5
storage.monitoring.ph-sudden-change=0.5
storage.monitoring.offline-threshold-hours=24
```

These values can be configured per deployment or climate zone without changing codebase logic.

---

## 11. Sensor Offline Handling

If an active hardware device ceases telemetry transmission:
- If `duration_since_last_reading >= 24 hours`:
  - Unit status transitions to `NO_RECENT_DATA` / `OFFLINE`.
  - An infrastructure alert is raised:
    `Storage Sensor Offline: {Unit Name}`
    *"No sensor reading has been received from {Device ID} since {Date Time}. Check device connectivity."*
- Crucially, the system does NOT declare the feed spoiled purely due to an offline sensor.

---

## 12. Scientific Boundaries & Non-Diagnostic Principles

- **Condition Monitoring Only:** Temperature and pH measurements from hardware sensors provide environmental condition tracking and change detection.
- **Not a Chemical Lab Replacement:** Sensor readings do not replace proximate wet chemistry, proximate wet chemical analyses, or NIR spectroscopy.
- **Not a Veterinary Diagnosis:** Alerts report `"Temperature change detected"` or `"Potential storage condition concern. Review recommended."` rather than making unsupported veterinary diagnoses or asserting guaranteed feed spoilage.
- **Visual Inspection Required:** Farmers must visually inspect feed appearance, aroma, moisture, and temperature before feeding animals.

---

## 13. Hardware Integration Instructions (ESP32 Setup)

### Physical Sensor Wiring:
- **Temperature:** Waterproof DS18B20 1-Wire temperature probe connected to GPIO 4 (with 4.7kΩ pull-up resistor to 3.3V).
- **pH:** Industrial analog pH sensor probe with signal amplifier connected to ADC pin GPIO 34.
- **Humidity (optional):** DHT22 connected to GPIO 5.

### ESP32 Microcontroller Code Sketch (C++ / Arduino Core):
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "FARM_WIFI_SSID";
const char* password = "FARM_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:8080/api/storage-units/1/sensor-readings";
const char* jwtToken = "YOUR_FARMER_JWT_TOKEN";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + jwtToken);

    StaticJsonDocument<200> doc;
    doc["deviceId"] = "ESP32-STORAGE-001";
    doc["temperature"] = 28.4; // Read from DS18B20 probe
    doc["ph"] = 4.2;          // Read from calibrated analog pH probe
    doc["humidity"] = 65.0;   // Read from DHT22

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
  }
  // Transmit reading every 15 minutes
  delay(15 * 60 * 1000);
}
```

---

## 14. Status of Hardware Testing & Future Scope

- **Hardware Status:** The backend REST ingestion and monitoring engine are fully validated using controlled test telemetry payloads and integration tests. The pipeline is **READY FOR DEVICE CONNECTION** (no physical micro-controller was connected in the test environment).
- **Future Improvements:**
  - Automated MQTT / LoRaWAN gateway integration for long-range remote pastures.
  - Device provisioning tokens and mutual TLS for hardware endpoints.
  - Multi-depth temperature probe profiling (surface vs. core bunker temperature).
  - Micro-climate weather forecast correlation with storage aeration advisories.
