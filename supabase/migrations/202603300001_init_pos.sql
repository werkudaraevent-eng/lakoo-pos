CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id),
  description text NOT NULL,
  base_price integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  size text NOT NULL,
  color text NOT NULL,
  price_override integer,
  quantity_on_hand integer NOT NULL,
  low_stock_threshold integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS promotions (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value integer NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  min_purchase integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id text PRIMARY KEY,
  receipt_number text NOT NULL UNIQUE,
  cashier_user_id text NOT NULL REFERENCES users(id),
  subtotal integer NOT NULL,
  discount_total integer NOT NULL,
  grand_total integer NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card')),
  paid_amount integer NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id text PRIMARY KEY,
  sale_id text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  variant_id text NOT NULL REFERENCES product_variants(id),
  product_name_snapshot text NOT NULL,
  sku_snapshot text NOT NULL,
  size_snapshot text NOT NULL,
  color_snapshot text NOT NULL,
  unit_price_snapshot integer NOT NULL,
  qty integer NOT NULL,
  line_total integer NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_promotion_usages (
  id text PRIMARY KEY,
  sale_id text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  promotion_id text NOT NULL REFERENCES promotions(id),
  code_snapshot text NOT NULL,
  discount_amount integer NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES product_variants(id),
  type text NOT NULL CHECK (type IN ('restock', 'adjustment', 'sale')),
  qty_delta integer NOT NULL,
  note text NOT NULL,
  actor_user_id text NOT NULL REFERENCES users(id),
  reference_id text,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_user_id ON sales(cashier_user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);
