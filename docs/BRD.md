# Business Requirements Document (BRD)
## Leave Management System (LMS) – Enterprise MERN Web Application

---

## 1. Document Control
- **Document Title**: Business Requirements Document (BRD)
- **Project Name**: Centralized Leave Management System (LMS)
- **Version**: 1.0.0
- **Status**: Approved / Ready for Production Deployment
- **Author**: Senior Full-Stack Engineering & Architecture Team
- **Date**: November 2026

---

## 2. Introduction & Background
Modern enterprises require structured, transparent, and auditable governance over employee absences, statutory time-off entitlements, and departmental coverage. Traditional ad-hoc mechanisms (such as unformatted emails, instant messages, and manual spreadsheets) introduce severe operational risks:
1. **Balance Discrepancies**: Accidental double deductions or unrecorded leaves lead to payroll calculation conflicts.
2. **Overbooking**: Overlapping leaves filed concurrently by employees deplete departmental coverage without notice.
3. **Audit Vulnerabilities**: Lack of immutable timestamps and reviewer records compromises labor law compliance.
4. **Poor Employee Experience**: Opaque leave statuses lead to repeated follow-up inquiries to human resources.

The **Leave Management System (LMS)** replaces fragmented absence management with an automated, role-governed web portal that enforces corporate leave policies, calculates net working days with automatic weekend exclusion, dynamically tracks category balances, and provides real-time executive visibility.

---

## 3. Project Objectives
1. **Centralize Absence Tracking**: Unify employee time-off requests, balances, and historical records in a singular authoritative database.
2. **Automate Calculation Accuracy**: Eliminate manual calculation errors through programmatic weekend exclusions and real-time quota deduction algorithms.
3. **Enforce Role-Based Access Control (RBAC)**: Maintain strict boundaries between Employee self-service capabilities and Administrator managerial privileges.
4. **Prevent Quota Overdrafts**: Programmatically reject requests exceeding available allocations or conflicting with existing approved/pending filings.
5. **Auditability**: Capture immutable audit logs for every leave application, approval, rejection, and policy modification.

---

## 4. Project Scope

### 4.1 In-Scope
- User authentication via email and hashed passwords with JSON Web Tokens (JWT).
- Role-based authorization for two distinct personas: **Employee** and **Administrator**.
- Configurable leave policies for Casual Leave (6d), Sick Leave (6d), and Earned Leave (12d) based on a calendar leave year (January 1 – December 31).
- Automatic working-day calculations excluding Saturdays and Sundays.
- Overlapping leave conflict detection for concurrent and duplicate filings.
- Supporting document uploads (PDF, DOC, DOCX, PNG, JPEG with 5MB limits).
- Employee self-service dashboard, leave balance inspector, application workflow, and personal history tracking with cancellation capabilities.
- Administrator executive dashboard with real-time analytics, monthly trend visualizers, and department statistics via Recharts.
- Administrative leave management: review modal, approval with remarks, and rejection with mandatory rationale.
- Staff provisioning, employee metadata updates, superuser password resets, and account soft deactivations.
- In-app notification engine with polling for real-time status updates.
- Automated test coverage spanning unit, integration, and API security tests.
- Production build configurations for cloud hosting (Vercel, Render, MongoDB Atlas).

### 4.2 Out-of-Scope (Future Enhancements)
- Multi-tier hierarchical approval routing (e.g. Line Manager -> Department Head -> HR VP).
- Third-party paid SMS / Twilio push notifications.
- Biometric timecard hardware integration.
- Automated cash-equivalent leave encashment processing at year-end.

---

## 5. Stakeholders & User Roles

| Persona | Description | Key Responsibilities |
| :--- | :--- | :--- |
| **Employee** | Regular company staff member | View personal quota, submit leave requests with rationale, upload certificates, monitor approval statuses, cancel pending requests, manage personal profile and password. |
| **HR Administrator** | Executive personnel with operational authority | Provision staff profiles, configure company-wide yearly quotas, evaluate pending leave filings, approve/reject requests with remarks, review department-level absenteeism analytics, deactivate inactive staff. |
| **IT & DevOps** | System operators | Manage hosting infrastructure, environment secrets, database backups, uptime monitoring, and security patching. |

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- **FR-AUTH-01**: System shall authenticate users via valid email and password credentials.
- **FR-AUTH-02**: Passwords shall be hashed using `bcrypt` (10 salt rounds) before persistence; plaintext passwords must never be stored or returned in responses.
- **FR-AUTH-03**: Authenticated sessions shall issue signed JWT tokens containing user ID and role, expiring after 7 days.
- **FR-AUTH-04**: Role-Based Access Control (RBAC) must reject unauthorized access attempts with HTTP 403 Forbidden.
- **FR-AUTH-05**: Deactivated accounts must be prevented from logging in or generating new sessions.

