# Leave Management System (LMS) – Enterprise MERN Web Application

A modern, production-grade enterprise Leave Management System engineered using the **MERN** stack (MongoDB, Express.js, React 18, Node.js). Designed for corporate organizations to streamline employee leave applications, quota tracking, role-based workflows, and automated administrator approvals with real-time balance integrity.

---

## 1. Project Overview

Managing employee time-off, statutory leave entitlements, and company-specific quota rules using manual emails or spreadsheets leads to error-prone balance calculations, unmonitored absenteeism, and compliance bottlenecks. 

The **Leave Management System (LMS)** centralizes the complete employee absence lifecycle into a secure, responsive, and auditable web portal. The system enforces strict business logic:
- **Real-Time Quota Deduction**: Available balance dynamically deducts approved leaves and locks pending requests to prevent overbooking.
- **Automated Weekend Exclusion**: Leave calculator automatically excludes Saturdays and Sundays when computing net working days.
- **Category Quota Isolation**: Independent tracking across Casual, Sick, and Earned Leave entitlements.
- **Strict Role-Based Access Control (RBAC)**: Enforces separation between standard Employees and HR Administrators across both the frontend router and backend API gateways.
- **Full Audit Trail**: Approvals and rejections record immutable administrator IDs, timestamps, and mandatory remarks.

---

## 2. Key Features

### Employee Module (Self-Service)
- **Executive Dashboard**: Real-time statistical KPI cards (Total Allocated, Used, Remaining, Pending, Approved, Rejected) derived directly from live database records.
- **Interactive Visualizations**: Interactive Recharts utilization bar charts and status distribution pie charts.
- **Smart Leave Filing**:
  - Validates date ranges, disallows past start dates, and blocks inverted date pairs.
  - Automatically calculates net working days excluding weekends.
  - Rejects filings with zero working days or overlapping date spans.
  - Validates remaining balance before submission and holds requested days in `Pending` status.
  - Supports optional supporting medical/document attachments.
- **Leave History & Audit Log**: Searchable, filterable (by status and leave category), and paginated log of all applications with administrator remarks.
- **Quota & Balance Breakdown**: Comprehensive annual allocation cards with visual progress bars indicating used vs. available days for the leave year.
- **Profile & Credentials Management**: View corporate assignments (Employee ID, Department, Designation, Joining Date) and securely update password.

### Administrator Module (HR & Management)
- **Centralized Admin Dashboard**: High-level organizational overview showing total headcount, total filings, pending review queue, approved absences, and currently absent staff.
- **Departmental Absence Analytics**: Monthly filing trends and department-wise absence distribution.
- **Atomic Leave Processing**:
  - Approve pending requests with optional remarks and atomic quota deduction.
  - Reject pending filings with **mandatory** rejection reasons recorded in the audit trail.
  - Concurrency-safe atomic updates to prevent double-deduction.
- **Employee Management**:
  - Provision new staff members with auto-generated credentials.
  - Update employee department, designation, and contact info.
  - Reset employee passwords securely.
  - Soft deactivation/activation workflow to preserve historical leave records for audit compliance.
- **Leave Policy Configuration**: Configure annual quotas (Casual, Sick, Earned Leave) and toggle document upload mandates per category.
- **Admin Profile & Security**: Superuser credential management and system authorization parameters.

### Shared & Platform Features
- **In-App Notification Engine**: Lightweight polling notification bell with unread counters, mark-as-read, and mark-all-read actions.
- **Responsive Layout**: Seamless experience across mobile (<640px), tablet (640px–1024px), and desktop (>1024px) viewports with collapsible sidebar navigation and touch-friendly data tables.

---

## 3. System Architecture

