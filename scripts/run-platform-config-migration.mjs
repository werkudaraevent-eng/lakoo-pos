import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.SUPABASE_DB_URL, { ssl: "prefer" });

console.log("Running platform_config migration...");

try {
  // Create platform_config table
  await sql`CREATE TABLE IF NOT EXISTS platform_config (
    key text PRIMARY KEY,
    value text,
    description text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by text
  )`;
  console.log("✓ platform_config table created");

  // Seed default keys
  await sql`
    INSERT INTO platform_config (key, value, description) VALUES
      ('upgrade_url',     'https://lynk.id/your-product',  'URL halaman pembayaran/upgrade paket (lynk.id)'),
      ('support_contact', 'https://wa.me/628123456789',    'Kontak admin/support setelah pembayaran (wa.me link, email, dsb.)'),
      ('support_label',   'Hubungi Admin via WhatsApp',    'Label tombol kontak admin yang ditampilkan ke user')
    ON CONFLICT (key) DO NOTHING
  `;
  console.log("✓ default keys seeded (upgrade_url, support_contact, support_label)");

  // Verify
  const rows = await sql`SELECT key, value FROM platform_config ORDER BY key`;
  console.log("Verified rows:");
  for (const row of rows) {
    console.log(`  - ${row.key}: ${row.value}`);
  }
} catch (err) {
  console.error("✗ Migration failed:", err.message);
} finally {
  await sql.end();
}
