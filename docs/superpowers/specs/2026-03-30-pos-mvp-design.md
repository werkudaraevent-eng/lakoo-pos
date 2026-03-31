# POS MVP Design

Date: 2026-03-30
Project: Single-store fashion retail POS
Status: Draft reviewed with user

## 1. Objective

Build a web-based POS platform for a single-store fashion retail business, intended for desktop and tablet usage in an always-online environment.

The MVP covers:
- JWT-based authentication
- Role-based access for `admin`, `manager`, and `cashier`
- Product catalog with size/color variants
- Inventory tracking and manual stock adjustment/restock
- Sales checkout with promo/coupon support
- Dashboard and reporting for sales and stock visibility

The MVP explicitly excludes:
- Multi-store support
- Offline-first behavior
- Returns/refunds
- Supplier management
- Purchase orders
- Manual cashier discount overrides
- Split payments

## 2. Product Scope

### In Scope

#### Authentication
- User login using JWT-based authentication
- Active/inactive user status
- Role-based authorization

#### Catalog
- Product master data
- Categories such as shirts, pants, dresses
- Product variants by size and color
- SKU per variant
- Active/inactive product and variant state

#### Inventory
- Quantity tracking per product variant
- Manual restock by `admin` and `manager`
- Manual stock adjustment by `admin` and `manager`
- Low-stock threshold per variant
- Inventory movement history

#### Sales
- Add items to cart by product variant
- Search by product or SKU
- Validate stock before checkout finalization
- Apply promo/coupon created by `admin` or `manager`
- Single payment method per transaction: `cash` or `card`
- Receipt generation
- Finalized sales only, no post-edit flow in MVP

#### Dashboard and Reporting
- Daily, weekly, and monthly sales trends
- Top-selling items
- Low-stock alerts
- Revenue breakdown

#### Settings
- Store profile
- Enabled payment methods
- Foundation for future tax/service charge settings

### Out of Scope
- Multi-store inventory and reporting
- Returns/refunds
- Supplier and procurement workflows
- Purchase order lifecycle
- Partial/split payment
- Manual price override at checkout
- Manual discount entry by cashier

## 3. Recommended Architecture

Use a modular monolith architecture.

This means one web application and one database, with clear separation of domain modules inside the application:
- `auth`
- `catalog`
- `inventory`
- `sales`
- `promotions`
- `reporting`
- `settings`

### Why Modular Monolith

- Fast enough for MVP delivery
- Lower operational complexity than microservices
- Easier to maintain clean boundaries than a loose single-module application
- Suitable for single-store scope while leaving room for future expansion

## 4. Domain Boundaries

### Auth
- Handles login, JWT issuance, authorization checks, and user activation state

### Catalog
- Owns product definitions, categories, variants, SKU, and sellable metadata

### Inventory
- Owns stock quantity, low-stock threshold, and inventory movement history
- Inventory changes must be auditable

### Sales
- Owns cart, checkout, finalized transaction records, and receipt generation
- Uses snapshot pricing and item metadata at transaction time

### Promotions
- Owns promo/coupon definitions and eligibility rules
- Validates promos during checkout

### Reporting
- Reads finalized sales and inventory data to produce dashboard metrics
- Does not own source-of-truth transactional data

### Settings
- Owns store-level configuration and operational defaults

## 5. Roles and Permissions

### Admin
- Full system access
- Manage users and roles
- Manage settings
- Manage catalog and inventory
- Create and manage promotions
- View dashboard and sales history

### Manager
- Manage catalog and inventory
- Create and manage promotions
- View dashboard and sales history
- Perform operational stock corrections
- Cannot manage users
- Cannot change sensitive auth/system configuration

### Cashier
- Log in and access POS checkout
- Search products and variants
- Create transactions
- Apply valid promo/coupon codes
- Print/view receipts
- Limited visibility to relevant sales records if needed
- Cannot edit catalog, stock, promotions, users, or settings
- Cannot override prices or enter manual discounts

## 6. Core Data Model

### `users`
- `id`
- `name`
- `username_or_email`
- `password_hash`
- `role`
- `is_active`
- `created_at`

### `categories`
- `id`
- `name`
- `slug`

### `products`
- `id`
- `name`
- `category_id`
- `description`
- `base_price`
- `is_active`
- `created_at`

### `product_variants`
- `id`
- `product_id`
- `sku`
- `size`
- `color`
- `price_override` nullable
- `quantity_on_hand`
- `low_stock_threshold`
- `is_active`
- `created_at`

### `inventory_movements`
- `id`
- `variant_id`
- `type` with values `restock`, `adjustment`, `sale`
- `qty_delta`
- `note`
- `actor_user_id`
- `reference_id` nullable
- `created_at`

