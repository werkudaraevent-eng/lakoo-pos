-- Foundation fixes for Lakoo POS
-- 2026-04-25

-- Add tax_total column to sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS tax_total integer NOT NULL DEFAULT 0;

-- Expand payment_method options
-- Drop old constraint and add new one
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'qris', 'transfer', 'ewallet'));

-- Add new default settings
INSERT INTO settings (key, value) VALUES ('taxRate', '0') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('attribute1Label', 'Size') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('attribute2Label', 'Color') ON CONFLICT (key) DO NOTHING;
