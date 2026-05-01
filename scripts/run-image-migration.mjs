import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

console.log("Adding image_url column to products...");
try {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text`;
  console.log("✓ image_url column added.");

  // Verify
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url'`;
  console.log("Verified:", cols.length > 0 ? "column exists" : "FAILED");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
} finally {
  await sql.end();
}
