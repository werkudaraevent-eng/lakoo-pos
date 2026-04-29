import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

// All tenants
const tenants = await sql`SELECT id, name, slug, email, plan, status, created_at FROM tenants ORDER BY created_at`;
console.log("=== TENANTS ===");
for (const t of tenants) {
  console.log(`  ${t.id} | ${t.name} | ${t.slug} | ${t.email} | ${t.plan} | ${t.status}`);
}

// Count per tenant
for (const t of tenants) {
  const [users] = await sql`SELECT COUNT(*)::int AS c FROM users WHERE tenant_id = ${t.id}`;
  const [workspaces] = await sql`SELECT COUNT(*)::int AS c FROM workspaces WHERE tenant_id = ${t.id}`;
  const [products] = await sql`SELECT COUNT(*)::int AS c FROM products WHERE tenant_id = ${t.id}`;
  const [sales] = await sql`SELECT COUNT(*)::int AS c FROM sales WHERE tenant_id = ${t.id}`;
  console.log(`  → Users: ${users.c}, Workspaces: ${workspaces.c}, Products: ${products.c}, Sales: ${sales.c}`);
}

// Check settings
const settings = await sql`SELECT tenant_id, key, value FROM settings WHERE key = 'storeName'`;
console.log("\n=== STORE NAMES ===");
for (const s of settings) {
  console.log(`  ${s.tenant_id} → ${s.value}`);
}

await sql.end();
