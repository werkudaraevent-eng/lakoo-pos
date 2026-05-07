import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

console.log("Running audit & recycle bin migration...");

try {
  // Create audit_logs table
  await sql`CREATE TABLE IF NOT EXISTS audit_logs (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    user_id text,
    user_name text NOT NULL DEFAULT 'System',
    action text NOT NULL,
    entity_type text,
    entity_id text,
    details jsonb,
    ip_address text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  console.log("✓ audit_logs table created");

  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(tenant_id, created_at DESC)`;
  console.log("✓ indexes created");

  // Add deleted_at columns
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamptz`;
  await sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at timestamptz`;
  await sql`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at timestamptz`;
  console.log("✓ deleted_at columns added to products, sales, promotions");

  // Verify
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'audit_logs'`;
  console.log("Verified audit_logs:", tables.length > 0 ? "exists" : "FAILED");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
} finally {
  await sql.end();
}
