import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.SUPABASE_DB_URL, {prepare:false});

console.log('Backfilling tenant_id...');

// Create default tenant if not exists
await sql`
  INSERT INTO tenants (id, name, slug, email, plan, status, trial_ends_at, created_at, updated_at)
  VALUES ('tenant-default', 'Default Tenant', 'default', 'admin@lakoo.local', 'pro', 'active', NULL, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
`;

// Backfill all tables
await sql`UPDATE users SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE categories SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE products SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE product_variants SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE promotions SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE sales SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE sale_items SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE inventory_movements SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE settings SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;
await sql`UPDATE workspaces SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL`;

// Verify
const users = await sql`SELECT id, username, tenant_id FROM users LIMIT 3`;
console.log('Users after backfill:', JSON.stringify(users, null, 2));

console.log('Done! All rows now have tenant_id = tenant-default');
await sql.end();
