import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

const TABLES = [
  "users", "categories", "products", "product_variants", "promotions",
  "sales", "sale_items", "sale_promotion_usages", "inventory_movements",
  "settings", "workspaces", "workspace_assignments", "audit_logs",
];

console.log("Running RLS policies migration...\n");

try {
  // Step 0: Ensure all tables have tenant_id column (idempotent backfill)
  console.log("Step 0: Ensuring all tables have tenant_id column...");

  // sale_promotion_usages can derive tenant_id from sale_id
  const spuHas = await sql`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sale_promotion_usages' AND column_name='tenant_id'`;
  if (spuHas.length === 0) {
    console.log("  Adding tenant_id to sale_promotion_usages...");
    await sql.unsafe(`ALTER TABLE sale_promotion_usages ADD COLUMN tenant_id text REFERENCES tenants(id)`);
    await sql.unsafe(`UPDATE sale_promotion_usages spu SET tenant_id = s.tenant_id FROM sales s WHERE spu.sale_id = s.id AND spu.tenant_id IS NULL`);
    await sql.unsafe(`ALTER TABLE sale_promotion_usages ALTER COLUMN tenant_id SET NOT NULL`);
    console.log("  ✓ sale_promotion_usages.tenant_id added & backfilled");
  } else {
    console.log("  ✓ sale_promotion_usages already has tenant_id");
  }

  // workspace_assignments derives tenant_id from workspace_id
  const waHas = await sql`SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workspace_assignments' AND column_name='tenant_id'`;
  if (waHas.length === 0) {
    console.log("  Adding tenant_id to workspace_assignments...");
    await sql.unsafe(`ALTER TABLE workspace_assignments ADD COLUMN tenant_id text REFERENCES tenants(id)`);
    await sql.unsafe(`UPDATE workspace_assignments wa SET tenant_id = w.tenant_id FROM workspaces w WHERE wa.workspace_id = w.id AND wa.tenant_id IS NULL`);
    await sql.unsafe(`ALTER TABLE workspace_assignments ALTER COLUMN tenant_id SET NOT NULL`);
    console.log("  ✓ workspace_assignments.tenant_id added & backfilled");
  } else {
    console.log("  ✓ workspace_assignments already has tenant_id");
  }
  console.log();

  // Step 1: Disable RLS first (clean slate)
  console.log("Step 1: Disabling RLS on all tenant tables...");
  for (const tbl of TABLES) {
    await sql.unsafe(`ALTER TABLE ${tbl} DISABLE ROW LEVEL SECURITY`);
  }
  console.log(`  ✓ Disabled RLS on ${TABLES.length} tables\n`);

  // Step 2: Helper function for current tenant context
  console.log("Step 2: Creating app_current_tenant_id() helper...");
  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION app_current_tenant_id()
    RETURNS text
    LANGUAGE sql STABLE
    AS $$
      SELECT NULLIF(current_setting('app.tenant_id', true), '')
    $$
  `);
  console.log("  ✓ Function created\n");

  // Step 3: Drop old policies (idempotent)
  console.log("Step 3: Dropping any old policies...");
  const oldNames = ["tenant_isolation", "tenant_isolation_select", "tenant_isolation_insert", "tenant_isolation_update", "tenant_isolation_delete"];
  for (const tbl of TABLES) {
    for (const name of oldNames) {
      await sql.unsafe(`DROP POLICY IF EXISTS ${name} ON ${tbl}`);
    }
  }
  console.log("  ✓ Old policies cleared\n");

  // Step 4: Re-enable RLS + create unified policy on each table
  console.log("Step 4: Enabling RLS + creating tenant_isolation policy on each table...");
  for (const tbl of TABLES) {
    await sql.unsafe(`ALTER TABLE ${tbl} ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`
      CREATE POLICY tenant_isolation ON ${tbl}
        USING (app_current_tenant_id() IS NULL OR tenant_id = app_current_tenant_id())
        WITH CHECK (app_current_tenant_id() IS NULL OR tenant_id = app_current_tenant_id())
    `);
    console.log(`  ✓ ${tbl}`);
  }

  // Step 5: Verify
  console.log("\nVerification:");
  const policies = await sql`
    SELECT tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname = 'tenant_isolation'
    ORDER BY tablename
  `;
  console.log(`  Found ${policies.length} tenant_isolation policies:`);
  for (const p of policies) {
    console.log(`    ✓ ${p.tablename}`);
  }

  console.log("\n✓ RLS policies migration completed successfully");
  console.log("\nNote: Policies are NOT yet enforced because Supabase's default");
  console.log("'postgres' role has BYPASSRLS=true. To activate enforcement,");
  console.log("the application must connect via a non-bypass role (Sprint 3).");
} catch (err) {
  console.error("\n✗ Migration failed:", err.message);
  console.error("Detail:", err.detail || "");
  process.exitCode = 1;
} finally {
  await sql.end();
}
