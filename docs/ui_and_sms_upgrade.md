# CattleFeedAI — UI, Navigation, Profile, Storage Judge Demo & SMS Architecture

## 1. Executive Summary & System Positioning

**CattleFeedAI** is an agricultural intelligence platform:
**Digital Cattle Feed & Silage Quality Assessment, Advisory and Storage Monitoring System**.

### Scientific & System Boundary Disclaimers:
- **Camera AI**: Visual surface screening only (detects mold, discoloration, moisture indicators; non-diagnostic).
- **Laboratory Values**: Definitive source for chemical and nutritional assessment (CP, NDF, ADF, aflatoxin, etc.).
- **Storage Sensors**: Environmental condition monitoring (temperature, pH, humidity) with anomaly detection.
- **Health Screening**: Herd nutritional risk screening, not a definitive veterinary diagnosis.
- **Expert Consultation**: Professional advisory workflow connecting farmers with verified veterinary specialists.
- **SMS Notifications**: Notification and review channel; does not prove fungal attack independently.

---

## 2. Part 1 — Public Landing Page

A dedicated public landing screen ([`LandingScreen.tsx`](file:///d:/CattleFeedAI/frontend/cattle-feed-app/src/screens/auth/LandingScreen.tsx)) welcomes unauthenticated users.
- **Branding**: CattleFeedAI logo badge, header, and official subtitle.
- **Capabilities Breakdown**:
  1. Farm & Animal Management
  2. Feed/Silage Testing
  3. Quality & Risk Assessment
  4. Visual AI Screening
  5. Storage Monitoring
  6. Expert Consultation
  7. Historical Analytics
- **Call-to-Actions**:
  - Primary button: *"Get Started"* (leads to registration)
  - Secondary buttons: *"Sign In"* and *"Sign Up"*
- **Flow**:
  - Unauthenticated: Landing -> Sign In / Sign Up -> Dashboard
  - Authenticated: Application opens directly to Dashboard.

---

## 3. Parts 2 & 3 — Desktop Sidebar & Mobile Drawer Navigation

Authenticated navigation provides a responsive dual-mode layout:
- **Desktop/Tablet Layout (>= 768px)**:
  Fixed left navigation sidebar ([`AppSidebar.tsx`](file:///d:/CattleFeedAI/frontend/cattle-feed-app/src/navigation/AppSidebar.tsx)) with clean icon and label alignment, active route pill indicator, and scrollable categories.
- **Mobile Layout (< 768px)**:
  Header hamburger menu triggering a sliding modal drawer ([`MobileDrawer.tsx`](file:///d:/CattleFeedAI/frontend/cattle-feed-app/src/navigation/MobileDrawer.tsx)) with identical groupings that auto-closes on route selection.
- **Logical Navigation Groupings**:
  1. **DASHBOARD**: Dashboard
  2. **FARM MANAGEMENT**: Farms, Animals
  3. **FEED & QUALITY**: Feed Samples, Silage Samples, Test Results, Quality & Risk, Visual AI
  4. **MONITORING**: Health Screening, Storage Monitoring, Feed Plans, Alerts
  5. **PROFESSIONAL SUPPORT**: Consultations, Evidence, Analytics
  6. **ACCOUNT**: Profile, Logout (visually separated at bottom)

---

## 4. Part 4 — Farmer Profile

Backend profile management under `/api/users/me`:
- **Read-Only System Fields**: `id`, `email`, `role`, `createdAt` (protected under RBAC).
- **Supported Editable Fields**: `username`, `phone`, `language`.
- **Screens**:
  - [`ProfileScreen.tsx`](file:///d:/CattleFeedAI/frontend/cattle-feed-app/src/screens/profile/ProfileScreen.tsx): Displays farmer identity, role badge, account metadata, and edit button.
  - [`EditProfileScreen.tsx`](file:///d:/CattleFeedAI/frontend/cattle-feed-app/src/screens/profile/EditProfileScreen.tsx): Validation, character length checks, duplicate username rejection (409), and 401/403 security handling.

---

## 5. Parts 5 & 6 — Storage Monitoring Judge Demo & Telemetry Pipeline

- **1-Click Evaluator Setup**:
  `POST /api/storage-units/demo` initializes or retrieves `"Demo Storage Godown"` (SILAGE_STORAGE, `ESP32-DEMO-001`).
- **Telemetry Distinction**:
  Every storage unit card explicitly indicates `[DEMO TELEMETRY]` vs `[LIVE IOT TELEMETRY]`.
- **Live Telemetry Simulation Workflow**:
  Judges can click to inject simulated telemetry into the **real backend pipeline**:
  - 🟢 Normal (24.0°C, pH 4.0)
  - ⚠️ Temperature Spike (35.8°C) -> Triggers HIGH storage alert & SMS dispatch
  - ⚠️ High pH Anomaly (pH 5.8) -> Triggers HIGH storage alert & SMS dispatch
  - 🔥 Rapid Heat Rise (+6.0°C) -> Triggers sudden change alert & SMS dispatch
- **Safe Advisory Wording**:
  Wording strictly follows safety conventions:
  *"CattleFeedAI Storage Alert: A storage condition change has been detected in Demo Storage Godown. Potential spoilage/fungal-growth risk condition detected. Please inspect temperature, humidity and storage conditions."*
  (Never claims "Fungal attack confirmed").

---

## 6. Parts 7, 8 & 9 — SMS Notification Architecture & India DLT Compliance

- **Architecture Pattern**:
  `StorageMonitoringService` -> `AlertService` -> `SmsNotificationService` -> `SmsProvider` -> Farmer
- **Pluggable Providers**:
  - `MockSmsProvider`: In-memory dispatch queue for evaluations without real carrier credentials.
  - `TwilioSmsProvider`: REST carrier delivery stub.
  - `AwsSmsProvider`: AWS End User Messaging SMS / Amazon SNS stub.
- **India TRAI / DLT Regulatory Compliance**:
  - Registered 6-alpha Header: `CTLFED`
  - Approved Content Template ID: `1107161234567890123`
  - 30-minute deduplication cooldown window.
- **Configuration (Backend application.properties / ENV)**:
  ```properties
  sms.enabled=false
  sms.provider=mock
  sms.sender-id=CTLFED
  sms.api-key=
  sms.api-secret=
  sms.dlt-template-id=1107161234567890123
  sms.high-priority-only=true
  sms.cooldown-minutes=30
  ```
  Credentials remain exclusively on the backend server.
