INSERT INTO users (id, name, username, password_hash, role, is_active, created_at) VALUES
  ('u1', 'Alya Rahman', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', true, '2026-03-30T00:00:00.000Z'),
  ('u2', 'Dimas Putra', 'manager', '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', 'manager', true, '2026-03-30T00:00:00.000Z'),
  ('u3', 'Salsa Dewi', 'cashier', 'b4c94003c562bb0d89535eca77f07284fe560fd48a7cc1ed99f0a56263d616ba', 'cashier', true, '2026-03-30T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug) VALUES
  ('c1', 'Shirts', 'shirts'),
  ('c2', 'Pants', 'pants'),
  ('c3', 'Dresses', 'dresses')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, category_id, description, base_price, is_active, created_at) VALUES
  ('p1', 'Aster Overshirt', 'c1', 'Relaxed overshirt untuk koleksi fashion wanita.', 329000, true, '2026-03-30T00:00:00.000Z'),
  ('p2', 'Mora Wide Pants', 'c2', 'Celana wide leg dengan bahan ringan.', 289000, true, '2026-03-30T00:00:00.000Z'),
  ('p3', 'Sora Knit Dress', 'c3', 'Dress knit premium untuk display utama.', 459000, true, '2026-03-30T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, size, color, price_override, quantity_on_hand, low_stock_threshold, is_active, created_at) VALUES
  ('v1', 'p1', 'AST-BLK-S', 'S', 'Black', NULL, 12, 4, true, '2026-03-30T00:00:00.000Z'),
  ('v2', 'p1', 'AST-BLK-M', 'M', 'Black', NULL, 5, 4, true, '2026-03-30T00:00:00.000Z'),
  ('v3', 'p1', 'AST-SND-L', 'L', 'Sand', 339000, 3, 4, true, '2026-03-30T00:00:00.000Z'),
  ('v4', 'p2', 'MOR-NVY-M', 'M', 'Navy', NULL, 9, 3, true, '2026-03-30T00:00:00.000Z'),
  ('v5', 'p2', 'MOR-NVY-L', 'L', 'Navy', NULL, 2, 3, true, '2026-03-30T00:00:00.000Z'),
  ('v6', 'p3', 'SOR-IVR-S', 'S', 'Ivory', NULL, 8, 2, true, '2026-03-30T00:00:00.000Z'),
  ('v7', 'p3', 'SOR-OLV-M', 'M', 'Olive', NULL, 6, 2, true, '2026-03-30T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO promotions (id, code, type, value, start_at, end_at, min_purchase, is_active, created_by, created_at) VALUES
  ('promo-1', 'LUNA10', 'percentage', 10, '2026-03-01T00:00:00.000Z', '2026-04-30T23:59:59.000Z', 300000, true, 'u1', '2026-03-30T00:00:00.000Z'),
  ('promo-2', 'CARD50', 'fixed', 50000, '2026-03-10T00:00:00.000Z', '2026-04-15T23:59:59.000Z', 500000, true, 'u2', '2026-03-30T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('storeName', 'Luna Mode'),
  ('storeCode', 'LM-JKT-01'),
  ('address', 'Jl. Kemang Raya No. 18, Jakarta Selatan'),
  ('paymentMethods', '["cash","card"]'),
  ('serviceChargeEnabled', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO sales (id, receipt_number, cashier_user_id, subtotal, discount_total, grand_total, payment_method, paid_amount, created_at) VALUES
  ('sale-1', 'POS-20260330-1', 'u3', 618000, 61800, 556200, 'card', 556200, '2026-03-30T08:12:00.000Z'),
  ('sale-2', 'POS-20260329-8', 'u3', 459000, 0, 459000, 'cash', 459000, '2026-03-29T12:42:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, unit_price_snapshot, qty, line_total) VALUES
  ('si-1', 'sale-1', 'v2', 'Aster Overshirt', 'AST-BLK-M', 'M', 'Black', 329000, 1, 329000),
  ('si-2', 'sale-1', 'v4', 'Mora Wide Pants', 'MOR-NVY-M', 'M', 'Navy', 289000, 1, 289000),
  ('si-3', 'sale-2', 'v6', 'Sora Knit Dress', 'SOR-IVR-S', 'S', 'Ivory', 459000, 1, 459000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_promotion_usages (id, sale_id, promotion_id, code_snapshot, discount_amount) VALUES
  ('spu-1', 'sale-1', 'promo-1', 'LUNA10', 61800)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory_movements (id, variant_id, type, qty_delta, note, actor_user_id, reference_id, created_at) VALUES
  ('m1', 'v3', 'adjustment', -1, 'Display sample', 'u2', NULL, '2026-03-29T09:30:00.000Z'),
  ('m2', 'v5', 'sale', -1, 'Sale POS-20260329-7', 'u3', 'sale-legacy', '2026-03-29T14:15:00.000Z'),
  ('m3', 'v2', 'restock', 4, 'Weekend replenishment', 'u1', NULL, '2026-03-30T07:45:00.000Z')
ON CONFLICT (id) DO NOTHING;
