-- Multi-tenant RLS policies and constraints for Lakoo POS
-- 2026-04-26

-- Create a default tenant for existing data migration
INSERT INTO tenants (id, name, slug, email, plan, status, trial_ends_at, created_at, updated_at)
VALUES (
  'tenant-default',
  'Default Tenant',
  'default',
  'admin@lakoo.local',
  'pro',
  'active',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Backfill existing rows with default tenant
UPDATE users SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE categories SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE products SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE product_variants SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE promotions SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE sales SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE sale_items SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE inventory_movements SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE settings SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE workspaces SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;

-- Now set NOT NULL constraints
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE product_variants ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE promotions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sale_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE inventory_movements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workspaces ALTER COLUMN tenant_id SET NOT NULL;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_assignments ENABLE ROW LEVEL SECURITY;

-- Add tenant_id to workspace_assignments and sale_promotion_usages for RLS
ALTER TABLE workspace_assignments ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
ALTER TABLE sale_promotion_usages ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
UPDATE workspace_assignments SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
UPDATE sale_promotion_usages SET tenant_id = 'tenant-default' WHERE tenant_id IS NULL;
ALTER TABLE workspace_assignments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sale_promotion_usages ALTER COLUMN tenant_id SET NOT NULL;

-- Add email column to users for registration
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Unique username per tenant (not globally)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username ON users(tenant_id, lower(username));

-- Unique category slug per tenant
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_tenant_slug ON categories(tenant_id, slug);

-- Unique SKU per tenant
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_tenant_sku ON product_variants(tenant_id, sku);

-- Unique promo code per tenant
ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_tenant_code ON promotions(tenant_id, code);
