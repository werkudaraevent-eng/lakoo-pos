CREATE TABLE IF NOT EXISTS workspaces (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('store', 'event')),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  stock_mode text CHECK (stock_mode IN ('allocate', 'manual')),
  location_label text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_visible boolean NOT NULL DEFAULT true,
  closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_assignments (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_variant_stocks (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  variant_id text NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity_on_hand integer NOT NULL,
  source_mode text NOT NULL CHECK (source_mode IN ('allocate', 'manual')),
  allocated_from_main integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (workspace_id, variant_id)
);

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS workspace_id text REFERENCES workspaces(id);

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS workspace_id text REFERENCES workspaces(id);

CREATE INDEX IF NOT EXISTS idx_workspace_assignments_workspace_id ON workspace_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_user_id ON workspace_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_variant_stocks_workspace_id ON workspace_variant_stocks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sales_workspace_id ON sales(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_workspace_id ON inventory_movements(workspace_id);
