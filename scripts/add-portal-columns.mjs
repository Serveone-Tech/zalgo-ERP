import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const queries = [
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id)`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS can_watch_live_classes boolean DEFAULT true`,
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS can_watch_recordings boolean DEFAULT true`,
  `ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS recording_url text`,
  `ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS recording_id text`,
  `ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS recording_allowed boolean DEFAULT false`,
];

try {
  for (const q of queries) {
    await client.query(q);
    console.log("✓", q.slice(0, 60));
  }
  console.log("\n✅ All columns added successfully");
} catch (err) {
  console.error("Error:", err.message);
} finally {
  await client.end();
}
