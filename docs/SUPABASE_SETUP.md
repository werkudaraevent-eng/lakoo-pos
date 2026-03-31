# Supabase Setup

## Yang Dipakai

App ini sekarang mengasumsikan database utama ada di Supabase Postgres.

Repo sudah menyediakan:

- schema migration: [202603300001_init_pos.sql](D:/Website/POS%20System/supabase/migrations/202603300001_init_pos.sql)
- seed data: [seed.sql](D:/Website/POS%20System/supabase/seed.sql)
- backend adapter Postgres: [db.js](D:/Website/POS%20System/server/db.js)

## Environment

Salin nilai dari [.env.example](D:/Website/POS%20System/.env.example) lalu isi:

- `SUPABASE_DB_URL`
- `POS_JWT_SECRET`

Gunakan connection string pooler Supabase untuk serverless/runtime seperti Netlify.

## Setup di Supabase

1. Buat project baru di Supabase.
2. Ambil Postgres connection string dari dashboard Supabase.
3. Jalankan isi file migration di SQL Editor Supabase.
4. Jalankan isi file seed setelah migration selesai.
5. Set env `SUPABASE_DB_URL` dan `POS_JWT_SECRET` di local/dev dan Netlify.

## Catatan

- Frontend tetap berbicara ke API Express yang sama.
- Auth user masih JWT lokal aplikasi, belum memakai Supabase Auth.
- Karena backend memakai server-side Postgres connection, secret database tidak pernah dikirim ke browser.
