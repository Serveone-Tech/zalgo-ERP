# Badam Singh Classes ERP

  ## Overview
  A comprehensive Institute Management System built with Node.js, Express, React, and PostgreSQL.

  ## Features
  - Dashboard with real-time statistics
  - Lead & Enquiry Management
  - Student Management
  - Teacher Management
  - Course & Batch Management
  - Fee & Payment Tracking

  ## Tech Stack
  - Frontend: React (Vite), Tailwind CSS, Shadcn UI, TanStack Query
  - Backend: Express.js
  - Database: PostgreSQL with Drizzle ORM
  - Validation: Zod

  ## Local Development
  1. Clone the repository
  2. Install dependencies: `npm install`
  3. Set up PostgreSQL and provide `DATABASE_URL` in `.env`
  4. Run migrations: `npm run db:push`
  5. Start development server: `npm run dev`

  ## Exporting & Hosting
  You can download the entire project as a ZIP file from the Replit interface (File menu -> Download as ZIP). To host it on your own domain:
  1. Build the frontend: `npm run build`
  2. The server serves the static files from the `dist/public` folder in production mode.
  3. Deploy the `dist` folder and server code to your VPS/Hosting.
  4. Set up a reverse proxy (like Nginx) to point your domain to the application port (default 5000).
  