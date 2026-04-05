// server/utils/backup.ts — REPLACE
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { db } from "../db";
import {
  students,
  teachers,
  leads,
  courses,
  enrollments,
  fees,
  feePlans,
  feeInstallments,
  transactions,
  branches,
  users,
  inventory,
  assignments,
  exams,
  communications,
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

const BASE_BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUPS = 10;

// ── Per-admin backup directory ────────────────────────────────────────────────
function getBackupDir(adminId?: number): string {
  if (adminId) return path.join(BASE_BACKUP_DIR, `admin_${adminId}`);
  return BASE_BACKUP_DIR;
}

function ensureBackupDir(adminId?: number) {
  const dir = getBackupDir(adminId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getExistingBackups(adminId?: number): string[] {
  const dir = getBackupDir(adminId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("backup_") && f.endsWith(".zip"))
    .sort();
}

function cleanOldBackups(adminId?: number) {
  const backups = getExistingBackups(adminId);
  const dir = getBackupDir(adminId);
  if (backups.length >= MAX_BACKUPS) {
    const toDelete = backups.slice(0, backups.length - MAX_BACKUPS + 1);
    toDelete.forEach((file) => {
      const filePath = path.join(dir, file);
      fs.unlinkSync(filePath);
      console.log(`[Backup] Deleted old backup: ${file}`);
    });
  }
}

// ── Fetch only this admin's data ──────────────────────────────────────────────
async function fetchAdminData(adminId: number) {
  // Get admin's branch IDs
  const adminBranches = adminId
    ? await db
        .select({ id: branches.id })
        .from(branches)
        .where(eq((branches as any).adminId, adminId))
    : [];
  const branchIds = adminBranches.map((b) => b.id);

  // Helper filter
  const byBranch = (col: any) =>
    branchIds.length > 0 ? inArray(col, branchIds) : undefined;

  // Get admin's courses
  const coursesData = await db
    .select()
    .from(courses)
    .where(eq((courses as any).adminId, adminId));
  const courseIds = coursesData.map((c) => c.id);

  const [
    studentsData,
    teachersData,
    leadsData,
    enrollmentsData,
    feesData,
    feePlansData,
    feeInstallmentsData,
    transactionsData,
    branchesData,
    inventoryData,
    assignmentsData,
    examsData,
    communicationsData,
  ] = await Promise.all([
    // Students - by branch
    branchIds.length > 0
      ? db.select().from(students).where(inArray(students.branchId, branchIds))
      : Promise.resolve([]),

    // Teachers - by branch
    branchIds.length > 0
      ? db.select().from(teachers).where(inArray(teachers.branchId, branchIds))
      : Promise.resolve([]),

    // Leads - by branch
    branchIds.length > 0
      ? db.select().from(leads).where(inArray(leads.branchId, branchIds))
      : Promise.resolve([]),

    // Enrollments - by course
    courseIds.length > 0
      ? db
          .select()
          .from(enrollments)
          .where(inArray(enrollments.courseId, courseIds))
      : Promise.resolve([]),

    // Fees - by branch (via student)
    branchIds.length > 0
      ? db
          .select({ fee: fees })
          .from(fees)
          .leftJoin(students, eq(fees.studentId, students.id))
          .where(inArray(students.branchId, branchIds))
          .then((r) => r.map((x) => x.fee))
      : Promise.resolve([]),

    // Fee Plans - by student branch
    branchIds.length > 0
      ? db
          .select({ plan: feePlans })
          .from(feePlans)
          .leftJoin(students, eq(feePlans.studentId, students.id))
          .where(inArray(students.branchId, branchIds))
          .then((r) => r.map((x) => x.plan))
      : Promise.resolve([]),

    // Fee Installments - by student branch
    branchIds.length > 0
      ? db
          .select({ inst: feeInstallments })
          .from(feeInstallments)
          .leftJoin(students, eq(feeInstallments.studentId, students.id))
          .where(inArray(students.branchId, branchIds))
          .then((r) => r.map((x) => x.inst))
      : Promise.resolve([]),

    // Transactions - by branch
    branchIds.length > 0
      ? db
          .select()
          .from(transactions)
          .where(inArray(transactions.branchId, branchIds))
      : Promise.resolve([]),

    // Branches - only this admin's
    db
      .select()
      .from(branches)
      .where(eq((branches as any).adminId, adminId)),

    // Inventory - by branch
    branchIds.length > 0
      ? db
          .select()
          .from(inventory)
          .where(inArray(inventory.branchId, branchIds))
      : Promise.resolve([]),

    // Assignments - by course
    courseIds.length > 0
      ? db
          .select()
          .from(assignments)
          .where(inArray(assignments.courseId, courseIds))
      : Promise.resolve([]),

    // Exams - by course
    courseIds.length > 0
      ? db.select().from(exams).where(inArray(exams.courseId, courseIds))
      : Promise.resolve([]),

    // Communications - by adminId
    db
      .select()
      .from(communications)
      .where(eq((communications as any).adminId, adminId)),
  ]);

  // Admin user info (without password)
  const adminUser = await db.select().from(users).where(eq(users.id, adminId));

  return {
    students: studentsData,
    teachers: teachersData,
    leads: leadsData,
    courses: coursesData,
    enrollments: enrollmentsData,
    fees: feesData,
    feePlans: feePlansData,
    feeInstallments: feeInstallmentsData,
    transactions: transactionsData,
    branches: branchesData,
    users: adminUser.map(({ passwordHash, ...u }) => u),
    inventory: inventoryData,
    assignments: assignmentsData,
    exams: examsData,
    communications: communicationsData,
  };
}

// ── Fetch ALL data (for superadmin) ──────────────────────────────────────────
async function fetchAllData() {
  const [
    studentsData,
    teachersData,
    leadsData,
    coursesData,
    enrollmentsData,
    feesData,
    feePlansData,
    feeInstallmentsData,
    transactionsData,
    branchesData,
    usersData,
    inventoryData,
    assignmentsData,
    examsData,
    communicationsData,
  ] = await Promise.all([
    db.select().from(students),
    db.select().from(teachers),
    db.select().from(leads),
    db.select().from(courses),
    db.select().from(enrollments),
    db.select().from(fees),
    db.select().from(feePlans),
    db.select().from(feeInstallments),
    db.select().from(transactions),
    db.select().from(branches),
    db.select().from(users),
    db.select().from(inventory),
    db.select().from(assignments),
    db.select().from(exams),
    db.select().from(communications),
  ]);
  return {
    students: studentsData,
    teachers: teachersData,
    leads: leadsData,
    courses: coursesData,
    enrollments: enrollmentsData,
    fees: feesData,
    feePlans: feePlansData,
    feeInstallments: feeInstallmentsData,
    transactions: transactionsData,
    branches: branchesData,
    users: usersData.map(({ passwordHash, ...u }) => u),
    inventory: inventoryData,
    assignments: assignmentsData,
    exams: examsData,
    communications: communicationsData,
  };
}

// ── Create ZIP ────────────────────────────────────────────────────────────────
function createZip(
  data: Record<string, any[]>,
  zipPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));
    archive.pipe(output);
    Object.entries(data).forEach(([tableName, rows]) => {
      archive.append(JSON.stringify(rows, null, 2), {
        name: `${tableName}.json`,
      });
    });
    archive.append(
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          tables: Object.keys(data),
          rowCounts: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v.length]),
          ),
        },
        null,
        2,
      ),
      { name: "_meta.json" },
    );
    archive.finalize();
  });
}

