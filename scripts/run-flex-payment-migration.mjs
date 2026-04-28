import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

console.log("Dropping rigid payment_method CHECK constraint...");

try {
  await sql`ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check`;
  console.log("✓ CHECK constraint removed — payment methods are now flexible.");

  // Verify
  const cols = await sql`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'sales' AND constraint_type = 'CHECK'
  `;
  console.log("Remaining CHECK constraints on sales:", cols.length === 0 ? "none" : cols.map(c => c.constraint_name));
} catch (err) {
  console.error("✗ Migration failed:", err.message);
} finally {
  await sql.end();
}
