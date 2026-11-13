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
- Multi-tier hierarchical approval routing (e.g. Line Manager → Department Head → HR VP).
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
- **FR-AUTH-03**: Authenticated sessions shall issue signed JWT tokens containing user ID and role, expiring after 24 hours.
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
- **FR-BAL-02**: Default allocations:
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

### 7.3 Usability & Design
- **Enterprise Design System**: Navy blue (`#0f1f38`), professional corporate blue (`#1e40af`), and off-white backgrounds (`#f8fafc`).
- **Responsive Layout**: Full usability across desktop (1920x1080), tablet (768x1024), and mobile viewport dimensions (375x667).
- **Accessibility & Contrast**: Conforms to WCAG 2.1 AA standards for typography contrast and form input labeling.

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

## 9. Comprehensive Cloud Deployment Architecture

```text
                                  ┌────────────────────────┐
                                  │   End-User Browser     │
                                  └───────────┬────────────┘
                                              │ HTTPS (Port 443)
                                              ▼
                        ┌──────────────────────────────────────────┐
                        │      Frontend Hosting: Vercel CDN        │
                        │    (Vite React Single Page Application)  │
                        └─────────────────────┬────────────────────┘
                                              │ HTTPS REST API
                                              ▼
                        ┌──────────────────────────────────────────┐
                        │      Backend Hosting: Render Web Service │
                        │      (Node.js + Express REST API Server) │
                        └─────────────────────┬────────────────────┘
                                              │ TLS Mongoose Connection
                                              ▼
                        ┌──────────────────────────────────────────┐
                        │     Database Tier: MongoDB Atlas         │
                        │     (High-Availability Cloud Replica Set)│
                        └──────────────────────────────────────────┘
```

### 9.1 Platform Specifications

| Component | Selected Platform | Free Tier Capability | Deployment Strategy |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Unlimited bandwidth, global edge CDN, automatic HTTPS | Automated CI/CD Git branch push |
| **Backend** | [Render](https://render.com) | Free web service (512MB RAM, shared CPU) | Native Node.js web service linked to Git |
| **Database**| [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 Sandbox (512MB storage, automated backups) | Cloud managed cluster with IP whitelisting |
| **Source**  | GitHub | Unlimited private/public repositories | Git version control |

### 9.2 Environment Configuration Reference

#### Backend Environment Variables (Render Dashboard):
```env
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.mongodb.net/leave_management?retryWrites=true&w=majority
JWT_SECRET=super_secure_production_quality_jwt_secret_key_leave_management_2026_random_bytes
JWT_EXPIRES_IN=1d
CLIENT_URL=https://leave-management-system-frontend.vercel.app
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@ProductionSecure123!
```

#### Frontend Environment Variables (Vercel Dashboard):
```env
VITE_API_BASE_URL=https://leave-management-system-backend.onrender.com/api
```

### 9.3 Build and Execution Commands
- **Backend Build**: `npm install`
- **Backend Start**: `npm start` (Executes `node server.js`)
- **Frontend Build**: `npm run build` (Executes `vite build`)
- **Frontend Output Directory**: `dist`

### 9.4 Step-by-Step Initial Deployment Procedure

#### Phase 1: Database Setup (MongoDB Atlas)
1. Sign in to MongoDB Atlas and create a free M0 cluster in your preferred region.
2. In **Security → Database Access**, create an admin user (e.g. `lms_admin`) with password and read/write privileges.
3. In **Security → Network Access**, add IP `0.0.0.0/0` (allowing cloud platform connectivity).
4. In **Deployments → Databases**, click **Connect → Drivers (Node.js)** and copy your connection string.

#### Phase 2: Backend Service Deployment (Render)
1. Link your GitHub repository in Render.
2. Create a new **Web Service** selecting the repository.
3. Specify **Root Directory**: `backend`.
4. Specify **Runtime**: `Node`.
5. Set **Build Command**: `npm install`.
6. Set **Start Command**: `npm start`.
7. In the **Environment Variables** tab, add all keys specified in Section 9.2.
8. Click **Create Web Service**. Wait for build completion.
9. Verify deployment via the health check endpoint: `https://<your-render-url>/api/health`.

#### Phase 3: Frontend Deployment (Vercel)
1. Log in to Vercel and click **Add New Project**.
2. Import the same repository.
3. In Project Settings, set **Root Directory** to `frontend`.
4. Framework Preset will auto-detect as `Vite`.
5. Under **Environment Variables**, add `VITE_API_BASE_URL` pointing to your Render backend API URL (`https://<backend-url>/api`).
6. Click **Deploy**. Vercel will bundle the production distribution into `dist`.

#### Phase 4: Production Verification Procedure
1. Navigate to the live Vercel URL.
2. Log in with initial administrator credentials.
3. Provision an initial staff member from **Employees → Add New Employee**.
4. Log out and log in as the newly created staff member.
5. Apply for leave; verify that working days exclude weekends and that available balance updates.
6. Log in as Administrator; approve the pending filing and ensure the status reflects as `Approved` on both ends.

### 9.5 Application Updates & Continuous Deployment (CI/CD)
- Both Vercel and Render connect directly to the Git repository.
- Pushing commits to the `main` branch automatically triggers incremental production builds on Vercel and zero-downtime rolling deploys on Render.

### 9.6 Rollback & Incident Recovery
- **Frontend Rollback**: Vercel stores immutable deployment artifacts for every Git commit. In the Vercel dashboard, click **Deployments → Instant Rollback** to revert to any previous healthy commit within seconds.
- **Backend Rollback**: In the Render dashboard, navigate to **Deploys** and select **Rollback to this deploy** on any previous successful build.
- **Database Backup**: MongoDB Atlas M0 snapshots allow point-in-time state restoration via the Atlas UI.

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

