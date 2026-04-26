import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.SUPABASE_DB_URL, {prepare:false});

console.log('Running RLS + constraints migration...');

// Add email column to users
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`;

// Drop old unique constraints and add tenant-scoped ones
try { await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key`; } catch(e) {}
try { await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key`; } catch(e) {}
try { await sql`ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key`; } catch(e) {}
try { await sql`ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_code_key`; } catch(e) {}

// Create tenant-scoped unique indexes
await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_username ON users(tenant_id, lower(username))`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_tenant_slug ON categories(tenant_id, slug)`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_tenant_sku ON product_variants(tenant_id, sku)`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_tenant_code ON promotions(tenant_id, code)`;

console.log('Done!');
await sql.end();
