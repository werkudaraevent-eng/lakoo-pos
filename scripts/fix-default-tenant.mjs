import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

// Get store name from settings
const [storeName] = await sql`SELECT value FROM settings WHERE tenant_id = 'tenant-default' AND key = 'storeName'`;
const name = storeName?.value || "Luna Mode";

console.log(`Updating tenant-default name to "${name}"...`);

await sql`
  UPDATE tenants SET
    name = ${name},
    slug = 'luna-mode',
    email = 'luna@mode.id',
    updated_at = ${new Date().toISOString()}
  WHERE id = 'tenant-default' AND name = 'Default Tenant'
`;

// Verify
const [tenant] = await sql`SELECT id, name, slug, email, plan, status FROM tenants WHERE id = 'tenant-default'`;
console.log(`✓ Tenant: ${tenant.name} (${tenant.slug}) [${tenant.plan}] ${tenant.status}`);

await sql.end();
