# POS Platform Architecture

## Goal

Repository ini sekarang berisi platform POS MVP untuk retail fashion dengan model `workspace` yang mendukung `Main Store` dan `Event` bazaar sementara, dengan backend yang disiapkan untuk jalan di atas Supabase Postgres.

Fokus current scope:

- login berbasis JWT lokal
- workspace resolution setelah login
- role-based routing untuk `admin`, `manager`, dan `cashier`
- checkout dan sales history yang menulis ke database
- catalog CRUD untuk product dan variant
- inventory movement yang auditable
- event lifecycle `draft -> active -> closed -> archived`
- event closing review untuk sales, stock, dan payment reconciliation
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
    WorkspaceContext.jsx
  features/
    catalog/
      catalogHelpers.js
    events/
      eventHelpers.js
    sales/
      salesHelpers.js
    workspaces/
      workspaceGuards.js
  pages/
    LoginPage.jsx
    DashboardPage.jsx
    CheckoutPage.jsx
    EventClosingPage.jsx
    EventDetailPage.jsx
    EventsPage.jsx
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

`WorkspaceContext` menyimpan `activeWorkspaceId`, mengarahkan user ke workspace picker setelah login bila perlu, dan memastikan shell selalu berjalan dalam konteks operasional yang jelas.

`PosDataContext` adalah client state tunggal untuk bootstrap data operasional. Semua create/update action memanggil API lalu mengganti state dari snapshot backend terbaru yang sudah discope oleh `workspaceId` aktif.

Pages dibagi per domain:

- `CheckoutPage`: transaksi aktif
- `SalesPage` dan `ReceiptPage`: histori, detail, print
- `EventsPage`, `EventDetailPage`, `EventClosingPage`: create event, lifecycle, dan closing review
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
- workspace-aware bootstrap
- sale finalization
- inventory adjustment
- event create/status/close
- settings update
- user CRUD
- product CRUD
- variant CRUD

`server/mappers.js` menjaga shape payload bootstrap tetap stabil saat data hasil query Postgres dipetakan ke bentuk yang dipakai frontend.

## Workspace Model

- `Store` workspace mewakili lokasi jual permanen.
- `Event` workspace mewakili bazaar atau pop-up yang punya stok, transaksi, dan report sendiri.
- Setelah login, user masuk ke `workspace picker` jika dia punya lebih dari satu workspace aktif yang boleh diakses.
- `cashier` diarahkan ke checkout, `manager` dan `admin` ke dashboard.
- Bootstrap, inventory movement, reports, dan checkout semuanya membaca `activeWorkspaceId`.

### Event Lifecycle

- `draft`: event disiapkan, tim dan stock mode ditentukan
- `active`: transaksi dan stok event berjalan
- `closed`: event selesai jualan dan sudah lewat closing review
- `archived`: histori read-only

### Stock Scope

- Workspace `store` memakai `product_variants.quantity_on_hand`
- Workspace `event` memakai `workspace_variant_stocks.quantity_on_hand`
- Event dengan stock mode `allocate` akan mengurangi stok pusat saat stok event ditambahkan
- Event checkout tidak lagi mengurangi stok pusat secara langsung; penjualan mengurangi stok event workspace

## Current API Surface

```text
POST   /api/auth/login
GET    /api/auth/me
GET    /api/bootstrap
POST   /api/events
PATCH  /api/events/:id/status
POST   /api/events/:id/close
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
