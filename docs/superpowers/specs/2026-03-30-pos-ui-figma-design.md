# POS UI Figma Design Spec

**Date:** 2026-03-30
**Scope:** UI direction, design system, and Figma page hierarchy for the POS platform
**Primary screens:** Login, Checkout
**Visual direction:** Balanced editorial
**Target devices:** Responsive penuh (desktop, tablet, mobile)

## Goal

Membentuk fondasi UIUX yang terasa retail-editorial untuk bisnis fashion, tetapi tetap cepat dipakai untuk workflow POS harian. Figma akan dipakai sebagai alat penyusunan design system, screen hierarchy, dan high-fidelity screens yang kemudian diturunkan kembali ke code.

## Product Intent

Produk ini bukan website marketing dan bukan admin panel generik. Ini adalah aplikasi operasional toko fashion yang harus:

- cepat dipakai kasir saat transaksi
- jelas untuk manager saat memantau stok dan penjualan
- tetap terasa premium dan relevan dengan kategori retail fashion

UI harus membuat operator merasa memakai tool kerja yang rapi dan premium, bukan dashboard enterprise yang dingin.

## Design Direction

### Chosen Direction: Balanced Editorial

Karakter visual:

- retail-forward, bukan SaaS generik
- warm dan polished, bukan dark-tech
- hierarchy visual kuat untuk headline, status, dan CTA
- data tetap mudah dibaca dalam konteks operasional

Hal yang harus dihindari:

- layout terlalu padat sampai terasa sempit
- terlalu banyak card dengan bobot visual sama
- dashboard enterprise yang kaku
- dekorasi editorial berlebihan yang memperlambat checkout

## Foundations

### Color Roles

- `Ink`: teks utama dan navigasi gelap
- `Paper`: panel utama terang
- `Sand`: background hangat netral
- `Copper`: accent utama untuk CTA dan active state
- `Moss`: success / stock aman
- `Amber`: warning / low stock
- `Brick`: danger / destructive

Prinsip:

- layar kerja utama tetap terang
- area navigasi atau anchor tetap gelap
- warna status harus semantik, bukan dekoratif
- accent hanya dipakai untuk aksi utama dan selection state

### Typography

- `Display serif`: headline utama, screen title, hero statement
- `Utility sans`: form, label, angka, data, nav, button

Prinsip:

- serif untuk rasa brand/editorial
- sans untuk kecepatan baca operasional
- angka transaksi harus selalu memakai sans yang bersih

### Spacing and Shape

- radius lunak dan besar untuk panel utama
- spacing lega di login dan dashboard
- spacing lebih ketat tapi tetap terstruktur di checkout
- shadow lembut untuk memberi layer, bukan efek glamor berlebihan

### Grid

- `Desktop`: 12 kolom
- `Tablet`: 8 kolom
- `Mobile`: 4 kolom

## Component System

### Core Components

- App Shell
- Sidebar / Navigation Rail
- Top Bar
- Page Header
- Metric Card
- Product Card
- Status Pill
- Search Field
- Form Field
- Segmented Toggle
- Cart Item Row
- Summary Box
- Table Row
- Receipt Block
- Action Button set

### Component Rules

- semua komponen harus punya state `default`, `hover`, `focus`, `active`, `disabled`
- form field harus jelas antara state kosong, aktif, error
- pills tidak boleh hanya beda warna; perlu hierarchy label yang jelas
- metric cards harus dibedakan dari operational list cards

## Screen Hierarchy for Figma

### Page 00: Foundations

- color tokens
- typography scale
- spacing scale
- radius
- shadows
- icon sizing
- responsive grid reference

### Page 01: Components

- buttons
- inputs
- nav items
- pills
- cards
- list rows
- cart rows
- receipt rows

### Page 02: Patterns

- app shell patterns
- filter/search patterns
- summary panels
- checkout split layout
- mobile bottom action pattern

### Page 10: Login

- desktop high fidelity
- tablet adaptation
- mobile adaptation
- alt states: idle, error, loading

### Page 11: Checkout

- desktop high fidelity
- tablet high fidelity
- mobile high fidelity
- empty cart, filled cart, promo active, latest receipt

### Page 12: Dashboard

- desktop
- tablet
- mobile

### Page 13: Backoffice

- catalog
- inventory
- sales
- users
- settings

## Login Screen Spec

### Purpose

Memberi first impression premium dan membuat proses masuk cepat, jelas, dan minim friction.

### Desktop Layout

- kiri: editorial brand panel
- kanan: auth card fokus tunggal
- akun demo ditampilkan sebagai quick-select cards

### Tablet Layout

- stack vertikal
- hero panel tetap muncul tetapi dipersingkat
- auth card tetap dominan

### Mobile Layout

- brand statement lebih ringkas
- quick-select cards menjadi horizontal stack atau compact list
- form selalu muncul tanpa scroll berlebihan

### Visual Priorities

- heading besar dan tegas
- kontras tinggi antara hero gelap dan card terang
- CTA login sangat jelas
- loading state harus terasa responsif, bukan freeze

## Checkout Screen Spec

### Purpose

Menjadi layar kerja tercepat dalam sistem. Operator harus bisa mencari item, menambah ke cart, melihat total, dan finalize sale tanpa kebingungan visual.

### Desktop Layout

- kiri besar: product discovery
- kanan tetap: cart summary, promo, payment, total, finalize action
- receipt terakhir muncul di bawah sebagai confirmation panel

### Tablet Layout

- discovery tetap di area atas
- cart summary menjadi section terpisah namun masih terlihat dalam satu viewport logis
- tombol finalize tetap mudah dijangkau

### Mobile Layout

- search di atas
- product list satu kolom
- cart/summary jadi sticky bottom sheet atau blok bawah yang jelas
- total dan finalize harus selalu dekat dengan jempol

### Checkout UX Rules

- search harus jadi elemen pertama yang menarik perhatian
- stok rendah harus terlihat cepat tetapi tidak menutupi nama produk
- cart row harus mudah diedit
- grand total selalu punya hierarchy tertinggi di summary
- finalize action harus tunggal dan tidak bersaing dengan secondary actions

## Dashboard Direction

Dashboard adalah secondary anchor setelah login dan checkout.

Prinsip:

- jangan terlalu banyak kartu dengan ukuran sama
- tampilkan 3-4 signal utama terlebih dahulu
- list detail ada di bawah, bukan bersaing dengan KPI utama
- gunakan hierarchy editorial untuk heading, tapi data tetap utilitarian

## Responsive Behavior

- tidak ada halaman yang hanya “diperkecil”
- setiap breakpoint harus memikirkan ulang prioritas konten
- checkout dan login wajib punya desain native untuk mobile, bukan sekadar wrap layout

## Figma Execution Order

1. Foundations
2. Components
3. Login desktop, tablet, mobile
4. Checkout desktop
5. Checkout tablet
6. Checkout mobile
7. Dashboard alignment
8. Turunkan pola ke halaman lain

## Approval Gate Before Figma

Sebelum menulis ke Figma, yang harus dianggap terkunci:

- visual direction: balanced editorial
- primary quality anchor: login + checkout
- responsive target: desktop, tablet, mobile
- Figma page hierarchy
- execution order

Jika kelima hal ini sudah disetujui, langkah berikutnya adalah membuat struktur file Figma dan memindahkan screen pertama ke canvas.
