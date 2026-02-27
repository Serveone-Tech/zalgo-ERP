# BADAM SINGH Classes — ERP System

## About
A full-stack Institute ERP Management System built for BADAM SINGH Classes by Zalgo Infotech.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, TailwindCSS, Shadcn/ui, TanStack Query
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Styling**: Teal + Charcoal theme (Zalgo Infotech brand colors)

## Project Structure

```
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout.tsx        # Responsive sidebar + header layout
│   │   │   └── ui/               # Shadcn UI components
│   │   ├── hooks/                # Data fetching hooks
│   │   ├── pages/                # All page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── leads.tsx
│   │   │   ├── students.tsx
│   │   │   ├── teachers.tsx
│   │   │   ├── courses.tsx
│   │   │   ├── fees.tsx
│   │   │   ├── assignments.tsx
│   │   │   ├── exams.tsx
│   │   │   ├── inventory.tsx
│   │   │   ├── transactions.tsx
│   │   │   ├── communications.tsx
│   │   │   ├── idcards.tsx
│   │   │   └── reports.tsx
│   │   ├── lib/                  # Utils, query client
│   │   ├── App.tsx               # Router
│   │   └── index.css             # Global styles + theme
│   └── public/
│       └── logo.png              # Zalgo Infotech logo
│
├── server/                   # Backend (Express.js)
│   ├── controllers/          # Business logic per module
│   │   ├── leads.controller.ts
│   │   ├── students.controller.ts
│   │   ├── teachers.controller.ts
│   │   ├── courses.controller.ts
│   │   ├── fees.controller.ts
│   │   ├── academics.controller.ts    (assignments + exams)
│   │   └── operations.controller.ts   (inventory, transactions, comms, dashboard)
│   ├── routes/               # Route definitions per module
│   │   ├── leads.routes.ts
│   │   ├── students.routes.ts
│   │   ├── teachers.routes.ts
│   │   ├── courses.routes.ts
│   │   ├── fees.routes.ts
│   │   ├── academics.routes.ts
│   │   └── operations.routes.ts
│   ├── models/               # Re-exports shared schema
│   │   └── index.ts
│   ├── routes.ts             # Main route aggregator
│   ├── storage.ts            # Database CRUD interface
│   ├── db.ts                 # DB connection
│   └── index.ts              # Entry point
│
└── shared/                   # Shared between frontend & backend
    ├── schema.ts             # Database schema + Zod types
    └── routes.ts             # API contract definitions
```

## Modules
1. **Dashboard** — Overview stats: students, leads, revenue, enrollments
2. **Enquiries (Leads)** — Track and manage admission inquiries
3. **Students** — Full student profiles with photo, parent info
4. **Teachers** — Teacher management with subjects
5. **Courses & Batches** — Course management + enrolled student list + bulk messaging
6. **Assignments** — Create and assign tasks to batches
7. **Exams** — Schedule offline exams per batch
8. **Fees & Payments** — Fee collection records, receipt generation
9. **Income / Expense** — Daily financial tracking
10. **Inventory** — Stock management with low-stock alerts
11. **Communications** — WhatsApp/SMS/Email messaging to students, parents (bulk & individual)
12. **ID Cards** — View and print ID cards for students/teachers
13. **Reports** — Analytics across all modules

## Running Locally
```bash
npm install
npm run db:push
npm run dev
```

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session secret key
