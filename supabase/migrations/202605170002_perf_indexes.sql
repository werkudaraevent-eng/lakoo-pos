-- Composite indexes to speed up the most common multi-tenant queries.
-- Partial indexes WHERE deleted_at IS NULL keep them small and tightly targeted.

-- fetchSales: ORDER BY created_at DESC, filtered by tenant + active
CREATE INDEX IF NOT EXISTS idx_sales_tenant_active_created
  ON sales(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- fetchProducts equivalent: catalog page + bootstrap
CREATE INDEX IF NOT EXISTS idx_products_tenant_active_created
  ON products(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- fetchPromotions
CREATE INDEX IF NOT EXISTS idx_promotions_tenant_active_created
  ON promotions(tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- fetchInventoryMovements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_created
  ON inventory_movements(tenant_id, created_at DESC);

-- sale_items lookups by saleId batch (ANY)
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_sale
  ON sale_items(tenant_id, sale_id);
