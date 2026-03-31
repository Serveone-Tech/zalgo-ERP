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

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUPS = 10;

// ── Ensure backup directory exists ───────────────────────────────────────────
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// ── Get all existing backups sorted oldest first ──────────────────────────────
function getExistingBackups(): string[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_") && f.endsWith(".zip"))
    .sort(); // alphabetical = chronological (because of date format)
}

// ── Delete oldest backup if limit exceeded ────────────────────────────────────
function cleanOldBackups() {
  const backups = getExistingBackups();
  if (backups.length >= MAX_BACKUPS) {
    const toDelete = backups.slice(0, backups.length - MAX_BACKUPS + 1);
    toDelete.forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`[Backup] Deleted old backup: ${file}`);
    });
  }
}

// ── Fetch all tables from DB ──────────────────────────────────────────────────
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
    users: usersData.map(({ passwordHash, ...u }) => u), // password hash exclude
    inventory: inventoryData,
    assignments: assignmentsData,
    exams: examsData,
    communications: communicationsData,
  };
}

// ── Create ZIP with all JSON files ───────────────────────────────────────────
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

    // Each table = separate JSON file inside ZIP
    Object.entries(data).forEach(([tableName, rows]) => {
      const json = JSON.stringify(rows, null, 2);
      archive.append(json, { name: `${tableName}.json` });
    });

    // Backup metadata file
    const meta = {
      createdAt: new Date().toISOString(),
      tables: Object.keys(data),
      rowCounts: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v.length]),
      ),
    };
    archive.append(JSON.stringify(meta, null, 2), { name: "_meta.json" });

    archive.finalize();
  });
}

// ── Main backup function ──────────────────────────────────────────────────────
export async function runBackup(): Promise<string> {
  try {
    ensureBackupDir();

    // Delete oldest if already 10 backups exist
    cleanOldBackups();

    // File name: backup_2026-03-29_14-30-00.zip
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace("T", "_")
      .replace(/:/g, "-")
      .split(".")[0];
    const fileName = `backup_${dateStr}.zip`;
    const zipPath = path.join(BACKUP_DIR, fileName);

    console.log(`[Backup] Starting backup: ${fileName}`);

    const data = await fetchAllData();
    await createZip(data, zipPath);

    const stats = fs.statSync(zipPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`[Backup] ✅ Completed: ${fileName} (${sizeMB} MB)`);
    console.log(
      `[Backup] Total backups stored: ${getExistingBackups().length}/${MAX_BACKUPS}`,
    );

    return zipPath;
  } catch (err) {
    console.error("[Backup] ❌ Backup failed:", err);
    throw err;
  }
}

// ── List all backups (for API endpoint) ───────────────────────────────────────
export function listBackups() {
  const backups = getExistingBackups();
  return backups
    .map((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        fileName: file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        createdAt: stats.mtime.toISOString(),
        path: filePath,
      };
    })
    .reverse(); // newest first
}
