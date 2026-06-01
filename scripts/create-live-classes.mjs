import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "live_classes" (
      "id" serial PRIMARY KEY NOT NULL,
      "admin_id" integer NOT NULL,
      "title" text NOT NULL,
      "description" text,
      "scheduled_at" timestamp NOT NULL,
      "duration_minutes" integer DEFAULT 60 NOT NULL,
      "status" text DEFAULT 'scheduled' NOT NULL,
      "daily_room_name" text,
      "daily_room_url" text,
      "viewer_count" integer DEFAULT 0,
      "started_at" timestamp,
      "ended_at" timestamp,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  try {
    await client.query(`
      ALTER TABLE "live_classes"
      ADD CONSTRAINT "live_classes_admin_id_users_id_fk"
      FOREIGN KEY ("admin_id") REFERENCES "users"("id")
    `);
  } catch (e) {
    if (!e.message.includes("already exists")) throw e;
  }
  console.log("✓ live_classes table created successfully");
} catch (err) {
  if (err.message.includes("already exists")) {
    console.log("✓ live_classes table already exists");
  } else {
    console.error("Error:", err.message);
  }
} finally {
  await client.end();
}
