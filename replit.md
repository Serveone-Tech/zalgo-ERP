# BADAM SINGH Classes — ERP System

## About
A full-stack Institute ERP Management System built for BADAM SINGH Classes by Zalgo Infotech. Covers multi-branch management, student admissions, teacher management, fees with installment tracking, academics, inventory, and communications.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, TailwindCSS, Shadcn/ui, TanStack Query, Wouter
- **Backend**: Node.js, Express.js, TypeScript, Express-Session
- **Database**: PostgreSQL (via Drizzle ORM)
- **Auth**: bcrypt + express-session + connect-pg-simple
- **Styling**: Teal `HSL(180, 78%, 29%)` + dark charcoal sidebar `HSL(220, 25%, 12%)` — Zalgo Infotech brand

## Default Login
- Email: `admin@badamsingh.com`
- Password: `admin123`

## RBAC Rules
- Admin role: sees all sidebar items, full access to all modules
- Non-admin (staff/accountant/teacher): sidebar shows only permitted modules
- adminOnly items (Branches, Users & Roles, ID Cards): admin-only, hidden from all non-admins
- Module items (leads, students, etc.): visible only if user has at least `module:read` permission
- Action buttons (Add, Import, Delete) are hidden if user lacks write/delete permissions respectively

## Sample Data (Production Seed)
- 9 Leads (various statuses: New, Follow-up, Converted)
- 6 Students (enrolled in JEE & NEET batches)
- 5 Teachers (Physics, Chemistry, Maths, Biology)
- 3 Courses (JEE Main & Advanced, NEET UG, test)
- 6 Fee records + 8 Fee Plans + 27 Installments
- 5 Assignments (JEE + NEET subjects)
- 6 Exams (Unit tests + Mock tests)
- 12 Inventory items (Books, Stationery, Electronics, Furniture)
- 12 Transactions (Income & Expense)
- 8 Communications (SMS, WhatsApp, Email)
- 4 Branches

## Project Structure

```
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout.tsx        # Responsive sidebar + header; nav filtered by canAccess() permissions
│   │   │   └── ui/               # Shadcn UI components
│   │   ├── contexts/
│   │   │   ├── auth.tsx          # Auth context: login/logout/user state + hasPermission + canAccess
│   │   │   └── branch.tsx        # Branch context (selected branch filter)
│   │   ├── hooks/
│   │   │   ├── use-dashboard.ts  # Dashboard stats with date/branch filter
│   │   │   └── use-permission.ts # usePermission(module) → {canRead, canWrite, canDelete}
│   │   ├── lib/
│   │   │   └── permissions.ts    # MODULES list, hasPerm, buildPermissionsArray, parsePermissionsMatrix
│   │   ├── pages/                # All page components
│   │   │   ├── login.tsx         # Login page
│   │   │   ├── dashboard.tsx     # Dashboard with period/date range filters
│   │   │   ├── leads.tsx
│   │   │   ├── students.tsx
│   │   │   ├── teachers.tsx
│   │   │   ├── courses.tsx
│   │   │   ├── fees.tsx          # Payments + Fee Plans + Installments tabs
│   │   │   ├── branches.tsx      # Branch management (CRUD)
│   │   │   ├── users.tsx         # User management with roles (admin only)
│   │   │   ├── assignments.tsx
│   │   │   ├── exams.tsx
│   │   │   ├── inventory.tsx
│   │   │   ├── transactions.tsx
│   │   │   ├── communications.tsx
│   │   │   ├── idcards.tsx
│   │   │   └── reports.tsx
│   │   └── App.tsx               # Router with auth guard
├── server/
│   ├── controllers/
│   │   ├── auth.controller.ts     # Login/logout/user CRUD + requireAuth middleware
│   │   ├── branches.controller.ts # Branch CRUD
│   │   ├── fee-plans.controller.ts  # Fee plans + installment payment
│   │   ├── notifications.controller.ts
│   │   ├── leads.controller.ts
│   │   ├── students.controller.ts
│   │   ├── teachers.controller.ts
│   │   ├── courses.controller.ts
│   │   ├── fees.controller.ts
│   │   ├── academics.controller.ts
│   │   └── operations.controller.ts # Dashboard (date/branch filtered) + transactions + comms
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── branches.routes.ts
│   │   ├── fee-plans.routes.ts
│   │   ├── notifications.routes.ts
│   │   └── (other route files)
│   ├── routes.ts                 # Main route registration + seeding
│   ├── storage.ts                # Full IStorage interface + DatabaseStorage
│   ├── index.ts                  # Express app with session middleware
│   └── db.ts                     # Drizzle DB connection
└── shared/
    ├── schema.ts                 # Full DB schema (all tables + Zod schemas + types)
    └── routes.ts                 # Shared API route definitions
```

## Features Implemented

### Authentication & Authorization
- Login/Logout with session cookies (bcrypt passwords)
- Roles: admin, staff, accountant, teacher
- Protected routes — all API endpoints require auth
- Admin-only: user management, user creation

### Multi-Branch Support
- Branches table with CRUD management UI at `/branches`
- Branch selector in header (persisted in localStorage)
- Leads, Students, Teachers, Fees, Transactions support `branchId` filtering
- Dashboard stats filter by selected branch

### Dashboard Date Filters
- Period buttons: Today, This Week, 15 Days, This Month, This Year, All Time
- Custom date range picker
- Revenue, students, leads counts filtered by date range and/or branch

### Fee Management (Installments)
- **Payments tab**: Record one-time fee payments with receipt
- **Fee Plans tab**: Create installment-based or one-time fee plans with discount
  - Auto-generates monthly installment records on creation
  - Shows progress bar (amount paid vs net fee)
- **Installments tab**: Track each installment with due dates
  - Overdue installments highlighted in red
  - "Pay" button opens payment dialog
  - WhatsApp notification mock logged to console on payment

### Other Modules
- Leads (Enquiries) with status tracking
- Students with enrollment management
- Teachers management
- Courses & Batches with enrollment
- Assignments & Exams scheduling
- Inventory management
- Income/Expense transactions
- Bulk SMS/WhatsApp/Email communications
- ID Card generation
- Reports
- In-app notifications bell with unread count

## Database Schema (Key Tables)
- `branches` — Multi-branch locations
- `users` — Auth users with roles/permissions
- `leads` — Enquiries/prospects
- `students` — Enrolled students
- `teachers` — Teaching staff
- `courses` — Course offerings
- `enrollments` — Student-course mapping
- `fees` — One-time payment records
- `fee_plans` — Installment plan structure per student
- `fee_installments` — Individual installment tracking
- `assignments` / `exams` — Academics
- `inventory` / `transactions` — Operations
- `communications` — Message log
- `notifications` — In-app alerts

## Seed Data (auto-created on first run)
- Admin user: admin@badamsingh.com / admin123
- 2 branches: Main Branch, South Delhi Branch
- 3 courses: JEE Main & Advanced, NEET UG, Foundation
- Sample students, teachers, leads, fees
- Fee plan with 3 installments (1 paid, 2 pending)
- Overdue notification

## Import Feature
- Bulk import via Excel (.xlsx) or OCR image scan
- Available on: Leads, Students, Teachers, Inventory, Transactions
- Template download + column mapping + preview before import