The application implements a decoupled, three-tier client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Tier                           │
│  React 18 SPA (Vite) + Tailwind CSS + Lucide Icons + Recharts│
│  Context API (Auth State) + React Router v7 + Axios Interceptor│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Tier                        │
│   Node.js + Express.js REST API                             │
│   - JWT Bearer Authentication Middleware                    │
│   - Role-Based Authorization Guards (Employee vs Admin)     │
│   - Working-Day Calculation Engine (Weekend Exclusion)       │
│   - Zod Input Validation & Sanitization                     │
│   - Multer Document Upload Handler                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM / TCP 27017
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Tier                         │
│            MongoDB Atlas Cloud Replica Set Cluster          │
│ Collections: users, leaves, leavepolicies, notifications     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React.js | `18.3.1` | Component-driven declarative user interface |
| **Build Tool** | Vite | `6.1.0` | Ultra-fast HMR and production asset bundling |
| **Styling** | Tailwind CSS | `3.4.17` | Utility-first responsive enterprise design system |
| **Routing** | React Router DOM | `7.1.5` | Client-side routing with protected and role-based guards |
| **State & Auth** | Context API & LocalStorage | Built-in | Global authentication, session persistence, and user profile state |
| **HTTP Client** | Axios | `1.7.9` | Promised-based HTTP client with automatic JWT bearer interceptors |
| **Form Validation** | React Hook Form & Zod | `7.54` / `3.24` | Schema-driven client and server-side form validation |
| **Charts** | Recharts | `2.15.1` | Responsive SVG analytics and data visualization |
| **Notifications** | React Hot Toast | `2.5.1` | Interactive toast notifications for user actions |
| **Icons** | Lucide React | `0.475.0` | Modern, consistent icon toolkit |
| **Backend Runtime**| Node.js | `v20+` / `v25` | High-performance asynchronous JavaScript runtime |
| **Framework** | Express.js | `4.21.2` | REST API routing, middleware, and controller architecture |
| **Database** | MongoDB Atlas | Cloud M0 | Fully managed cloud NoSQL database cluster |
| **ODM** | Mongoose | `8.9.5` | Schema validation, indexes, and document modeling |
| **Auth Security** | JWT & bcryptjs | `9.0.2` / `2.4.3` | Token-based stateless auth and salted password hashing |
| **File Uploads** | Multer | `1.4.5` | Secure multipart/form-data upload handling |
| **Testing** | Jest & Supertest | `29.7.0` / `7.0.0` | Automated backend integration testing suite |
| **Testing** | Vitest & React Testing Library | `3.2.7` / `16.2.0` | Frontend component unit testing suite |

---

## 5. Live Deployment URLs & Hosting Architecture