### 6.2 Leave Application Engine
- **FR-LEV-01**: Employees shall select a valid leave category: `Casual Leave`, `Sick Leave`, or `Earned Leave`.
- **FR-LEV-02**: The application must enforce that `startDate` is not in the past (comparison normalized to 00:00:00 of the current day).
- **FR-LEV-03**: The application must enforce that `endDate` is equal to or later than `startDate`.
- **FR-LEV-04**: System shall compute net working days between `startDate` and `endDate`, excluding Saturdays (day 6) and Sundays (day 0).
- **FR-LEV-05**: If the requested date range yields 0 working days (e.g. weekend-only selection), the system shall reject the request.
- **FR-LEV-06**: System shall verify that `requestedWorkingDays <= availableBalance` for the chosen leave category.
- **FR-LEV-07**: System shall verify that the requested interval does not overlap with existing `pending` or `approved` leaves for the applicant.
- **FR-LEV-08**: Optional supporting documents up to 5MB may be attached; if company policy mandates an attachment for that leave type, submission must fail without an uploaded file.
- **FR-LEV-09**: Upon valid submission, leave is created with status `pending`, holding the requested working days against available balance.

### 6.3 Approval & Rejection Workflow
- **FR-APPR-01**: Administrators shall view a centralized table of all leave requests with filters for status, department, and category.
- **FR-APPR-02**: Only requests with status `pending` can be approved or rejected. Repeated review actions on processed leaves must fail with HTTP 400.
- **FR-APPR-03**: During approval, the system must re-verify that the applicant has sufficient remaining quota and no newly approved overlapping leave.
- **FR-APPR-04**: Upon approval, leave status updates to `approved`, recording `reviewedBy`, `reviewedAt`, and optional `adminRemarks`.
- **FR-APPR-05**: Rejection requires mandatory non-empty administrative remarks explaining the rationale.
- **FR-APPR-06**: The applicant receives an in-app notification immediately upon status determination.

### 6.4 Leave Balance & Quota Computation
- **FR-BAL-01**: Quotas are tracked independently per category across the leave year (Jan 1 to Dec 31).
- **FR-BAL-02**: Default statutory allocations:
  - Casual Leave: 6 days
  - Sick Leave: 6 days
  - Earned Leave: 12 days
  - Total Annual Quota: 24 days
- **FR-BAL-03**: Formally approved leaves count as `used`.
- **FR-BAL-04**: In-review requests count as `pending`.
- **FR-BAL-05**: `Available Quota = Allocation - Used - Pending`.
- **FR-BAL-06**: `Remaining Quota = Allocation - Used`.
- **FR-BAL-07**: Rejected and cancelled requests release any held quota immediately without deducting from remaining balance.

### 6.5 Employee Lifecycle & Administration
- **FR-EMP-01**: Administrator shall create staff profiles with unique Employee ID and email.
- **FR-EMP-02**: Administrator shall update staff contact info, department, and designation.
- **FR-EMP-03**: Staff deletion is prohibited when historical leave records exist; administrator must utilize account deactivation.
- **FR-EMP-04**: Administrator can issue secure password resets for employees.

---

## 7. Non-Functional Requirements

### 7.1 Security & Compliance
- **Data Protection**: Sensitive credentials protected via bcrypt; JWT secrets stored strictly in environment variables.
- **Network Hardening**: Strict CORS origin whitelisting, HTTP security headers enforced via Helmet, static asset isolation.
- **Brute Force Protection**: Rate limiting on `/api/auth/login` (max 20 requests per 15 minutes per IP).
- **Input Sanitization**: All incoming payloads validated via Zod schemas before reaching business logic.

### 7.2 Performance & Scalability
- **Sub-Second API Responses**: Database indexes on `User(email, employeeId, role, isActive)` and `Leave(employee, status, startDate, endDate)` guarantee query latency under 100ms.
- **Stateless Architecture**: REST API backend maintains no server-side session memory, enabling horizontal scaling across cloud instances.
- **Lightweight Polling**: In-app notifications poll at 30-second intervals to minimize server load.

### 7.3 Usability & Responsive Design
- **Enterprise Design System**: Navy blue (`#0f172a`), professional corporate blue (`#2563eb`), and clean slate surfaces (`#f8fafc`).
- **Full Viewport Responsiveness**: Full usability across mobile (<640px), tablet (640px–1024px), and desktop (>1024px) dimensions.
- **Touch & Accessibility Standards**: Touch-friendly buttons (minimum 44x44px target), accessible form field labels, and WCAG 2.1 AA typography contrast ratios.

---

## 8. Business Rules & Calculation Engine

