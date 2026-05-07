import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

console.log("Making category_id nullable on products...");
try {
  await sql`ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL`;
  console.log("✓ category_id is now nullable.");
} catch (err) {
  console.error("✗ Failed:", err.message);
} finally {
  await sql.end();
}
