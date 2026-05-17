-- Platform configuration table for editable global settings
-- (e.g., upgrade URL, support contact, banner messages)

CREATE TABLE IF NOT EXISTS platform_config (
  key text PRIMARY KEY,
  value text,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- Seed default keys
INSERT INTO platform_config (key, value, description) VALUES
  ('upgrade_url',     'https://lynk.id/your-product',  'URL halaman pembayaran/upgrade paket (lynk.id)'),
  ('support_contact', 'https://wa.me/628123456789',    'Kontak admin/support setelah pembayaran (wa.me link, email, dsb.)'),
  ('support_label',   'Hubungi Admin via WhatsApp',    'Label tombol kontak admin yang ditampilkan ke user')
ON CONFLICT (key) DO NOTHING;