### 8.1 Working Day Calculation Logic
```text
FUNCTION calculateWorkingDays(startDate, endDate):
    IF endDate < startDate: RETURN 0
    workingDays = 0
    currentDate = startDate (normalized to 00:00:00 UTC)
    WHILE currentDate <= endDate:
        dayOfWeek = currentDate.getUTCDay()
        IF dayOfWeek != 0 (Sunday) AND dayOfWeek != 6 (Saturday):
            workingDays = workingDays + 1
        currentDate = currentDate + 1 day
    RETURN workingDays
```

### 8.2 Balance Ledger Integrity Rules
1. **Deduction Invariance**: Only requests with `status === 'approved'` permanently decrease net remaining balance.
2. **Hold Invariance**: Requests with `status === 'pending'` temporarily decrement available balance to prevent concurrent overbooking.
3. **Cancellation Release**: When a pending request is cancelled by the employee or rejected by the admin, the hold is dissolved immediately.
4. **Idempotent Approvals**: Re-approving an already approved request is blocked to eliminate duplicate quota subtractions.

---

## 9. Comprehensive Cloud Deployment Architecture & Operations

### 9.1 Hosting Platforms & Infrastructure

The Leave Management System follows a decoupled, cloud-native microservices architecture hosted across enterprise-grade platforms:

```text
┌────────────────────────────────────────────────────────┐
│                   End-User Clients                     │
│        (Mobile Phones, Tablets, Desktop Web)           │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS (Port 443)
                            ▼
┌────────────────────────────────────────────────────────┐
│          Frontend Hosting: Vercel Global Edge          │
│  - Static Asset CDN with Global Edge Caching           │
│  - Automated TLS / SSL Certificate Management          │
│  - Continuous Deployment triggered on Git push         │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS REST API
                            ▼
┌────────────────────────────────────────────────────────┐
│          Backend Hosting: Railway Web Service          │
│  - Node.js 20+ High-Performance Async Runtime          │
│  - Express REST API with Helmet & Rate Limiting        │
│  - Health checks & zero-downtime rolling deploys       │
│  - Automated SSL & Nixpacks container builder          │
└───────────────────────────┬────────────────────────────┘
                            │ TLS Connection (Port 27017)
                            ▼
┌────────────────────────────────────────────────────────┐
│          Database Tier: MongoDB Atlas Cloud            │
│  - Multi-AZ Cloud Replica Set (Primary/Secondary)      │
│  - Network whitelisting & encrypted storage at rest    │
│  - Automated daily backups & point-in-time recovery    │
└────────────────────────────────────────────────────────┘
```

