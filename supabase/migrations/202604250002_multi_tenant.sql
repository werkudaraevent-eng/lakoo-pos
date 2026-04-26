-- Multi-tenant architecture for Lakoo POS
-- 2026-04-25

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
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
);

-- Add tenant_id to all major tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);

-- Indexes for tenant scoping
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_id ON product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_tenant_id ON promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_id ON workspaces(tenant_id);

-- Make settings key unique per tenant (not globally)
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS id text;
UPDATE settings SET id = 'set-' || gen_random_uuid()::text WHERE id IS NULL;
ALTER TABLE settings ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_tenant_key ON settings(tenant_id, key);

-- Super admin table (platform-level, not tenant-level)
CREATE TABLE IF NOT EXISTS platform_admins (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL
);
