import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

const tables = [
  "users", "categories", "products", "product_variants", "promotions",
  "sales", "sale_items", "sale_promotion_usages", "inventory_movements",
  "settings", "workspaces", "workspace_assignments", "workspace_variant_stocks"
];

console.log("=== TENANT_ID COLUMN CHECK ===\n");

for (const table of tables) {
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = ${table} AND column_name = 'tenant_id'
  `;
  const has = cols.length > 0;
  console.log(`  ${has ? "✅" : "❌"} ${table}${has ? "" : " — MISSING tenant_id!"}`);
}

await sql.end();
