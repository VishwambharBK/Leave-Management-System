# Quality Assurance & Test Execution Report
## Leave Management System (LMS) – MERN Stack

---

## 1. Test Environment Specification

| Parameter | Specification |
| :--- | :--- |
| **Operating System** | Microsoft Windows 11 Enterprise (64-bit) |
| **Node.js Runtime** | `v25.2.0` |
| **NPM Package Manager** | `11.6.2` |
| **Backend Test Framework** | Jest `29.7.0` & Supertest `7.0.0` |
| **Frontend Test Framework** | Vitest `3.0.5` & React Testing Library (RTL) `16.2.0` |
| **Database Test Engine** | `mongodb-memory-server` `10.1.4` (Isolated in-memory instance) |
| **Test Execution Date** | November 2026 |
| **Execution Mode** | Deterministic in-band sequential execution (`--runInBand`) |

---

## 2. Test Execution Summary

```text
================================================================================
                      OVERALL TEST EXECUTION RESULTS
================================================================================
Total Test Suites Executed:    2 suites (Backend + Frontend)
Total Automated Test Cases:    25 tests
Tests Passed:                  25 tests (100%)
Tests Failed:                  0 tests (0%)
Test Flakiness / Retries:      0
Build & Compilation Status:    PASSED (Vite production bundle built in 7.84s)
================================================================================
```

---

## 3. Backend Integration Test Suite (`backend/tests/api.test.js`)

**Execution Command**:
```bash
npm run test:backend
# Executes: cross-env NODE_OPTIONS=--no-webstorage NODE_ENV=test jest --runInBand --detectOpenHandles --forceExit
```

### Detailed Backend Test Case Results:

| ID | Test Suite / Category | Test Case Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BE-01** | **Authentication** | Valid login with correct email and password | Status 200, JWT returned, user data sans password | Status 200, token issued | **PASS** |
| **TC-BE-02** | **Authentication** | Login submission with empty email or password | Status 400 with validation failure message | Status 400, rejected | **PASS** |
| **TC-BE-03** | **Authentication** | Login with incorrect password | Status 401 with 'Invalid email or password' | Status 401, rejected | **PASS** |
| **TC-BE-04** | **Authentication** | Login attempt by a deactivated employee account | Status 403 Forbidden with account deactivation message | Status 403, rejected | **PASS** |
| **TC-BE-05** | **Authentication** | Protected route access with invalid/corrupted JWT | Status 401 Unauthorized | Status 401, rejected | **PASS** |
| **TC-BE-06** | **Authorization & RBAC** | Employee token accessing `/api/admin/dashboard` | Status 403 Forbidden | Status 403, rejected | **PASS** |
| **TC-BE-07** | **Authorization & RBAC** | Administrator token accessing `/api/admin/dashboard` | Status 200 with executive summary metrics | Status 200, data returned | **PASS** |
| **TC-BE-08** | **Authorization & RBAC** | Unauthenticated user accessing `/api/employees/profile` | Status 401 Unauthorized | Status 401, rejected | **PASS** |
| **TC-BE-09** | **Leave Validation** | Leave application with past start date | Status 400 with 'start date cannot be in the past' | Status 400, rejected | **PASS** |
| **TC-BE-10** | **Leave Validation** | Leave application with end date earlier than start date | Status 400 with 'end date earlier than start date' | Status 400, rejected | **PASS** |
| **TC-BE-11** | **Leave Validation** | Leave application spanning only Saturday and Sunday | Status 400 with 'no working days (weekends only)' | Status 400, rejected | **PASS** |
| **TC-BE-12** | **Leave Engine** | Valid weekday leave application | Status 201 Created, working days = 2, status = pending | Status 201, 2 days logged | **PASS** |
| **TC-BE-13** | **Leave Engine** | Overlapping leave request for same employee | Status 400 with 'already have an overlapping leave' | Status 400, rejected | **PASS** |
| **TC-BE-14** | **Leave Engine** | Application exceeding available balance quota | Status 400 with 'Insufficient leave balance' | Status 400, rejected | **PASS** |
| **TC-BE-15** | **Admin Review** | Employee attempt to invoke `/api/admin/leaves/:id/approve` | Status 403 Forbidden | Status 403, rejected | **PASS** |
| **TC-BE-16** | **Admin Review** | Administrator approves pending leave application | Status 200, status updated to approved, remarks saved | Status 200, approved | **PASS** |
| **TC-BE-17** | **Admin Review** | Repeated approval attempt on already approved leave | Status 400 with 'Only pending requests can be approved' | Status 400, rejected | **PASS** |
| **TC-BE-18** | **Admin Review** | Administrator rejects request without mandatory remarks | Status 400 with 'Rejection remarks are mandatory' | Status 400, rejected | **PASS** |
| **TC-BE-19** | **Admin Review** | Administrator rejects request with descriptive remarks | Status 200, status updated to rejected | Status 200, rejected | **PASS** |
| **TC-BE-20** | **Balance Integrity** | Ledger balance evaluation after approval, pending, rejection | Casual: 2d pending; Sick: 2d used; Earned: 0d used | Exact match to ledger | **PASS** |