### `promotions`
- `id`
- `code`
- `type` with values `percentage`, `fixed`
- `value`
- `start_at`
- `end_at`
- `min_purchase` nullable
- `is_active`
- `created_by`
- `created_at`

### `sales`
- `id`
- `receipt_number`
- `cashier_user_id`
- `subtotal`
- `discount_total`
- `grand_total`
- `payment_method`
- `paid_amount`
- `created_at`

### `sale_items`
- `id`
- `sale_id`
- `variant_id`
- `product_name_snapshot`
- `sku_snapshot`
- `size_snapshot`
- `color_snapshot`
- `unit_price_snapshot`
- `qty`
- `line_total`

### `sale_promotion_usages`
- `id`
- `sale_id`
- `promotion_id`
- `code_snapshot`
- `discount_amount`

## 7. Key Data Rules

- Product size and color belong at the variant level, not at the base product level
- `quantity_on_hand` is stored on `product_variants` for fast reads
- Every stock-affecting event must also create an `inventory_movements` record
- Every completed sale must store snapshot item data so historical receipts and reports remain stable
- SKU must be unique per variant
- Sales records are immutable in MVP after finalization

## 8. Sales Flow

1. Cashier logs in
2. Cashier searches product or scans/enters SKU
3. Cashier adds specific product variants to cart
4. System checks variant availability
5. Cashier enters promo/coupon code
6. System validates promo status, date range, and eligibility rules
7. System calculates subtotal, discount total, and grand total
8. Cashier selects one payment method: `cash` or `card`
9. System finalizes the sale
10. System reduces variant stock
11. System writes inventory movement entries of type `sale`
12. System generates receipt number and receipt output

### Sales Constraints
- Cashier cannot manually override price
- Cashier cannot apply manual discounts
- Promo/coupon must be created by `admin` or `manager`
- Transaction becomes final once saved

## 9. Inventory Flow

1. `admin` or `manager` opens inventory management
2. User selects a variant
3. User performs either `restock` or `adjustment`
4. User enters quantity change and a note
5. System updates `quantity_on_hand`
6. System writes an `inventory_movements` record with actor and timestamp
7. Low-stock alerts are recalculated from current stock and threshold

### Inventory Constraints
- Sales-triggered stock reduction must happen transactionally with sale finalization
- Manual adjustments must include a note
- Inventory cannot go below zero during sale finalization

## 10. Dashboard and Reporting

### Dashboard Metrics
- Sales trend by day
- Sales trend by week
- Sales trend by month
- Top-selling items by quantity sold
- Low-stock variants
- Revenue breakdown by payment method
- Revenue breakdown by category
- Discount usage totals

### Reporting Rules
- Only finalized sales are included
- Failed or abandoned checkouts are excluded
- Because returns are out of scope for MVP, dashboard revenue is based on finalized sales only
- Historical reporting must read snapshot sales data rather than current product state

## 11. Error Handling

### Authentication
- Invalid login returns a generic failure message
- Inactive users cannot authenticate

### Authorization
- Unauthorized actions return permission errors based on role

### Catalog and Inventory
- Duplicate SKU must be rejected
- Inactive products or variants cannot be sold
- Out-of-stock variants cannot be finalized in checkout

### Promotions
- Expired, inactive, or ineligible promo/coupon must return clear validation errors

### Sales Concurrency
- Final checkout must run inside a database transaction
- Stock validation must happen again during finalization, not only when adding to cart
- Concurrent checkouts for low-stock items must not result in negative stock

## 12. Testing Strategy

### Unit Tests
- Promo validation rules
- Role-based permission checks
- Sales totals and discount calculations
- Inventory movement calculation rules

### Integration Tests
- Login flow
- Product and variant retrieval for checkout
- Valid promo application
- Invalid promo rejection
- Sale finalization
- Stock reduction after finalized sale
- Manual restock and adjustment flows

### Reporting Tests
- Sales aggregation for daily, weekly, and monthly views
- Top-selling item calculations
- Low-stock alert calculations

### Permission Tests
- `cashier` cannot access admin/manager endpoints
- `manager` cannot manage users or sensitive system settings

### Concurrency Tests
- Two parallel checkouts against the same low-stock variant do not oversell

## 13. Delivery Order

Recommended build order:

1. `auth`
2. `catalog`
3. `inventory`
4. `promotions`
5. `sales`
6. `reporting`
7. `settings`

Reasoning:
- Checkout depends on stable auth, catalog, inventory, and promotions
- Reporting should be built on top of finalized operational flows, not before them

## 14. Future Extensions

These are intentionally not part of MVP, but the design should avoid blocking them:
- Returns/refunds
- Supplier management
- Purchase orders
- Multi-store support
- Barcode scanner workflow
- Customer/member profiles
- Cash drawer and shift management
- Audit log beyond inventory movement history
