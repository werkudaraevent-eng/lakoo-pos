-- Remove rigid payment_method CHECK constraint to allow custom payment methods
-- Admin can now create custom payment methods from Settings (e.g., "Kripto", "COD", etc.)
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
