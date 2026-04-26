import postgres from 'postgres';
import 'dotenv/config';

const url = process.env.SUPABASE_DB_URL;
console.log("Connecting...");

const sql = postgres(url, { prepare: false, connect_timeout: 15, idle_timeout: 10 });

const statements = [
  // 1. Create tenants table
  `CREATE TABLE IF NOT EXISTS tenants (
    id text PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'business')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    trial_ends_at timestamptz,
    subscription_starts_at timestamptz,
    subscription_ends_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
  )`,

  // 2-10. Add tenant_id columns
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,
  `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id)`,

  // 11-19. Indexes
  `CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_id ON product_variants(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_promotions_tenant_id ON promotions(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON inventory_movements(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_id ON workspaces(tenant_id)`,

  // 20. Fix settings PK for multi-tenant (key per tenant)
  `ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS id text`,
  `UPDATE settings SET id = 'set-' || gen_random_uuid()::text WHERE id IS NULL`,
  `ALTER TABLE settings ALTER COLUMN id SET NOT NULL`,
  `ALTER TABLE settings ADD PRIMARY KEY (id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_tenant_key ON settings(tenant_id, key)`,

  // 21. Platform admins
  `CREATE TABLE IF NOT EXISTS platform_admins (
    id text PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL
  )`,
];

try {
  for (let i = 0; i < statements.length; i++) {
    try {
      await sql.unsafe(statements[i]);
      console.log(`  [${i + 1}/${statements.length}] OK`);
    } catch (e) {
      console.error(`  [${i + 1}/${statements.length}] ERROR: ${e.message}`);
    }
  }
  console.log("Migration complete!");
} catch (e) {
  console.error("Fatal:", e.message);
} finally {
  await sql.end();
}
