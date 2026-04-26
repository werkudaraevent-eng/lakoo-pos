import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.SUPABASE_DB_URL, {prepare:false});

console.log('Running flexible attributes migration...');
await sql`ALTER TABLE product_variants RENAME COLUMN size TO attribute1_value`;
await sql`ALTER TABLE product_variants RENAME COLUMN color TO attribute2_value`;
await sql`ALTER TABLE sale_items RENAME COLUMN size_snapshot TO attribute1_snapshot`;
await sql`ALTER TABLE sale_items RENAME COLUMN color_snapshot TO attribute2_snapshot`;
console.log('Done! Columns renamed.');

// Verify
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'product_variants' ORDER BY ordinal_position`;
console.log('product_variants columns:', cols.map(c => c.column_name));

await sql.end();