**Backend Test Output Transcript**:
```text
PASS tests/api.test.js (7.58 s)
  1. Authentication Module
    √ should log in successfully with valid credentials (200 ms)
    √ should reject login with missing credentials (62 ms)
    √ should reject login with incorrect password (204 ms)
    √ should reject login for inactive employee accounts (180 ms)
    √ should reject protected route with invalid or corrupted token (41 ms)
  2. Authorization & RBAC
    √ should prevent employees from accessing admin APIs (105 ms)
    √ should allow admin to access admin APIs (208 ms)
    √ should reject unauthenticated requests to protected routes (35 ms)
  3. Leave Application & Validation Rules
    √ should reject past start dates (81 ms)
    √ should reject end date earlier than start date (45 ms)
    √ should reject weekend-only leave requests (zero working days) (38 ms)
    √ should successfully submit a valid leave request and exclude weekends from count (195 ms)
    √ should prevent overlapping leave applications for the same employee (89 ms)
    √ should reject requests exceeding available leave balance (101 ms)
  4. Admin Approval & Rejection Workflow
    √ should prevent employees from approving leave requests (37 ms)
    √ should allow admin to approve a pending leave request (195 ms)
    √ should not allow approving an already approved leave request (87 ms)
    √ should require remarks when admin rejects a request (85 ms)
    √ should allow admin to reject a pending leave request with remarks (123 ms)
  5. Leave Balance Integrity
    √ should accurately calculate leave balances with approved, pending, and rejected leaves (80 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Time:        7.58 s
```

---

## 4. Frontend Component Test Suite (`frontend/src/test/app.test.jsx`)

**Execution Command**:
```bash
npm run test:frontend
# Executes: node --no-webstorage ./node_modules/vitest/vitest.mjs run
```

### Detailed Frontend Test Case Results:

| ID | Component Tested | Scenario Description | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-FE-01** | `LoginPage` | Form layout and element discovery | Inputs for email, password, and sign-in button exist | Found and rendered | **PASS** |
| **TC-FE-02** | `LoginPage` | Empty form validation trigger | Error toast / validation warning displayed on submission | Validation message rendered | **PASS** |
| **TC-FE-03** | `Badge` | Color token mapping across statuses | Pending (amber), Approved (green), Rejected (rose), Cancelled (gray) | Rendered with correct styles | **PASS** |
| **TC-FE-04** | `StatCard` | KPI statistics formatting | Title, numeric value, subtitle rendered accurately | Metric display verified | **PASS** |
| **TC-FE-05** | `ConfirmDialog`| Action confirmation dialog interactions | OnConfirm fired on confirm button, onClose on cancel button | Callbacks fired correctly | **PASS** |

**Frontend Test Output Transcript**:
```text
 RUN  v3.2.7 C:/Users/vishw/Desktop/Leave Management System/frontend

 ✓ src/test/app.test.jsx (5 tests) 102ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  12:25:41
   Duration  6.48s
```

---

## 5. Production Compilation Results (`npm run build`)

**Build Command**: `npm run build` (Executes `npm --prefix frontend run build`)
```text
vite v6.4.6 building for production...
transforming...
✓ 2419 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.84 kB │ gzip:   0.48 kB
dist/assets/index-8j25wBmz.css   31.02 kB │ gzip:   5.72 kB
dist/assets/index-AXpF7hhO.js   906.34 kB │ gzip: 255.60 kB
✓ built in 7.84s
```
**Compilation Status**: Zero syntax or TypeScript errors, CSS successfully purged and minimized, HTML entrypoint fully packaged for hosting on Vercel CDN.

---

## 6. End-to-End Workflow Verification

### Workflow 1: Admin Login → Provision Employee → Employee Login
1. Authenticated as System Administrator (`admin@example.com`).
2. Created staff profile for `Sarah Connor` (`EMP001`, `sarah.connor@example.com`).
3. Logged out and authenticated as `Sarah Connor`.
4. Verified that employee dashboard rendered with 24 available days (6 Casual, 6 Sick, 12 Earned).

### Workflow 2: Apply Leave → Admin Review → Approved Balance Deduction
1. Employee applied for 2 working days of Casual Leave spanning Monday to Tuesday.
2. Verified that weekend days were zero-rated.
3. System created leave with status `pending`.
4. Employee available Casual Leave decreased from 6 to 4 (2 days held).
5. Administrator approved request with remarks `"Approved by HR team"`.
6. Employee dashboard reflected status `Approved` with 2 days used and 4 days remaining.

### Workflow 3: Apply Leave → Admin Rejection → Quota Restored
1. Employee submitted 2-day Earned Leave request.
2. Administrator rejected request with mandatory rationale `"Quarter-end financial sprint"`.
3. Verified status updated to `Rejected`.
4. Available Earned Leave quota remained 12 days; no deduction occurred.

### Workflow 4: Overlapping Date & Overdraft Prevention
1. Employee submitted a leave request from Nov 16 to Nov 17.
2. Employee attempted to submit a second request covering Nov 17.
3. System immediately returned HTTP 400 rejecting the overlapping dates.
4. Employee attempted to apply for 20 Casual Leave days (quota is 6).
5. System rejected request with clear message indicating quota limitation.

---

## 7. Known Limitations & Edge Cases Handled

1. **Weekend-Only Filings**:
   - *Behavior*: A user selecting Saturday to Sunday receives an explicit rejection explaining that the selected range contains zero working days.
2. **Account Deactivation Invariance**:
   - *Behavior*: Deactivating an employee prevents them from logging in, but completely preserves historical leave records so department reports and audit trails remain accurate.
3. **MongoDB Connection Fallback**:
   - *Behavior*: In environments where an external MongoDB Atlas cluster or local mongod process is not available, the backend automatically transitions to an isolated `MongoMemoryServer` instance for seamless development and testing.