// ── Main backup function ──────────────────────────────────────────────────────
export async function runBackup(adminId?: number): Promise<string> {
  try {
    ensureBackupDir(adminId);
    cleanOldBackups(adminId);

    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace("T", "_")
      .replace(/:/g, "-")
      .split(".")[0];
    const fileName = `backup_${dateStr}.zip`;
    const dir = getBackupDir(adminId);
    const zipPath = path.join(dir, fileName);

    console.log(
      `[Backup] Starting backup: ${fileName} (admin: ${adminId ?? "superadmin"})`,
    );

    const data = adminId ? await fetchAdminData(adminId) : await fetchAllData();
    await createZip(data, zipPath);

    const stats = fs.statSync(zipPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`[Backup] Completed: ${fileName} (${sizeMB} MB)`);
    console.log(
      `[Backup] Total backups: ${getExistingBackups(adminId).length}/${MAX_BACKUPS}`,
    );

    return zipPath;
  } catch (err) {
    console.error("[Backup] Backup failed:", err);
    throw err;
  }
}

// ── List backups for a specific admin ─────────────────────────────────────────
export function listBackups(adminId?: number) {
  const dir = getBackupDir(adminId);
  const backups = getExistingBackups(adminId);
  return backups
    .map((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      return {
        fileName: file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: stats.mtime.toISOString(),
        path: filePath,
      };
    })
    .reverse();
}