- **GitHub Repository**: [https://github.com/VishwambharBK/Leave-Management-System.git](https://github.com/VishwambharBK/Leave-Management-System.git)
- **Frontend Live URL (Vercel Edge)**: `https://leave-management-system-client.vercel.app` *(or custom domain)*
- **Backend API Live URL (Railway)**: `https://leave-management-system-production.up.railway.app`
- **Database Tier**: MongoDB Atlas Cloud (Managed Multi-AZ Replica Set Cluster)
- **API Health Check**: `https://leave-management-system-production.up.railway.app/api/health`

---

## 6. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which the Express server listens |
| `NODE_ENV` | Yes | `development` / `production` | Execution environment mode |
| `MONGO_URI` | Yes | `mongodb+srv://<your_username>:<your_database_password>@<your_cluster>.mongodb.net/<database_name>?retryWrites=true&w=majority` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `<your_secure_random_jwt_secret_key>` | Cryptographic secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token validity duration |
| `CORS_ORIGIN` | Yes | `http://localhost:5173,http://localhost:5174` *(or production frontend domain)* | Allowed CORS origins for browser security |

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:5000/api` *(or production API URL)* | Base URL for all Axios API requests |

---

## 7. Local Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **npm**: v9.0.0 or higher
- **MongoDB Atlas Account**: Or a locally accessible MongoDB instance

### Step 1: Clone Repository
```bash
git clone https://github.com/VishwambharBK/Leave-Management-System.git
cd Leave-Management-System
```

### Step 2: Install Dependencies
Install dependencies for root, backend, and frontend concurrently:
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### Step 3: Configure Environment Variables
1. **Backend Environment**:
   Create `backend/.env` (or copy from `backend/.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<your_username>:<your_database_password>@<your_cluster>.mongodb.net/lms_production?retryWrites=true&w=majority
   JWT_SECRET=<your_secure_jwt_secret_key>
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174
   ```

2. **Frontend Environment**:
   Create `frontend/.env` (or copy from `frontend/.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Step 4: Seed Database with Initial Data
Initialize default statutory leave policies and demo accounts:
```bash
npm run seed
```

### Step 5: Start Development Servers
Start both the backend API (port 5000) and frontend portal (port 5173) in one terminal:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 8. Demo Credentials

| Role | Name | Email | Password | Assigned Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | System Administrator | `admin@exelon.com` | `Admin@123456` | Full administrative access, leave reviews, staff provisioning, policy configuration |
| **Employee** | Vishwambhara | `vishwambhara@exelon.com` | `Employee@123` | Employee portal, leave filings, balance tracking, personal history |
| **Employee** | Aneesh | `aneesh@exelon.com` | `Employee@123` | Employee portal, leave filings, balance tracking, personal history |

---

## 9. Comprehensive API Reference

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/api/auth/login`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user credentials and returns JWT token + user profile |
| `POST` | `/api/auth/logout` | Public | Clears client session cookie/token |
| `GET` | `/api/auth/me` | User | Returns authenticated profile of the current token bearer |
| `PUT` | `/api/auth/change-password` | User | Updates user password after verifying current password |

### Leave Management Endpoints (`/api/leaves`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leaves` | Employee | Submit a leave request (supports `multipart/form-data` with document attachment) |
| `GET` | `/api/leaves/my` | Employee | Retrieve paginated leave history for the logged-in employee (with status/type filters) |
| `GET` | `/api/leaves/calculate-days`| Employee | Computes working days excluding Saturdays/Sundays for given start and end dates |
| `DELETE`| `/api/leaves/:id` | Employee | Cancels a pending leave filing (releases quota holds) |

### Employee Profile & Quota Endpoints (`/api/employees`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees/leave-balance`| Employee | Returns detailed category balances (Allocated, Used, Pending, Available) |
| `PUT` | `/api/employees/profile` | Employee | Updates permitted profile details (e.g., Full Name) |
| `GET` | `/api/notifications` | User | Retrieves in-app notification feed and unread counter |
| `PATCH`| `/api/notifications/:id/read`| User | Marks a single notification as read |
| `PATCH`| `/api/notifications/read-all`| User | Marks all notifications as read |

### Administrator Endpoints (`/api/admin`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin | Computes executive metrics: headcount, total filings, queues, and departmental stats |
| `GET` | `/api/admin/leaves` | Admin | Lists all organization-wide leave applications with department/status filters |
| `PATCH`| `/api/admin/leaves/:id/approve` | Admin | Approves a pending request with remarks and applies atomic balance deduction |
| `PATCH`| `/api/admin/leaves/:id/reject` | Admin | Rejects a pending request with mandatory remarks |
| `GET` | `/api/admin/employees` | Admin | Lists all staff records with pagination and search |
| `POST` | `/api/admin/employees` | Admin | Creates a new employee account with temporary credentials |
| `PUT` | `/api/admin/employees/:id` | Admin | Updates employee profile (department, designation, name) |
| `PATCH`| `/api/admin/employees/:id/toggle-status`| Admin | Activates or soft-deactivates an employee account |
| `POST` | `/api/admin/employees/:id/reset-password`| Admin | Resets employee password to a secure temporary password |
| `GET` | `/api/admin/policies` | Admin | Retrieves annual statutory leave allocation policies |
| `PUT` | `/api/admin/policies/:id` | Admin | Modifies annual quotas and attachment mandates |

---

## 10. Automated Testing & Verification

The project includes automated integration tests for backend services and component unit tests for the frontend:

```bash
# Run all automated tests (backend + frontend)
npm test

# Run backend integration tests (Jest + Supertest)
npm run test:backend

# Run frontend component tests (Vitest + React Testing Library)
npm run test:frontend

# Run production frontend build
npm run build
```

- **Backend Integration Tests**: 20/20 test cases pass (authentication, leave calculation engine, balance holds, role guards, admin actions).
- **Frontend Component Tests**: 5/5 test cases pass (login rendering, dashboard layout, quota stat cards, notification dropdown).
- **Production Asset Build**: Clean production build outputs bundled assets into `frontend/dist/`.

---

## 11. Author & License

- **Author**: [VishwambharBK](https://github.com/VishwambharBK)
- **License**: ISC License