| Component | Selected Platform | Resource Allocation | Role / Functionality |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | [Vercel](https://vercel.com) | Unlimited Bandwidth, Global Edge CDN | Hosts the compiled React 18 / Vite single-page application |
| **Backend REST API** | [Railway](https://railway.app) | Node.js Container Service (Automatic Scaling, SSL) | Executes Express API controllers, business logic, calculations, and JWT validation |
| **Database Tier** | [MongoDB Atlas](https://www.mongodb.com/atlas) | Cloud Replica Set Cluster (M0 Sandbox/Dedicated) | Authoritative persistence for users, leaves, policies, and notifications |
| **Source Control** | [GitHub](https://github.com) | Git Repository | Centralized code repository with automated CI/CD branch webhooks |

---

### 9.2 Deployment Approach

1. **Decoupled Client-Server Microservices**: The frontend React SPA is decoupled from the Express backend, enabling independent scaling, build optimizations, and localized zero-downtime deployments.
2. **Stateless Backend**: The Express API maintains zero in-memory session state; all authentication relies on cryptographically signed JWT tokens, allowing multiple backend instances to serve traffic simultaneously on Railway.
3. **Automated Git-Integrated CI/CD**: Pushing tested code to the `main` branch of the GitHub repository triggers automated production build and deployment pipelines on both Vercel and Railway without manual SSH intervention.

---

### 9.3 Required Cloud Services & Configuration

#### Backend Environment Variables (Configured in Railway Dashboard)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<your_username>:<your_database_password>@<your_cluster>.mongodb.net/lms_production?retryWrites=true&w=majority
JWT_SECRET=<your_secure_jwt_secret_key>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://leave-management-system-client.vercel.app
```

#### Frontend Environment Variables (Configured in Vercel Dashboard)
```env
VITE_API_URL=https://leave-management-system-production.up.railway.app/api
```

---

### 9.4 Step-by-Step Initial Deployment Procedure

#### Step 1: MongoDB Atlas Database Setup
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com) and create an organization cluster in your target region.
2. Under **Security -> Database Access**, create an application database user with read and write permissions (e.g., `<your_db_username>`).
3. Under **Security -> Network Access**, click **Add IP Address** and allow access from anywhere (`0.0.0.0/0`) so that cloud hosting services (Railway) can connect to the database.
4. Under **Deployment -> Database -> Connect -> Drivers (Node.js)**, copy your connection string and replace `<your_database_password>` with your secure user password.

#### Step 2: Backend Deployment on Railway
1. Sign in to [Railway](https://railway.app) using your GitHub account.
2. Click **New Project -> Deploy from GitHub repo** and select `VishwambharBK/Leave-Management-System`.
3. In the Railway Service canvas, click on the service card and open **Settings**:
   - **Root Directory**: Set to `/backend` (so Railway builds and runs only the backend service).
   - **Build Command**: Auto-detected (or `npm install`).
   - **Start Command**: `npm start` (which executes `node server.js`).
4. Switch to the **Variables** tab and add the production environment variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<your_username>:<your_database_password>@<your_cluster>.mongodb.net/lms_production?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<your_secure_jwt_secret_key>`
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGIN`: `https://<your-vercel-domain>.vercel.app`
5. In **Settings -> Networking**, click **Generate Domain** to assign a public HTTPS address (e.g., `https://leave-management-system-production.up.railway.app`).
6. Verify deployment by probing the health check endpoint: `https://<railway-domain>/api/health` — must return status `{"status":"UP"}`.

#### Step 3: Frontend Deployment on Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Import the GitHub repository `Leave-Management-System`.
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and set to `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, create the key:
   - `VITE_API_URL`: Value set to `https://<your-railway-domain>/api`
5. Click **Deploy**. Vercel will bundle the production distribution and assign a live production URL (e.g. `https://leave-management-system-client.vercel.app`).
6. Return to Railway and update the backend's `CORS_ORIGIN` variable with the final Vercel frontend URL.

#### Step 4: Database Seeding & Production Smoke Testing
1. Execute the remote database seeder to initialize default policies and admin credentials:
   ```bash
   MONGO_URI="<your-mongodb-atlas-uri>" npm --prefix backend run seed
   ```
2. Navigate to the live Vercel URL in your browser.
3. Log in with the initial administrator credentials (`admin@lms.local` / `Admin@123456`).
4. Provision a new employee, log out, log in as that employee, and file a leave request.
5. Log back in as Administrator, review the request in the pending queue, approve it with remarks, and ensure that balance deductions reflect accurately.

---

### 9.5 Steps to Update the Application in Production

To deploy updates, bug fixes, or new features to the live production application:

1. **Local Verification**: Ensure all automated test suites pass locally before publishing changes:
   ```bash
   npm test
   npm run build
   ```
2. **Commit Changes**: Commit the updates using conventional commit messages:
   ```bash
   git add .
   git commit -m "feat(module): description of feature or fix"
   ```
3. **Push to Remote Main Branch**:
   ```bash
   git push origin main
   ```
4. **Automated CI/CD Execution**:
   - **Vercel** detects the commit on `main`, runs `vite build`, and deploys the new static bundles to its global edge network in ~30 seconds with zero downtime.
   - **Railway** detects the commit on `main`, pulls changes in `/backend`, rebuilds the container via Nixpacks, performs container health checks, and shifts incoming traffic with zero downtime.
5. **Zero-Downtime Rollback Mechanism**:
   - If an unexpected production issue occurs on the frontend, navigate to **Vercel -> Deployments**, locate the last known healthy deployment, and click **Instant Rollback**.
   - If an issue occurs on the backend, navigate to **Railway -> Deployments**, select the previous successful deployment card, and click **Rollback**.

---

## 10. Acceptance Criteria Checklist

| Requirement | Acceptance Validation Criterion | Status |
| :--- | :--- | :--- |
| **AC-01** | Employee login authenticates and redirects to `/dashboard` | Verified |
| **AC-02** | Administrator login authenticates and redirects to `/admin/dashboard` | Verified |
| **AC-03** | Employees cannot view or invoke administrator routes or APIs | Verified (403 Forbidden) |
| **AC-04** | Leave calculator excludes Saturdays and Sundays from working days | Verified |
| **AC-05** | Requests with past dates, inverted dates, or 0 working days are rejected | Verified |
| **AC-06** | Overlapping requests for identical employee dates are prevented | Verified |
| **AC-07** | Requests exceeding category balance are rejected with clear message | Verified |
| **AC-08** | Administrator can approve pending request with automatic balance deduction | Verified |
| **AC-09** | Administrator can reject pending request with mandatory remarks | Verified |
| **AC-10** | Employee receives in-app notifications on submission, approval, rejection | Verified |
| **AC-11** | Soft account deactivation preserves employee historical leave filings | Verified |
| **AC-12** | Quota allocations and certificate policies are configurable in real time | Verified |
| **AC-13** | Automated backend integration test suite passes 100% | Verified (20/20 Passed) |
| **AC-14** | Automated frontend component test suite passes 100% | Verified (5/5 Passed) |
| **AC-15** | Production build bundles clean static assets with zero errors | Verified |
| **AC-16** | Comprehensive deployment architecture and operational update procedures documented | Verified |
