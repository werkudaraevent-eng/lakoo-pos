import crypto from "node:crypto";

import postgres from "postgres";

import {
  filterRowsByWorkspace,
  mapProducts,
  mapPromotions,
  mapSales,
  mapSettingsRows,
  mapUsers,
  mapWorkspaceRows,
  overlayProductsWithWorkspaceStock,
} from "./mappers.js";

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "";
const sql = databaseUrl
  ? postgres(databaseUrl, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

function ensureSql() {
  if (!sql) {
    throw new Error("SUPABASE_DB_URL atau DATABASE_URL belum di-set.");
  }

  return sql;
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

const EVENT_TRANSITIONS = {
  draft: new Set(["active", "archived"]),
  active: new Set(["closed"]),
  closed: new Set(["archived"]),
  archived: new Set(),
};

function canTransitionEventRecord(currentStatus, nextStatus) {
  return EVENT_TRANSITIONS[currentStatus]?.has(nextStatus) ?? false;
}

function canCompleteClosingReviewRecord(payload) {
  return Boolean(payload?.salesReviewed && payload?.stockReviewed && payload?.paymentReviewed);
}

async function ensureCategory(executor, name) {
  const slug = slugify(name);
  const existing = await executor`
    SELECT id, name, slug
    FROM categories
    WHERE slug = ${slug}
    LIMIT 1
  `;

  if (existing[0]) {
    return existing[0];
  }

  const category = {
    id: createId("cat"),
    name,
    slug,
  };

  await executor`
    INSERT INTO categories (id, name, slug)
    VALUES (${category.id}, ${category.name}, ${category.slug})
  `;

  return category;
}

async function fetchSettings(executor) {
  const rows = await executor`
    SELECT key, value
    FROM settings
    ORDER BY key ASC
  `;

  return mapSettingsRows(rows);
}

async function fetchCategories(executor) {
  return executor`
    SELECT id, name, slug
    FROM categories
    ORDER BY name ASC
  `;
}

async function fetchUsers(executor) {
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", created_at AS "createdAt"
    FROM users
    ORDER BY created_at DESC
  `;

  return mapUsers(rows);
}

async function fetchProducts(executor) {
  const rows = await executor`
    SELECT
      p.id,
      p.name,
      c.name AS category,
      p.description,
      p.base_price AS "basePrice",
      p.is_active AS "isActive",
      p.created_at AS "createdAt",
      pv.id AS "variantId",
      pv.sku,
      pv.size,
      pv.color,
      pv.price_override AS "priceOverride",
      pv.quantity_on_hand AS "quantityOnHand",
      pv.low_stock_threshold AS "lowStockThreshold",
      pv.is_active AS "variantIsActive",
      pv.created_at AS "variantCreatedAt"
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    ORDER BY p.created_at DESC, p.name ASC, pv.created_at ASC, pv.sku ASC
  `;

  return mapProducts(rows);
}

async function fetchWorkspaceVariantStocks(executor, workspaceId) {
  if (!workspaceId) {
    return [];
  }

  return executor`
    SELECT
      variant_id AS "variantId",
      quantity_on_hand AS "quantityOnHand",
      source_mode AS "sourceMode",
      allocated_from_main AS "allocatedFromMain"
    FROM workspace_variant_stocks
    WHERE workspace_id = ${workspaceId}
    ORDER BY created_at ASC, variant_id ASC
  `;
}

async function fetchPromotions(executor) {
  const rows = await executor`
    SELECT
      p.id,
      p.code,
      p.type,
      p.value,
      p.start_at AS "startAt",
      p.end_at AS "endAt",
      p.min_purchase AS "minPurchase",
      p.is_active AS "isActive",
      u.name AS "createdBy",
      p.created_at AS "createdAt"
    FROM promotions p
    JOIN users u ON u.id = p.created_by
    ORDER BY p.created_at DESC
  `;

  return mapPromotions(rows);
}

async function fetchWorkspaces(executor) {
  const rows = await executor`
    SELECT
      w.id,
      w.type,
      w.name,
      w.status,
      w.stock_mode AS "stockMode",
      w.is_visible AS "isVisible",
      w.location_label AS "locationLabel",
      w.starts_at AS "startsAt",
      w.ends_at AS "endsAt",
      wa.user_id AS "assignedUserId"
    FROM workspaces w
    LEFT JOIN workspace_assignments wa ON wa.workspace_id = w.id
    ORDER BY w.type ASC, w.created_at DESC, wa.assigned_at ASC
  `;

  return mapWorkspaceRows(rows);
}

async function fetchSales(executor, { workspaceId, fallbackWorkspaceId }) {
  const salesRows = await executor`
    SELECT
      s.id,
      s.workspace_id AS "workspaceId",
      s.receipt_number AS "receiptNumber",
      s.cashier_user_id AS "cashierUserId",
      u.name AS "cashierUser",
      s.subtotal,
      s.discount_total AS "discountTotal",
      s.grand_total AS "grandTotal",
      s.payment_method AS "paymentMethod",
      s.paid_amount AS "paidAmount",
      s.created_at AS "createdAt"
    FROM sales s
    JOIN users u ON u.id = s.cashier_user_id
    ORDER BY s.created_at DESC
  `;
  const filteredSales = filterRowsByWorkspace(salesRows, { workspaceId, fallbackWorkspaceId });
  const saleIds = new Set(filteredSales.map((sale) => sale.id));
  const items = (await executor`
    SELECT
      id,
      sale_id AS "saleId",
      variant_id AS "variantId",
      product_name_snapshot AS "productNameSnapshot",
      sku_snapshot AS "skuSnapshot",
      size_snapshot AS "sizeSnapshot",
      color_snapshot AS "colorSnapshot",
      unit_price_snapshot AS "unitPriceSnapshot",
      qty,
      line_total AS "lineTotal"
    FROM sale_items
    ORDER BY id ASC
  `).filter((item) => saleIds.has(item.saleId));
  const promotions = (await executor`
    SELECT
      sale_id AS "saleId",
      promotion_id AS "promotionId",
      code_snapshot AS "codeSnapshot",
      discount_amount AS "discountAmount"
    FROM sale_promotion_usages
  `).filter((promotion) => saleIds.has(promotion.saleId));

  return mapSales(filteredSales, items, promotions);
}

async function fetchInventoryMovements(executor, { workspaceId, fallbackWorkspaceId }) {
  const rows = await executor`
    SELECT
      m.id,
      m.workspace_id AS "workspaceId",
      m.variant_id AS "variantId",
      pv.sku,
      p.name AS "productName",
      pv.size,
      pv.color,
      m.type,
      m.qty_delta AS "qtyDelta",
      m.note,
      u.name AS "actorUser",
      m.reference_id AS "referenceId",
      m.created_at AS "createdAt"
    FROM inventory_movements m
    JOIN product_variants pv ON pv.id = m.variant_id
    JOIN products p ON p.id = pv.product_id
    JOIN users u ON u.id = m.actor_user_id
    ORDER BY m.created_at DESC
  `;

  return filterRowsByWorkspace(rows, { workspaceId, fallbackWorkspaceId });
}

async function resolveWriteWorkspaceId(executor, workspaceId) {
  if (workspaceId) {
    return workspaceId;
  }

  const rows = await executor`
    SELECT id
    FROM workspaces
    WHERE type = ${"store"}
    ORDER BY created_at ASC
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

async function resolveWriteWorkspace(executor, workspaceId) {
  const resolvedWorkspaceId = await resolveWriteWorkspaceId(executor, workspaceId);

  if (!resolvedWorkspaceId) {
    return null;
  }

  const rows = await executor`
    SELECT
      id,
      type,
      status,
      stock_mode AS "stockMode"
    FROM workspaces
    WHERE id = ${resolvedWorkspaceId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function consumeMainStockForEvent(tx, workspace, variantId, amount) {
  const rows = await tx`
    SELECT id, quantity_on_hand AS "quantityOnHand"
    FROM product_variants
    WHERE id = ${variantId}
    FOR UPDATE
  `;
  const variant = rows[0];

  if (!variant) {
    throw new Error("Variant event tidak ditemukan.");
  }

  if (workspace.stockMode === "allocate" && variant.quantityOnHand < amount) {
    throw new Error("Stock pusat tidak cukup untuk alokasi event.");
  }

  if (workspace.stockMode === "allocate") {
    await tx`
      UPDATE product_variants
      SET quantity_on_hand = quantity_on_hand - ${amount}
      WHERE id = ${variantId}
    `;
  }
}

export async function initializeDatabase() {
  const executor = ensureSql();
  await executor`SELECT 1`;
}

export async function getBootstrap({ workspaceId } = {}) {
  const executor = ensureSql();
  const settings = await fetchSettings(executor);
  const categories = await fetchCategories(executor);
  const users = await fetchUsers(executor);
  const workspaces = await fetchWorkspaces(executor);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === (workspaceId || null)) ?? null;
  const baseProducts = await fetchProducts(executor);
  const products =
    activeWorkspace?.type === "event"
      ? overlayProductsWithWorkspaceStock(
          baseProducts,
          await fetchWorkspaceVariantStocks(executor, activeWorkspace.id)
        )
      : baseProducts;
  const promotions = await fetchPromotions(executor);
  const fallbackWorkspaceId = workspaces.find((workspace) => workspace.type === "store")?.id ?? null;
  const scope = {
    workspaceId: workspaceId || null,
    fallbackWorkspaceId,
  };
  const sales = await fetchSales(executor, scope);
  const inventoryMovements = await fetchInventoryMovements(executor, scope);

  return {
    settings,
    categories,
    users,
    products,
    promotions,
    workspaces,
    sales,
    inventoryMovements,
  };
}

export async function authenticateUser(username, password) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", password_hash AS "passwordHash"
    FROM users
    WHERE lower(username) = lower(${username})
    LIMIT 1
  `;
  const user = rows[0];

  if (!user || !user.isActive || user.passwordHash !== hashPassword(password)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}

export async function getUserById(userId) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive"
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows[0] || null;
}

export async function createEventRecord(payload) {
  const executor = ensureSql();
  const name = String(payload?.name || "").trim();
  const code = String(payload?.code || "").trim().toUpperCase();
  const locationLabel = String(payload?.locationLabel || "").trim();
  const startsAt = payload?.startsAt ? new Date(payload.startsAt) : null;
  const endsAt = payload?.endsAt ? new Date(payload.endsAt) : null;
  const stockMode = payload?.stockMode;
  const assignedUserIds = [...new Set((payload?.assignedUserIds || []).filter(Boolean))];

  if (!name || !code || !locationLabel || !startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false, message: "Data event belum lengkap." };
  }

  if (endsAt <= startsAt) {
    return { ok: false, message: "Tanggal selesai event harus setelah tanggal mulai." };
  }

  if (!["allocate", "manual"].includes(stockMode)) {
    return { ok: false, message: "Mode stock event tidak valid." };
  }

  try {
    const eventId = createId("workspace");

    await executor.begin(async (tx) => {
      await tx`
        INSERT INTO workspaces
        (id, type, name, code, status, stock_mode, location_label, starts_at, ends_at, is_visible, created_at)
        VALUES (
          ${eventId},
          ${"event"},
          ${name},
          ${code},
          ${"draft"},
          ${stockMode},
          ${locationLabel},
          ${startsAt.toISOString()},
          ${endsAt.toISOString()},
          ${true},
          ${nowIso()}
        )
      `;

      for (const userId of assignedUserIds) {
        await tx`
          INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
          VALUES (${createId("wa")}, ${eventId}, ${userId}, ${nowIso()})
        `;
      }
    });

    return { ok: true, eventId };
  } catch (error) {
    if (error?.code === "23505") {
      return { ok: false, message: "Kode event sudah dipakai." };
    }

    return { ok: false, message: error.message };
  }
}

export async function updateEventStatusRecord(eventId, payload) {
  const executor = ensureSql();
  const nextStatus = String(payload?.nextStatus || "").trim().toLowerCase();

  if (!nextStatus) {
    return { ok: false, message: "Status event tujuan wajib dipilih." };
  }

  if (nextStatus === "closed") {
    return { ok: false, message: "Gunakan closing flow untuk menutup event." };
  }

  const rows = await executor`
    SELECT id, type, status
    FROM workspaces
    WHERE id = ${eventId}
    LIMIT 1
  `;
  const event = rows[0];

  if (!event || event.type !== "event") {
    return { ok: false, message: "Event tidak ditemukan." };
  }

  if (!canTransitionEventRecord(event.status, nextStatus)) {
    return { ok: false, message: "Transisi status event tidak valid." };
  }

  const closedAt = nextStatus === "closed" ? nowIso() : null;
  const archivedAt = nextStatus === "archived" ? nowIso() : null;

  await executor`
    UPDATE workspaces
    SET
      status = ${nextStatus},
      closed_at = CASE
        WHEN ${closedAt}::timestamptz IS NOT NULL THEN ${closedAt}
        ELSE closed_at
      END,
      archived_at = CASE
        WHEN ${archivedAt}::timestamptz IS NOT NULL THEN ${archivedAt}
        ELSE archived_at
      END
    WHERE id = ${eventId}
  `;

  return { ok: true, eventId, nextStatus };
}

export async function closeEventRecord(eventId, payload) {
  const executor = ensureSql();

  if (!canCompleteClosingReviewRecord(payload)) {
    return { ok: false, message: "Review penutupan event belum lengkap." };
  }

  const rows = await executor`
    SELECT id, type, status
    FROM workspaces
    WHERE id = ${eventId}
    LIMIT 1
  `;
  const event = rows[0];

  if (!event || event.type !== "event") {
    return { ok: false, message: "Event tidak ditemukan." };
  }

  if (event.status !== "active") {
    return { ok: false, message: "Hanya event aktif yang bisa ditutup." };
  }

  await executor`
    UPDATE workspaces
    SET
      status = ${"closed"},
      closed_at = ${nowIso()}
    WHERE id = ${eventId}
  `;

  return { ok: true, eventId };
}

export async function createPromotionRecord(payload, actorUserId) {
  const executor = ensureSql();

  await executor`
    INSERT INTO promotions
    (id, code, type, value, start_at, end_at, min_purchase, is_active, created_by, created_at)
    VALUES (
      ${createId("promo")},
      ${payload.code.toUpperCase()},
      ${payload.type},
      ${Number(payload.value)},
      ${new Date(payload.startAt).toISOString()},
      ${new Date(payload.endAt).toISOString()},
      ${Number(payload.minPurchase || 0)},
      ${true},
      ${actorUserId},
      ${nowIso()}
    )
  `;
}

export async function adjustInventoryRecord(payload, actorUserId) {
  const executor = ensureSql();
  const amount = Number(payload.quantity);
  const workspace = await resolveWriteWorkspace(executor, payload.workspaceId || null);

  if (amount < 1 || !workspace) {
    return { ok: false, message: "Inventory request tidak valid." };
  }

  if (workspace.type === "event" && !["draft", "active"].includes(workspace.status)) {
    return { ok: false, message: "Event ini tidak bisa diubah stock-nya." };
  }

  try {
    await executor.begin(async (tx) => {
      const delta = payload.mode === "restock" ? amount : amount * -1;
      if (workspace.type === "event") {
        const workspaceStockRows = await tx`
          SELECT id, quantity_on_hand AS "quantityOnHand", allocated_from_main AS "allocatedFromMain"
          FROM workspace_variant_stocks
          WHERE workspace_id = ${workspace.id} AND variant_id = ${payload.variantId}
          FOR UPDATE
        `;
        const workspaceStock = workspaceStockRows[0];

        if (!workspaceStock) {
          if (delta < 0) {
            throw new Error("Stock event belum tersedia untuk variant ini.");
          }

          await consumeMainStockForEvent(tx, workspace, payload.variantId, delta);

          await tx`
            INSERT INTO workspace_variant_stocks
            (id, workspace_id, variant_id, quantity_on_hand, source_mode, allocated_from_main, created_at, updated_at)
            VALUES (
              ${createId("wvs")},
              ${workspace.id},
              ${payload.variantId},
              ${delta},
              ${workspace.stockMode || "manual"},
              ${workspace.stockMode === "allocate" ? delta : 0},
              ${nowIso()},
              ${nowIso()}
            )
          `;
        } else {
          const nextQty = workspaceStock.quantityOnHand + delta;

          if (nextQty < 0) {
            throw new Error("Stock tidak boleh kurang dari 0.");
          }

          if (delta > 0) {
            await consumeMainStockForEvent(tx, workspace, payload.variantId, delta);
          }

          await tx`
            UPDATE workspace_variant_stocks
            SET
              quantity_on_hand = ${nextQty},
              allocated_from_main = CASE
                WHEN ${workspace.stockMode === "allocate" && delta > 0}
                  THEN allocated_from_main + ${delta}
                ELSE allocated_from_main
              END,
              updated_at = ${nowIso()}
            WHERE id = ${workspaceStock.id}
          `;
        }
      } else {
        const rows = await tx`
          SELECT id, quantity_on_hand AS "quantityOnHand"
          FROM product_variants
          WHERE id = ${payload.variantId}
          FOR UPDATE
        `;
        const variant = rows[0];

        if (!variant) {
          throw new Error("Inventory request tidak valid.");
        }

        const nextQty = variant.quantityOnHand + delta;

        if (nextQty < 0) {
          throw new Error("Stock tidak boleh kurang dari 0.");
        }

        await tx`
          UPDATE product_variants
          SET quantity_on_hand = ${nextQty}
          WHERE id = ${payload.variantId}
        `;
      }

      await tx`
        INSERT INTO inventory_movements
        (id, variant_id, workspace_id, type, qty_delta, note, actor_user_id, reference_id, created_at)
        VALUES (
          ${createId("mov")},
          ${payload.variantId},
          ${workspace.id},
          ${payload.mode},
          ${delta},
          ${payload.note},
          ${actorUserId},
          ${null},
          ${nowIso()}
        )
      `;
    });

    return { ok: true, workspaceId: workspace.id };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function finalizeSaleRecord(payload, actorUserId) {
  const executor = ensureSql();
  const cart = payload.cart || [];
  const workspace = await resolveWriteWorkspace(executor, payload.workspaceId || null);

  if (!cart.length || !workspace) {
    return { ok: false, message: "Cart masih kosong." };
  }

  if (workspace.type === "event" && workspace.status !== "active") {
    return { ok: false, message: "Event harus aktif sebelum transaksi dimulai." };
  }

  try {
    const result = await executor.begin(async (tx) => {
      const dbVariants = [];

      for (const item of cart) {
        const rows =
          workspace.type === "event"
            ? await tx`
                SELECT
                  pv.id,
                  pv.sku,
                  pv.size,
                  pv.color,
                  wvs.quantity_on_hand AS "quantityOnHand",
                  pv.price_override AS "priceOverride",
                  p.name AS "productName",
                  p.base_price AS "basePrice"
                FROM workspace_variant_stocks wvs
                JOIN product_variants pv ON pv.id = wvs.variant_id
                JOIN products p ON p.id = pv.product_id
                WHERE wvs.workspace_id = ${workspace.id} AND pv.id = ${item.variantId}
                FOR UPDATE
              `
            : await tx`
                SELECT
                  pv.id,
                  pv.sku,
                  pv.size,
                  pv.color,
                  pv.quantity_on_hand AS "quantityOnHand",
                  pv.price_override AS "priceOverride",
                  p.name AS "productName",
                  p.base_price AS "basePrice"
                FROM product_variants pv
                JOIN products p ON p.id = pv.product_id
                WHERE pv.id = ${item.variantId}
                FOR UPDATE
              `;

        dbVariants.push(rows[0] || null);
      }

      const missing = dbVariants.findIndex((item) => !item);
      if (missing >= 0) {
        throw new Error("Ada item cart yang tidak ditemukan.");
      }

      for (let index = 0; index < cart.length; index += 1) {
        if (dbVariants[index].quantityOnHand < cart[index].qty) {
          throw new Error(
            `Stock ${dbVariants[index].productName} ${dbVariants[index].size}/${dbVariants[index].color} tidak cukup.`
          );
        }
      }

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      let discount = 0;
      let matchedPromo = null;

      if (payload.promoCode) {
        const promoRows = await tx`
          SELECT
            id,
            code,
            type,
            value,
            min_purchase AS "minPurchase",
            start_at AS "startAt",
            end_at AS "endAt",
            is_active AS "isActive"
          FROM promotions
          WHERE code = ${payload.promoCode.toUpperCase()}
          LIMIT 1
        `;
        matchedPromo = promoRows[0] || null;

        if (!matchedPromo || !matchedPromo.isActive) {
          throw new Error("Promo tidak aktif atau tidak ditemukan.");
        }

        const now = new Date();
        if (now < new Date(matchedPromo.startAt) || now > new Date(matchedPromo.endAt)) {
          throw new Error("Promo berada di luar periode aktif.");
        }

        if (subtotal < matchedPromo.minPurchase) {
          throw new Error("Minimum pembelian untuk promo belum terpenuhi.");
        }

        discount =
          matchedPromo.type === "percentage"
            ? Math.round((subtotal * matchedPromo.value) / 100)
            : Math.min(subtotal, matchedPromo.value);
      }

      const saleId = createId("sale");
      const countRows = await tx`SELECT COUNT(*)::int AS count FROM sales`;
      const receiptSeed = countRows[0].count + 1;
      const receiptNumber = `POS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${receiptSeed}`;
      const createdAt = nowIso();

      await tx`
        INSERT INTO sales
        (id, receipt_number, cashier_user_id, workspace_id, subtotal, discount_total, grand_total, payment_method, paid_amount, created_at)
        VALUES (
          ${saleId},
          ${receiptNumber},
          ${actorUserId},
          ${workspace.id},
          ${subtotal},
          ${discount},
          ${subtotal - discount},
          ${payload.paymentMethod},
          ${subtotal - discount},
          ${createdAt}
        )
      `;

      for (let index = 0; index < cart.length; index += 1) {
        const item = cart[index];
        const variant = dbVariants[index];
        const lineTotal = item.price * item.qty;

        await tx`
          INSERT INTO sale_items
          (id, sale_id, variant_id, product_name_snapshot, sku_snapshot, size_snapshot, color_snapshot, unit_price_snapshot, qty, line_total)
          VALUES (
            ${createId("si")},
            ${saleId},
            ${item.variantId},
            ${variant.productName},
            ${variant.sku},
            ${variant.size},
            ${variant.color},
            ${item.price},
            ${item.qty},
            ${lineTotal}
          )
        `;

        if (workspace.type === "event") {
          await tx`
            UPDATE workspace_variant_stocks
            SET
              quantity_on_hand = quantity_on_hand - ${item.qty},
              updated_at = ${createdAt}
            WHERE workspace_id = ${workspace.id} AND variant_id = ${item.variantId}
          `;
        } else {
          await tx`
            UPDATE product_variants
            SET quantity_on_hand = quantity_on_hand - ${item.qty}
            WHERE id = ${item.variantId}
          `;
        }

        await tx`
          INSERT INTO inventory_movements
          (id, variant_id, workspace_id, type, qty_delta, note, actor_user_id, reference_id, created_at)
          VALUES (
            ${createId("mov")},
            ${item.variantId},
            ${workspace.id},
            ${"sale"},
            ${item.qty * -1},
            ${`Sale ${receiptNumber}`},
            ${actorUserId},
            ${saleId},
            ${createdAt}
          )
        `;
      }

      if (matchedPromo) {
        await tx`
          INSERT INTO sale_promotion_usages
          (id, sale_id, promotion_id, code_snapshot, discount_amount)
          VALUES (
            ${createId("spu")},
            ${saleId},
            ${matchedPromo.id},
            ${matchedPromo.code},
            ${discount}
          )
        `;
      }

      return { ok: true, saleId, workspaceId: workspace.id };
    });

    return result;
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function updateSettingsRecord(payload) {
  const executor = ensureSql();
  const entries = [
    ["storeName", payload.storeName],
    ["storeCode", payload.storeCode],
    ["address", payload.address],
    ["paymentMethods", JSON.stringify(payload.paymentMethods || [])],
    ["serviceChargeEnabled", JSON.stringify(Boolean(payload.serviceChargeEnabled))],
  ];

  await executor.begin(async (tx) => {
    for (const [key, value] of entries) {
      await tx`
        INSERT INTO settings (key, value)
        VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
  });
}

export async function createProductRecord(payload) {
  const executor = ensureSql();

  try {
    await executor.begin(async (tx) => {
      const category = await ensureCategory(tx, payload.category);
      const productId = createId("p");
      const createdAt = nowIso();

      await tx`
        INSERT INTO products
        (id, name, category_id, description, base_price, is_active, created_at)
        VALUES (
          ${productId},
          ${payload.name},
          ${category.id},
          ${payload.description},
          ${Number(payload.basePrice)},
          ${Boolean(payload.isActive)},
          ${createdAt}
        )
      `;

      for (const variant of payload.variants || []) {
        await tx`
          INSERT INTO product_variants
          (id, product_id, sku, size, color, price_override, quantity_on_hand, low_stock_threshold, is_active, created_at)
          VALUES (
            ${createId("v")},
            ${productId},
            ${variant.sku},
            ${variant.size},
            ${variant.color},
            ${variant.priceOverride == null ? null : Number(variant.priceOverride)},
            ${Number(variant.quantityOnHand)},
            ${Number(variant.lowStockThreshold)},
            ${Boolean(variant.isActive)},
            ${createdAt}
          )
        `;
      }
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function updateProductRecord(productId, payload) {
  const executor = ensureSql();

  const existing = await executor`
    SELECT id
    FROM products
    WHERE id = ${productId}
    LIMIT 1
  `;

  if (!existing[0]) {
    return { ok: false, message: "Product tidak ditemukan." };
  }

  try {
    const category = await ensureCategory(executor, payload.category);

    await executor`
      UPDATE products
      SET
        name = ${payload.name},
        category_id = ${category.id},
        description = ${payload.description},
        base_price = ${Number(payload.basePrice)},
        is_active = ${Boolean(payload.isActive)}
      WHERE id = ${productId}
    `;

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function createVariantRecord(productId, payload) {
  const executor = ensureSql();
  const product = await executor`
    SELECT id
    FROM products
    WHERE id = ${productId}
    LIMIT 1
  `;

  if (!product[0]) {
    return { ok: false, message: "Product tidak ditemukan." };
  }

  try {
    await executor`
      INSERT INTO product_variants
      (id, product_id, sku, size, color, price_override, quantity_on_hand, low_stock_threshold, is_active, created_at)
      VALUES (
        ${createId("v")},
        ${productId},
        ${payload.sku},
        ${payload.size},
        ${payload.color},
        ${payload.priceOverride == null ? null : Number(payload.priceOverride)},
        ${Number(payload.quantityOnHand)},
        ${Number(payload.lowStockThreshold)},
        ${Boolean(payload.isActive)},
        ${nowIso()}
      )
    `;

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function updateVariantRecord(variantId, payload) {
  const executor = ensureSql();
  const existing = await executor`
    SELECT id
    FROM product_variants
    WHERE id = ${variantId}
    LIMIT 1
  `;

  if (!existing[0]) {
    return { ok: false, message: "Variant tidak ditemukan." };
  }

  try {
    await executor`
      UPDATE product_variants
      SET
        sku = ${payload.sku},
        size = ${payload.size},
        color = ${payload.color},
        price_override = ${payload.priceOverride == null ? null : Number(payload.priceOverride)},
        quantity_on_hand = ${Number(payload.quantityOnHand)},
        low_stock_threshold = ${Number(payload.lowStockThreshold)},
        is_active = ${Boolean(payload.isActive)}
      WHERE id = ${variantId}
    `;

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function createUserRecord(payload) {
  const executor = ensureSql();

  await executor`
    INSERT INTO users (id, name, username, password_hash, role, is_active, created_at)
    VALUES (
      ${createId("u")},
      ${payload.name},
      ${payload.username},
      ${hashPassword(payload.password)},
      ${payload.role},
      ${Boolean(payload.isActive)},
      ${nowIso()}
    )
  `;
}

export async function updateUserRecord(userId, payload) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", password_hash AS "passwordHash"
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const current = rows[0];

  if (!current) {
    return { ok: false, message: "User tidak ditemukan." };
  }

  await executor`
    UPDATE users
    SET
      name = ${payload.name ?? current.name},
      username = ${payload.username ?? current.username},
      role = ${payload.role ?? current.role},
      is_active = ${payload.isActive == null ? current.isActive : Boolean(payload.isActive)},
      password_hash = ${payload.password ? hashPassword(payload.password) : current.passwordHash}
    WHERE id = ${userId}
  `;

  return { ok: true };
}
