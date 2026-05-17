-- ════════════════════════════════════════════════════════════════
-- RLS Policies — proper tenant isolation as defense-in-depth.
-- Applied via scripts/run-rls-policies-migration.mjs (idempotent runner).
-- ════════════════════════════════════════════════════════════════

-- Pre-requisite: ensure all tenant-scoped tables have tenant_id.
-- (Some legacy tables only got tenant_id via this migration.)

ALTER TABLE sale_promotion_usages ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
UPDATE sale_promotion_usages spu
   SET tenant_id = s.tenant_id
  FROM sales s
 WHERE spu.sale_id = s.id AND spu.tenant_id IS NULL;
ALTER TABLE sale_promotion_usages ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE workspace_assignments ADD COLUMN IF NOT EXISTS tenant_id text REFERENCES tenants(id);
UPDATE workspace_assignments wa
   SET tenant_id = w.tenant_id
  FROM workspaces w
 WHERE wa.workspace_id = w.id AND wa.tenant_id IS NULL;
ALTER TABLE workspace_assignments ALTER COLUMN tenant_id SET NOT NULL;

-- Helper: returns current tenant context from session GUC, or NULL when unset.
-- The NULL escape hatch lets maintenance scripts run without context, but
-- application code MUST set the GUC to actually benefit from isolation.
CREATE OR REPLACE FUNCTION app_current_tenant_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')
$$;

-- Reset RLS state so the migration is idempotent.
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','categories','products','product_variants','promotions',
    'sales','sale_items','sale_promotion_usages','inventory_movements',
    'settings','workspaces','workspace_assignments','audit_logs'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
  END LOOP;
END $$;

-- Re-enable RLS + create unified policy per table.
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','categories','products','product_variants','promotions',
    'sales','sale_items','sale_promotion_usages','inventory_movements',
    'settings','workspaces','workspace_assignments','audit_logs'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING (app_current_tenant_id() IS NULL OR tenant_id = app_current_tenant_id())
        WITH CHECK (app_current_tenant_id() IS NULL OR tenant_id = app_current_tenant_id())
    $f$, tbl);
  END LOOP;
END $$;

-- NOTE: We do NOT call FORCE ROW LEVEL SECURITY because Supabase's default
-- `postgres` role has BYPASSRLS=true. To make enforcement effective, the
-- application must connect via a non-bypass role and call
-- SET LOCAL app.tenant_id = '<tenantId>' at the start of each request.
-- That switch is planned for Sprint 3 to allow safe rollout.
