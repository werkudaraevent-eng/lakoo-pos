import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

console.log("Running performance composite indexes migration...");

try {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sales_tenant_active_created
      ON sales(tenant_id, created_at DESC)
      WHERE deleted_at IS NULL
  `;
  console.log("✓ idx_sales_tenant_active_created");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_products_tenant_active_created
      ON products(tenant_id, created_at DESC)
      WHERE deleted_at IS NULL
  `;
  console.log("✓ idx_products_tenant_active_created");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_promotions_tenant_active_created
      ON promotions(tenant_id, created_at DESC)
      WHERE deleted_at IS NULL
  `;
  console.log("✓ idx_promotions_tenant_active_created");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_created
      ON inventory_movements(tenant_id, created_at DESC)
  `;
  console.log("✓ idx_inventory_movements_tenant_created");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_sale
      ON sale_items(tenant_id, sale_id)
  `;
  console.log("✓ idx_sale_items_tenant_sale");

  console.log("\nAll composite indexes created successfully.");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
} finally {
  await sql.end();
}
