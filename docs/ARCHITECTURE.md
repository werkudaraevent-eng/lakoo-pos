# POS Platform Architecture

## Goal

Repository ini sekarang berisi platform POS MVP untuk single-store fashion retail, dengan backend yang disiapkan untuk jalan di atas Supabase Postgres.

Fokus current scope:

- login berbasis JWT lokal
- role-based routing untuk `admin`, `manager`, dan `cashier`
- checkout dan sales history yang menulis ke database
- catalog CRUD untuk product dan variant
- inventory movement yang auditable
- promotions, reports, settings, dan user management dasar
- printable receipt view dari histori transaksi

## Stack

```text
Frontend: Vite, React, React Router
Backend: Express
Database: Supabase Postgres
Auth: HMAC-signed JWT local token
Styling: Plain CSS
```

## File Layout

```text
index.html
package.json
vite.config.js
server/
  auth.js
  db.js
  index.js
  mappers.js
supabase/
  migrations/
    202603300001_init_pos.sql
  seed.sql
src/
  api/
    client.js
  app/
    App.jsx
    ProtectedRoute.jsx
  components/
    AppShell.jsx
  context/
    AuthContext.jsx
    PosDataContext.jsx
  features/
    catalog/
      catalogHelpers.js
    sales/
      salesHelpers.js
  pages/
    LoginPage.jsx
    DashboardPage.jsx
    CheckoutPage.jsx
    CatalogPage.jsx
    InventoryPage.jsx
    PromotionsPage.jsx
    ReportsPage.jsx
    ReceiptPage.jsx
    SalesPage.jsx
    SettingsPage.jsx
    UsersPage.jsx
  utils/
    formatters.js
  main.jsx
  styles.css
tests/
  catalog-helpers.test.js
  sales-helpers.test.js
docs/
  ARCHITECTURE.md
  superpowers/
    specs/
      2026-03-30-pos-mvp-design.md
```

## Runtime Boundaries

### Frontend

`AuthContext` menyimpan user aktif dan JWT token di local storage, lalu memulihkan sesi lewat `/api/auth/me`.

`PosDataContext` adalah client state tunggal untuk bootstrap data operasional. Semua create/update action memanggil API lalu mengganti state dari snapshot backend terbaru.

Pages dibagi per domain:

- `CheckoutPage`: transaksi aktif
- `SalesPage` dan `ReceiptPage`: histori, detail, print
- `CatalogPage`: product dan variant CRUD
- `InventoryPage`: adjustment/restock
- `PromotionsPage`: promo setup
- `UsersPage`: admin-only account control
- `SettingsPage` dan `ReportsPage`: konfigurasi dan ringkasan operasional

### Backend

`server/index.js` mendefinisikan REST API dan role guards.

`server/auth.js` membuat dan memverifikasi JWT HMAC tanpa dependency tambahan.

`server/db.js` memegang query Postgres, transaksi, dan seluruh operasi write:

- auth lookup
- sale finalization
- inventory adjustment
- settings update
- user CRUD
- product CRUD
- variant CRUD

`server/mappers.js` menjaga shape payload bootstrap tetap stabil saat data hasil query Postgres dipetakan ke bentuk yang dipakai frontend.

## Current API Surface

```text
POST   /api/auth/login
GET    /api/auth/me
GET    /api/bootstrap
POST   /api/sales
POST   /api/inventory/movements
POST   /api/promotions
PUT    /api/settings
POST   /api/users
PATCH  /api/users/:id
POST   /api/products
PATCH  /api/products/:id
POST   /api/products/:id/variants
PATCH  /api/variants/:id
```

## Development

```text
npm install
npm test
npm run dev
npm run build
```
