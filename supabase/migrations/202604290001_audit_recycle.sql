-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id),
  user_id text,
  user_name text NOT NULL DEFAULT 'System',
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(tenant_id, action);

-- Add deleted_at to products (soft delete / recycle bin)
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add deleted_at to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add deleted_at to promotions
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
