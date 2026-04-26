-- Flexible variant attributes for Lakoo POS
-- Rename hardcoded size/color to generic attribute1/attribute2
-- 2026-04-26

-- Rename product_variants columns
ALTER TABLE product_variants RENAME COLUMN size TO attribute1_value;
ALTER TABLE product_variants RENAME COLUMN color TO attribute2_value;

-- Rename sale_items snapshot columns
ALTER TABLE sale_items RENAME COLUMN size_snapshot TO attribute1_snapshot;
ALTER TABLE sale_items RENAME COLUMN color_snapshot TO attribute2_snapshot;
