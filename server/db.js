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

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  // Support legacy SHA256 hashes (64-char hex) for migration
  if (storedHash && storedHash.length === 64 && !storedHash.includes(":")) {
    const sha256 = crypto.createHash("sha256").update(password).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sha256), Buffer.from(storedHash));
  }

  // New scrypt format: "scrypt:<salt>:<hash>"
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, hash] = parts;
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });

  return crypto.timingSafeEqual(Buffer.from(derived.toString("hex")), Buffer.from(hash));
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

async function ensureCategory(executor, name, tenantId) {
  const slug = slugify(name);
  const existing = await executor`
    SELECT id, name, slug
    FROM categories
    WHERE slug = ${slug} AND tenant_id = ${tenantId}
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
    INSERT INTO categories (id, name, slug, tenant_id)
    VALUES (${category.id}, ${category.name}, ${category.slug}, ${tenantId})
  `;

  return category;
}

async function fetchSettings(executor, tenantId) {
  const rows = await executor`
    SELECT key, value
    FROM settings
    WHERE tenant_id = ${tenantId}
    ORDER BY key ASC
  `;

  return mapSettingsRows(rows);
}

async function fetchCategories(executor, tenantId) {
  return executor`
    SELECT id, name, slug
    FROM categories
    WHERE tenant_id = ${tenantId}
    ORDER BY name ASC
  `;
}

async function fetchUsers(executor, tenantId) {
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", created_at AS "createdAt"
    FROM users
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
  `;

  return mapUsers(rows);
}

async function fetchProducts(executor, tenantId) {
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
      pv.attribute1_value AS "attribute1Value",
      pv.attribute2_value AS "attribute2Value",
      pv.price_override AS "priceOverride",
      pv.quantity_on_hand AS "quantityOnHand",
      pv.low_stock_threshold AS "lowStockThreshold",
      pv.is_active AS "variantIsActive",
      pv.created_at AS "variantCreatedAt"
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.tenant_id = ${tenantId}
    ORDER BY p.created_at DESC, p.name ASC, pv.created_at ASC, pv.sku ASC
  `;

  return mapProducts(rows);
}

async function fetchWorkspaceVariantStocks(executor, workspaceId, tenantId) {
  if (!workspaceId) {
    return [];
  }

  // Validate workspace belongs to the tenant before returning stock data
  const wsCheck = await executor`
    SELECT id FROM workspaces WHERE id = ${workspaceId} AND tenant_id = ${tenantId} LIMIT 1
  `;
  if (!wsCheck[0]) {
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

async function fetchPromotions(executor, tenantId) {
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
    WHERE p.tenant_id = ${tenantId}
    ORDER BY p.created_at DESC
  `;

  return mapPromotions(rows);
}

async function fetchWorkspaces(executor, tenantId) {
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
    WHERE w.tenant_id = ${tenantId}
    ORDER BY w.type ASC, w.created_at DESC, wa.assigned_at ASC
  `;

  return mapWorkspaceRows(rows);
}

async function fetchSales(executor, { workspaceId, fallbackWorkspaceId, tenantId }) {
  const salesRows = await executor`
    SELECT
      s.id,
      s.workspace_id AS "workspaceId",
      s.receipt_number AS "receiptNumber",
      s.cashier_user_id AS "cashierUserId",
      u.name AS "cashierUser",
      s.subtotal,
      s.discount_total AS "discountTotal",
      COALESCE(s.tax_total, 0) AS "taxTotal",
      s.grand_total AS "grandTotal",
      s.payment_method AS "paymentMethod",
      s.paid_amount AS "paidAmount",
      s.created_at AS "createdAt"
    FROM sales s
    JOIN users u ON u.id = s.cashier_user_id
    WHERE s.tenant_id = ${tenantId}
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
      attribute1_snapshot AS "attribute1Snapshot",
      attribute2_snapshot AS "attribute2Snapshot",
      unit_price_snapshot AS "unitPriceSnapshot",
      qty,
      line_total AS "lineTotal"
    FROM sale_items
    WHERE tenant_id = ${tenantId}
    ORDER BY id ASC
  `).filter((item) => saleIds.has(item.saleId));
  const saleIdArray = [...saleIds];
  const promotions = saleIdArray.length > 0
    ? await executor`
        SELECT
          sale_id AS "saleId",
          promotion_id AS "promotionId",
          code_snapshot AS "codeSnapshot",
          discount_amount AS "discountAmount"
        FROM sale_promotion_usages
        WHERE sale_id = ANY(${saleIdArray})
      `
    : [];

  return mapSales(filteredSales, items, promotions);
}

async function fetchInventoryMovements(executor, { workspaceId, fallbackWorkspaceId, tenantId }) {
  const rows = await executor`
    SELECT
      m.id,
      m.workspace_id AS "workspaceId",
      m.variant_id AS "variantId",
      pv.sku,
      p.name AS "productName",
      pv.attribute1_value AS "attribute1Value",
      pv.attribute2_value AS "attribute2Value",
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
    WHERE m.tenant_id = ${tenantId}
    ORDER BY m.created_at DESC
  `;

  return filterRowsByWorkspace(rows, { workspaceId, fallbackWorkspaceId });
}

async function resolveWriteWorkspaceId(executor, workspaceId, tenantId) {
  if (workspaceId) {
    const rows = await executor`
      SELECT id FROM workspaces WHERE id = ${workspaceId} AND tenant_id = ${tenantId} LIMIT 1
    `;
    if (!rows[0]) return null;
    return rows[0].id;
  }

  const rows = await executor`
    SELECT id
    FROM workspaces
    WHERE type = ${"store"} AND tenant_id = ${tenantId}
    ORDER BY created_at ASC
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

async function resolveWriteWorkspace(executor, workspaceId, tenantId) {
  const resolvedWorkspaceId = await resolveWriteWorkspaceId(executor, workspaceId, tenantId);

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
    WHERE id = ${resolvedWorkspaceId} AND tenant_id = ${tenantId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function consumeMainStockForEvent(tx, workspace, variantId, amount, tenantId) {
  const rows = await tx`
    SELECT id, quantity_on_hand AS "quantityOnHand"
    FROM product_variants
    WHERE id = ${variantId} AND tenant_id = ${tenantId}
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
      WHERE id = ${variantId} AND tenant_id = ${tenantId}
    `;
  }
}

export async function initializeDatabase() {
  const executor = ensureSql();
  await executor`SELECT 1`;
}

export async function getBootstrap({ workspaceId, tenantId } = {}) {
  const executor = ensureSql();
  if (!tenantId) {
    throw new Error("tenantId is required for getBootstrap.");
  }
  const settings = await fetchSettings(executor, tenantId);
  const categories = await fetchCategories(executor, tenantId);
  const users = await fetchUsers(executor, tenantId);
  const workspaces = await fetchWorkspaces(executor, tenantId);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === (workspaceId || null)) ?? null;
  const baseProducts = await fetchProducts(executor, tenantId);
  const products =
    activeWorkspace?.type === "event"
      ? overlayProductsWithWorkspaceStock(
          baseProducts,
          await fetchWorkspaceVariantStocks(executor, activeWorkspace.id, tenantId)
        )
      : baseProducts;
  const promotions = await fetchPromotions(executor, tenantId);
  const fallbackWorkspaceId = workspaces.find((workspace) => workspace.type === "store")?.id ?? null;
  const scope = {
    workspaceId: workspaceId || null,
    fallbackWorkspaceId,
    tenantId,
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

export async function authenticateUser(username, password, tenantSlug) {
  const executor = ensureSql();

  // If tenantSlug provided, scope to that tenant
  let tenantFilter = '';
  const rows = tenantSlug
    ? await executor`
        SELECT u.id, u.name, u.username, u.role, u.is_active AS "isActive",
               u.password_hash AS "passwordHash", u.tenant_id AS "tenantId"
        FROM users u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE lower(u.username) = lower(${username}) AND t.slug = ${tenantSlug}
        LIMIT 1
      `
    : await executor`
        SELECT u.id, u.name, u.username, u.role, u.is_active AS "isActive",
               u.password_hash AS "passwordHash", u.tenant_id AS "tenantId"
        FROM users u
        WHERE lower(u.username) = lower(${username})
        LIMIT 1
      `;
  const user = rows[0];

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  // Load tenant info
  const tenantRows = await executor`
    SELECT id, name, slug, plan, status, trial_ends_at AS "trialEndsAt",
           subscription_starts_at AS "subscriptionStartsAt",
           subscription_ends_at AS "subscriptionEndsAt"
    FROM tenants
    WHERE id = ${user.tenantId}
    LIMIT 1
  `;
  const tenant = tenantRows[0] || null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    tenantId: user.tenantId,
    tenant,
  };
}

export async function getUserById(userId) {
  const executor = ensureSql();
  // Try regular users first
  const userRows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", tenant_id AS "tenantId"
    FROM users WHERE id = ${userId} LIMIT 1
  `;
  if (userRows[0]) return userRows[0];
  
  // Fallback: check platform_admins
  const adminRows = await executor`
    SELECT id, name, email AS username, 'platform_admin' AS role, is_active AS "isActive", NULL AS "tenantId"
    FROM platform_admins WHERE id = ${userId} LIMIT 1
  `;
  return adminRows[0] || null;
}

export async function createEventRecord(payload, _actorUserId, tenantId) {
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
        (id, type, name, code, status, stock_mode, location_label, starts_at, ends_at, is_visible, created_at, tenant_id)
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
          ${nowIso()},
          ${tenantId}
        )
      `;

      if (assignedUserIds.length > 0) {
        const validUsers = await tx`
          SELECT id FROM users WHERE id = ANY(${assignedUserIds}) AND tenant_id = ${tenantId}
        `;
        const validIds = new Set(validUsers.map(u => u.id));

        for (const userId of assignedUserIds) {
          if (!validIds.has(userId)) continue;
          await tx`
            INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
            VALUES (${createId("wa")}, ${eventId}, ${userId}, ${nowIso()})
          `;
        }
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

export async function updateEventStatusRecord(eventId, payload, _actorUserId, tenantId) {
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
    WHERE id = ${eventId} AND tenant_id = ${tenantId}
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
    WHERE id = ${eventId} AND tenant_id = ${tenantId}
  `;

  return { ok: true, eventId, nextStatus };
}

export async function closeEventRecord(eventId, payload, _actorUserId, tenantId) {
  const executor = ensureSql();

  if (!canCompleteClosingReviewRecord(payload)) {
    return { ok: false, message: "Review penutupan event belum lengkap." };
  }

  const rows = await executor`
    SELECT id, type, status
    FROM workspaces
    WHERE id = ${eventId} AND tenant_id = ${tenantId}
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
    WHERE id = ${eventId} AND tenant_id = ${tenantId}
  `;

  return { ok: true, eventId };
}

export async function updateEventRecord(eventId, payload, tenantId) {
  const executor = ensureSql();
  
  const rows = await executor`
    SELECT id, status FROM workspaces
    WHERE id = ${eventId} AND type = 'event' AND tenant_id = ${tenantId}
    LIMIT 1
  `;
  
  if (!rows[0]) return { ok: false, message: "Event tidak ditemukan." };
  if (rows[0].status === "closed" || rows[0].status === "archived") {
    return { ok: false, message: "Event yang sudah ditutup/diarsipkan tidak bisa diedit." };
  }
  
  await executor`
    UPDATE workspaces SET
      name = COALESCE(${payload.name || null}, name),
      location_label = COALESCE(${payload.locationLabel || null}, location_label),
      starts_at = COALESCE(${payload.startsAt || null}, starts_at),
      ends_at = COALESCE(${payload.endsAt || null}, ends_at),
      stock_mode = COALESCE(${payload.stockMode || null}, stock_mode)
    WHERE id = ${eventId} AND tenant_id = ${tenantId}
  `;
  
  return { ok: true };
}

export async function deactivateEventRecord(eventId, tenantId) {
  const executor = ensureSql();
  
  const rows = await executor`
    SELECT id FROM workspaces
    WHERE id = ${eventId} AND type = 'event' AND tenant_id = ${tenantId}
    LIMIT 1
  `;
  
  if (!rows[0]) return { ok: false, message: "Event tidak ditemukan." };
  
  await executor`
    UPDATE workspaces SET
      is_visible = false,
      status = 'archived',
      archived_at = ${new Date().toISOString()}
    WHERE id = ${eventId} AND tenant_id = ${tenantId}
  `;
  
  return { ok: true };
}

export async function setWorkspaceAssignments(workspaceId, userIds, tenantId) {
  const executor = ensureSql();
  
  const wsRows = await executor`
    SELECT id FROM workspaces WHERE id = ${workspaceId} AND tenant_id = ${tenantId} LIMIT 1
  `;
  if (!wsRows[0]) return { ok: false, message: "Workspace tidak ditemukan." };
  
  await executor.begin(async (tx) => {
    await tx`DELETE FROM workspace_assignments WHERE workspace_id = ${workspaceId}`;
    
    const filteredUserIds = (userIds || []).filter(Boolean);
    const now = nowIso();

    if (filteredUserIds.length > 0) {
      const validUsers = await tx`
        SELECT id FROM users WHERE id = ANY(${filteredUserIds}) AND tenant_id = ${tenantId}
      `;
      const validIds = new Set(validUsers.map(u => u.id));

      for (const userId of filteredUserIds) {
        if (!validIds.has(userId)) continue;
        await tx`
          INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
          VALUES (${createId("wa")}, ${workspaceId}, ${userId}, ${now})
        `;
      }
    }
  });
  
  return { ok: true };
}

export async function createPromotionRecord(payload, actorUserId, tenantId) {
  const executor = ensureSql();

  await executor`
    INSERT INTO promotions
    (id, code, type, value, start_at, end_at, min_purchase, is_active, created_by, created_at, tenant_id)
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
      ${nowIso()},
      ${tenantId}
    )
  `;
}

export async function adjustInventoryRecord(payload, actorUserId, tenantId) {
  const executor = ensureSql();
  const amount = Number(payload.quantity);
  const workspace = await resolveWriteWorkspace(executor, payload.workspaceId || null, tenantId);

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

          await consumeMainStockForEvent(tx, workspace, payload.variantId, delta, tenantId);

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
            await consumeMainStockForEvent(tx, workspace, payload.variantId, delta, tenantId);
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
          WHERE id = ${payload.variantId} AND tenant_id = ${tenantId}
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
          WHERE id = ${payload.variantId} AND tenant_id = ${tenantId}
        `;
      }

      await tx`
        INSERT INTO inventory_movements
        (id, variant_id, workspace_id, type, qty_delta, note, actor_user_id, reference_id, created_at, tenant_id)
        VALUES (
          ${createId("mov")},
          ${payload.variantId},
          ${workspace.id},
          ${payload.mode},
          ${delta},
          ${payload.note},
          ${actorUserId},
          ${null},
          ${nowIso()},
          ${tenantId}
        )
      `;
    });

    return { ok: true, workspaceId: workspace.id };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function finalizeSaleRecord(payload, actorUserId, tenantId) {
  const executor = ensureSql();
  const cart = payload.cart || [];
  const workspace = await resolveWriteWorkspace(executor, payload.workspaceId || null, tenantId);

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
                  pv.attribute1_value AS "attribute1Value",
                  pv.attribute2_value AS "attribute2Value",
                  wvs.quantity_on_hand AS "quantityOnHand",
                  pv.price_override AS "priceOverride",
                  p.name AS "productName",
                  p.base_price AS "basePrice"
                FROM workspace_variant_stocks wvs
                JOIN product_variants pv ON pv.id = wvs.variant_id
                JOIN products p ON p.id = pv.product_id
                WHERE wvs.workspace_id = ${workspace.id} AND pv.id = ${item.variantId} AND pv.tenant_id = ${tenantId}
                FOR UPDATE
              `
            : await tx`
                SELECT
                  pv.id,
                  pv.sku,
                  pv.attribute1_value AS "attribute1Value",
                  pv.attribute2_value AS "attribute2Value",
                  pv.quantity_on_hand AS "quantityOnHand",
                  pv.price_override AS "priceOverride",
                  p.name AS "productName",
                  p.base_price AS "basePrice"
                FROM product_variants pv
                JOIN products p ON p.id = pv.product_id
                WHERE pv.id = ${item.variantId} AND pv.tenant_id = ${tenantId}
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
            `Stock ${dbVariants[index].productName} ${dbVariants[index].attribute1Value}/${dbVariants[index].attribute2Value} tidak cukup.`
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
          WHERE code = ${payload.promoCode.toUpperCase()} AND tenant_id = ${tenantId}
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

      // Tax calculation
      const settingsRows = await tx`SELECT key, value FROM settings WHERE key = 'taxRate' AND tenant_id = ${tenantId} LIMIT 1`;
      const taxRate = settingsRows[0] ? Number(settingsRows[0].value) : 0;
      const afterDiscount = subtotal - discount;
      const taxTotal = taxRate > 0 ? Math.round((afterDiscount * taxRate) / 100) : 0;
      const grandTotal = afterDiscount + taxTotal;

      // Receipt number: LKO-YYYYMMDD-XXXX (random, no race condition)
      const saleId = createId("sale");
      const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
      const receiptNumber = `LKO-${datePart}-${randomPart}`;
      const createdAt = nowIso();

      await tx`
        INSERT INTO sales
        (id, receipt_number, cashier_user_id, workspace_id, subtotal, discount_total, tax_total, grand_total, payment_method, paid_amount, created_at, tenant_id)
        VALUES (
          ${saleId},
          ${receiptNumber},
          ${actorUserId},
          ${workspace.id},
          ${subtotal},
          ${discount},
          ${taxTotal},
          ${grandTotal},
          ${payload.paymentMethod || "cash"},
          ${payload.paidAmount && payload.paidAmount >= grandTotal ? payload.paidAmount : grandTotal},
          ${createdAt},
          ${tenantId}
        )
      `;

      for (let index = 0; index < cart.length; index += 1) {
        const item = cart[index];
        const variant = dbVariants[index];
        const lineTotal = item.price * item.qty;

        await tx`
          INSERT INTO sale_items
          (id, sale_id, variant_id, product_name_snapshot, sku_snapshot, attribute1_snapshot, attribute2_snapshot, unit_price_snapshot, qty, line_total, tenant_id)
          VALUES (
            ${createId("si")},
            ${saleId},
            ${item.variantId},
            ${variant.productName},
            ${variant.sku},
            ${variant.attribute1Value},
            ${variant.attribute2Value},
            ${item.price},
            ${item.qty},
            ${lineTotal},
            ${tenantId}
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
            WHERE id = ${item.variantId} AND tenant_id = ${tenantId}
          `;
        }

        await tx`
          INSERT INTO inventory_movements
          (id, variant_id, workspace_id, type, qty_delta, note, actor_user_id, reference_id, created_at, tenant_id)
          VALUES (
            ${createId("mov")},
            ${item.variantId},
            ${workspace.id},
            ${"sale"},
            ${item.qty * -1},
            ${`Sale ${receiptNumber}`},
            ${actorUserId},
            ${saleId},
            ${createdAt},
            ${tenantId}
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
    console.error("[finalizeSaleRecord] Error:", error.message, "| paymentMethod:", payload.paymentMethod);
    return { ok: false, message: error.message };
  }
}

export async function updateSettingsRecord(payload, tenantId) {
  const executor = ensureSql();
  const entries = [
    ["storeName", payload.storeName],
    ["storeCode", payload.storeCode],
    ["address", payload.address],
    ["paymentMethods", JSON.stringify(payload.paymentMethods || [])],
    ["serviceChargeEnabled", JSON.stringify(Boolean(payload.serviceChargeEnabled))],
    ["taxRate", String(payload.taxRate ?? 0)],
    ["attribute1Label", payload.attribute1Label ?? "Size"],
    ["attribute2Label", payload.attribute2Label ?? "Color"],
    ["tagline", payload.tagline ?? ""],
    ["phone", payload.phone ?? ""],
    ["email", payload.email ?? ""],
    ["instagram", payload.instagram ?? ""],
    ["receiptHeader", payload.receiptHeader ?? ""],
    ["receiptFooter", payload.receiptFooter ?? ""],
    ["showLogo", JSON.stringify(Boolean(payload.showLogo))],
    ["showBarcode", JSON.stringify(Boolean(payload.showBarcode))],
    ["taxEnabled", JSON.stringify(Boolean(payload.taxEnabled))],
    ["taxName", payload.taxName ?? "Pajak Layanan"],
  ];

  await executor.begin(async (tx) => {
    for (const [key, value] of entries) {
      const existing = await tx`
        SELECT id FROM settings WHERE tenant_id = ${tenantId} AND key = ${key} LIMIT 1
      `;
      if (existing[0]) {
        await tx`
          UPDATE settings SET value = ${value} WHERE id = ${existing[0].id} AND tenant_id = ${tenantId}
        `;
      } else {
        await tx`
          INSERT INTO settings (id, key, value, tenant_id)
          VALUES (${createId("set")}, ${key}, ${value}, ${tenantId})
        `;
      }
    }
  });
}

export async function createProductRecord(payload, tenantId) {
  const executor = ensureSql();

  try {
    await executor.begin(async (tx) => {
      const category = await ensureCategory(tx, payload.category, tenantId);
      const productId = createId("p");
      const createdAt = nowIso();

      await tx`
        INSERT INTO products
        (id, name, category_id, description, base_price, is_active, created_at, tenant_id)
        VALUES (
          ${productId},
          ${payload.name},
          ${category.id},
          ${payload.description},
          ${Number(payload.basePrice)},
          ${Boolean(payload.isActive)},
          ${createdAt},
          ${tenantId}
        )
      `;

      for (const variant of payload.variants || []) {
        await tx`
          INSERT INTO product_variants
          (id, product_id, sku, attribute1_value, attribute2_value, price_override, quantity_on_hand, low_stock_threshold, is_active, created_at, tenant_id)
          VALUES (
            ${createId("v")},
            ${productId},
            ${variant.sku},
            ${variant.attribute1Value || variant.size || ''},
            ${variant.attribute2Value || variant.color || ''},
            ${variant.priceOverride == null ? null : Number(variant.priceOverride)},
            ${Number(variant.quantityOnHand)},
            ${Number(variant.lowStockThreshold)},
            ${Boolean(variant.isActive)},
            ${createdAt},
            ${tenantId}
          )
        `;
      }
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function updateProductRecord(productId, payload, tenantId) {
  const executor = ensureSql();

  const existing = await executor`
    SELECT id
    FROM products
    WHERE id = ${productId} AND tenant_id = ${tenantId}
    LIMIT 1
  `;

  if (!existing[0]) {
    return { ok: false, message: "Product tidak ditemukan." };
  }

  try {
    const category = await ensureCategory(executor, payload.category, tenantId);

    await executor`
      UPDATE products
      SET
        name = ${payload.name},
        category_id = ${category.id},
        description = ${payload.description},
        base_price = ${Number(payload.basePrice)},
        is_active = ${Boolean(payload.isActive)}
      WHERE id = ${productId} AND tenant_id = ${tenantId}
    `;

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function createVariantRecord(productId, payload, tenantId) {
  const executor = ensureSql();
  const product = await executor`
    SELECT id
    FROM products
    WHERE id = ${productId} AND tenant_id = ${tenantId}
    LIMIT 1
  `;

  if (!product[0]) {
    return { ok: false, message: "Product tidak ditemukan." };
  }

  try {
    await executor`
      INSERT INTO product_variants
      (id, product_id, sku, attribute1_value, attribute2_value, price_override, quantity_on_hand, low_stock_threshold, is_active, created_at, tenant_id)
      VALUES (
        ${createId("v")},
        ${productId},
        ${payload.sku},
        ${payload.attribute1Value || payload.size || ''},
        ${payload.attribute2Value || payload.color || ''},
        ${payload.priceOverride == null ? null : Number(payload.priceOverride)},
        ${Number(payload.quantityOnHand)},
        ${Number(payload.lowStockThreshold)},
        ${Boolean(payload.isActive)},
        ${nowIso()},
        ${tenantId}
      )
    `;

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function updateVariantRecord(variantId, payload, tenantId) {
  const executor = ensureSql();
  const existing = await executor`
    SELECT id
    FROM product_variants
    WHERE id = ${variantId} AND tenant_id = ${tenantId}
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
        attribute1_value = ${payload.attribute1Value || payload.size || ''},
        attribute2_value = ${payload.attribute2Value || payload.color || ''},
        price_override = ${payload.priceOverride == null ? null : Number(payload.priceOverride)},
        quantity_on_hand = ${Number(payload.quantityOnHand)},
        low_stock_threshold = ${Number(payload.lowStockThreshold)},
        is_active = ${Boolean(payload.isActive)}
      WHERE id = ${variantId} AND tenant_id = ${tenantId}
    `;

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function createUserRecord(payload, tenantId) {
  const executor = ensureSql();
  const userId = createId("u");
  const now = nowIso();

  await executor`
    INSERT INTO users (id, name, username, password_hash, role, is_active, created_at, tenant_id)
    VALUES (
      ${userId},
      ${payload.name},
      ${payload.username},
      ${hashPassword(payload.password)},
      ${payload.role},
      ${true},
      ${now},
      ${tenantId}
    )
  `;

  // Auto-assign new user to all active store workspaces
  const storeWorkspaces = await executor`
    SELECT id FROM workspaces
    WHERE tenant_id = ${tenantId} AND type = 'store' AND status = 'active' AND is_visible = true
  `;

  for (const ws of storeWorkspaces) {
    await executor`
      INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
      VALUES (${createId("wa")}, ${ws.id}, ${userId}, ${now})
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `;
  }

  return { ok: true, userId };
}

export async function updateUserRecord(userId, payload, tenantId) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", password_hash AS "passwordHash"
    FROM users
    WHERE id = ${userId} AND tenant_id = ${tenantId}
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
    WHERE id = ${userId} AND tenant_id = ${tenantId}
  `;

  return { ok: true };
}

// ── Tenant management ──────────────────────────────────────────────

export async function createTenant({ name, slug, email, password, ownerName, ownerUsername, trialDays }) {
  const executor = ensureSql();
  const tenantId = createId("tenant");
  const now = nowIso();
  const days = (trialDays && trialDays > 0) ? trialDays : 14;
  const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  try {
    await executor.begin(async (tx) => {
      // Create tenant
      await tx`
        INSERT INTO tenants (id, name, slug, email, plan, status, trial_ends_at, created_at, updated_at)
        VALUES (
          ${tenantId},
          ${name},
          ${slugify(slug)},
          ${email.toLowerCase()},
          ${'trial'},
          ${'active'},
          ${trialEndsAt},
          ${now},
          ${now}
        )
      `;

      // Create admin user for this tenant
      const userId = createId('u');
      await tx`
        INSERT INTO users (id, name, username, email, password_hash, role, is_active, created_at, tenant_id)
        VALUES (
          ${userId},
          ${ownerName},
          ${ownerUsername},
          ${email.toLowerCase()},
          ${hashPassword(password)},
          ${'admin'},
          ${true},
          ${now},
          ${tenantId}
        )
      `;

      // Create default store workspace
      const workspaceId = createId('workspace');
      await tx`
        INSERT INTO workspaces (id, type, name, code, status, stock_mode, is_visible, created_at, tenant_id)
        VALUES (
          ${workspaceId},
          ${'store'},
          ${'Toko Utama'},
          ${slug.toUpperCase() + '-MAIN'},
          ${'active'},
          ${'manual'},
          ${true},
          ${now},
          ${tenantId}
        )
      `;

      // Auto-assign admin to default workspace
      await tx`
        INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
        VALUES (${createId("wa")}, ${workspaceId}, ${userId}, ${now})
      `;

      // Create default settings
      const defaultSettings = [
        ['storeName', name],
        ['storeCode', slug.toUpperCase()],
        ['address', ''],
        ['paymentMethods', JSON.stringify([
          { id: "cash", label: "Cash", desc: "Uang tunai", enabled: true },
          { id: "qris", label: "QRIS", desc: "Scan QR Code", enabled: true },
          { id: "transfer", label: "Transfer Bank", desc: "BCA / Mandiri / BNI", enabled: false },
          { id: "card", label: "Kartu Debit/Kredit", desc: "Visa / Mastercard", enabled: false },
          { id: "ewallet", label: "E-Wallet", desc: "GoPay / OVO / Dana", enabled: false },
        ])],
        ['serviceChargeEnabled', 'false'],
        ['taxRate', '0'],
        ['attribute1Label', 'Size'],
        ['attribute2Label', 'Color'],
      ];

      for (const [key, value] of defaultSettings) {
        await tx`
          INSERT INTO settings (id, key, value, tenant_id)
          VALUES (${createId('set')}, ${key}, ${value}, ${tenantId})
        `;
      }
    });

    return { ok: true, tenantId };
  } catch (error) {
    if (error?.code === '23505') {
      if (error.constraint_name?.includes('slug') || error.message?.includes('slug')) {
        return { ok: false, message: 'Slug bisnis sudah dipakai.' };
      }
      if (error.constraint_name?.includes('email') || error.message?.includes('email')) {
        return { ok: false, message: 'Email sudah terdaftar.' };
      }
      return { ok: false, message: 'Data sudah ada.' };
    }
    return { ok: false, message: error.message };
  }
}

export async function getTenantById(tenantId) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, slug, email, plan, status,
           trial_ends_at AS "trialEndsAt",
           subscription_starts_at AS "subscriptionStartsAt",
           subscription_ends_at AS "subscriptionEndsAt",
           created_at AS "createdAt"
    FROM tenants
    WHERE id = ${tenantId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getTenantBySlug(slug) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, slug, email, plan, status,
           trial_ends_at AS "trialEndsAt",
           subscription_starts_at AS "subscriptionStartsAt",
           subscription_ends_at AS "subscriptionEndsAt",
           created_at AS "createdAt"
    FROM tenants
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function updateTenantRecord(tenantId, payload) {
  const executor = ensureSql();
  const existing = await executor`
    SELECT id FROM tenants WHERE id = ${tenantId} LIMIT 1
  `;
  if (!existing[0]) {
    return { ok: false, message: 'Tenant tidak ditemukan.' };
  }

  await executor`
    UPDATE tenants
    SET
      name = COALESCE(${payload.name || null}, name),
      plan = COALESCE(${payload.plan || null}, plan),
      status = COALESCE(${payload.status || null}, status),
      trial_ends_at = COALESCE(${payload.trialEndsAt || null}, trial_ends_at),
      subscription_starts_at = COALESCE(${payload.subscriptionStartsAt || null}, subscription_starts_at),
      subscription_ends_at = COALESCE(${payload.subscriptionEndsAt || null}, subscription_ends_at),
      updated_at = ${nowIso()}
    WHERE id = ${tenantId}
  `;
  return { ok: true };
}

export async function listTenants() {
  const executor = ensureSql();
  return executor`
    SELECT t.id, t.name, t.slug, t.email, t.plan, t.status,
           t.trial_ends_at AS "trialEndsAt",
           t.subscription_starts_at AS "subscriptionStartsAt",
           t.subscription_ends_at AS "subscriptionEndsAt",
           t.created_at AS "createdAt",
           (SELECT COUNT(*)::int FROM users WHERE tenant_id = t.id) AS "usersCount",
           (SELECT COUNT(*)::int FROM products WHERE tenant_id = t.id) AS "productsCount",
           (SELECT COUNT(*)::int FROM workspaces WHERE tenant_id = t.id) AS "workspacesCount"
    FROM tenants t
    ORDER BY t.created_at DESC
  `;
}

export async function getPlatformAdminById(adminId) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, email, name, is_active AS "isActive"
    FROM platform_admins
    WHERE id = ${adminId} AND is_active = true
    LIMIT 1
  `;
  return rows[0] ? { ...rows[0], role: 'platform_admin' } : null;
}

export async function authenticatePlatformAdmin(email, password) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, email, name, is_active AS "isActive", password_hash AS "passwordHash"
    FROM platform_admins
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `;
  const admin = rows[0];
  if (!admin || !admin.isActive || !verifyPassword(password, admin.passwordHash)) {
    return null;
  }
  return { id: admin.id, email: admin.email, name: admin.name, role: 'platform_admin' };
}

// ── Plan limits ────────────────────────────────────────────────────

const PLAN_LIMITS = {
  trial:   { workspaces: 1, products: 50,  users: 2,  customBranding: false },
  starter: { workspaces: 1, products: 100, users: 2,  customBranding: false },
  pro:     { workspaces: 5, products: -1,  users: 10, customBranding: true  },
  business:{ workspaces: -1,products: -1,  users: -1, customBranding: true  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
}

export async function getTenantUsage(tenantId) {
  const executor = ensureSql();
  const [workspaceCount] = await executor`SELECT COUNT(*)::int AS count FROM workspaces WHERE tenant_id = ${tenantId}`;
  const [productCount] = await executor`SELECT COUNT(*)::int AS count FROM products WHERE tenant_id = ${tenantId}`;
  const [userCount] = await executor`SELECT COUNT(*)::int AS count FROM users WHERE tenant_id = ${tenantId}`;
  return {
    workspaces: workspaceCount.count,
    products: productCount.count,
    users: userCount.count,
  };
}

export async function getTenantAdminUser(tenantId) {
  const executor = ensureSql();
  const rows = await executor`
    SELECT id, name, username, role, is_active AS "isActive", tenant_id AS "tenantId"
    FROM users
    WHERE tenant_id = ${tenantId} AND role = 'admin' AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getPlatformStats() {
  const executor = ensureSql();
  const [total] = await executor`SELECT COUNT(*)::int AS count FROM tenants`;
  const [active] = await executor`SELECT COUNT(*)::int AS count FROM tenants WHERE status = 'active'`;
  const [trial] = await executor`SELECT COUNT(*)::int AS count FROM tenants WHERE plan = 'trial' AND status = 'active'`;
  const [suspended] = await executor`SELECT COUNT(*)::int AS count FROM tenants WHERE status = 'suspended'`;
  
  // Recent tenants (last 5)
  const recent = await executor`
    SELECT id, name, slug, plan, status, created_at AS "createdAt"
    FROM tenants ORDER BY created_at DESC LIMIT 5
  `;
  
  return {
    totalTenants: total.count,
    activeTenants: active.count,
    trialTenants: trial.count,
    suspendedTenants: suspended.count,
    recentTenants: recent,
  };
}

export async function getTenantDetail(tenantId) {
  const executor = ensureSql();
  const tenant = await getTenantById(tenantId);
  if (!tenant) return null;
  
  const usage = await getTenantUsage(tenantId);
  const limits = getPlanLimits(tenant.plan);
  
  // Get tenant's users
  const users = await executor`
    SELECT id, name, username, role, is_active AS "isActive", created_at AS "createdAt"
    FROM users WHERE tenant_id = ${tenantId} ORDER BY created_at ASC
  `;
  
  return { tenant, usage, limits, users };
}

export async function allocateStockToEvent(payload, actorUserId, tenantId) {
  const executor = ensureSql();
  const workspace = await resolveWriteWorkspace(executor, payload.workspaceId, tenantId);

  if (!workspace || workspace.type !== "event") {
    return { ok: false, message: "Workspace harus bertipe event." };
  }
  if (!["draft", "active"].includes(workspace.status)) {
    return { ok: false, message: "Event harus berstatus draft atau aktif." };
  }

  const items = payload.items || [];
  if (items.length === 0) {
    return { ok: false, message: "Tidak ada item untuk dialokasikan." };
  }

  try {
    await executor.begin(async (tx) => {
      for (const item of items) {
        const qty = Number(item.quantity);
        if (qty < 1) continue;

        // Validate variant belongs to tenant
        const variantRows = await tx`
          SELECT id, quantity_on_hand AS "quantityOnHand"
          FROM product_variants
          WHERE id = ${item.variantId} AND tenant_id = ${tenantId}
          FOR UPDATE
        `;
        const variant = variantRows[0];
        if (!variant) continue;

        // Check if already allocated to this event
        const existingRows = await tx`
          SELECT id, quantity_on_hand AS "quantityOnHand"
          FROM workspace_variant_stocks
          WHERE workspace_id = ${workspace.id} AND variant_id = ${item.variantId}
          FOR UPDATE
        `;
        const existing = existingRows[0];

        // If allocate mode, deduct from main store
        if (workspace.stockMode === "allocate") {
          if (variant.quantityOnHand < qty) {
            throw new Error(`Stok toko tidak cukup untuk variant ${item.variantId}. Tersedia: ${variant.quantityOnHand}, diminta: ${qty}`);
          }
          await tx`
            UPDATE product_variants SET quantity_on_hand = quantity_on_hand - ${qty}
            WHERE id = ${item.variantId} AND tenant_id = ${tenantId}
          `;
        }

        if (existing) {
          // Update existing allocation
          await tx`
            UPDATE workspace_variant_stocks SET
              quantity_on_hand = quantity_on_hand + ${qty},
              allocated_from_main = CASE WHEN ${workspace.stockMode === "allocate"} THEN allocated_from_main + ${qty} ELSE allocated_from_main END,
              updated_at = ${nowIso()}
            WHERE id = ${existing.id}
          `;
        } else {
          // Create new allocation
          await tx`
            INSERT INTO workspace_variant_stocks
            (id, workspace_id, variant_id, quantity_on_hand, source_mode, allocated_from_main, created_at, updated_at)
            VALUES (
              ${createId("wvs")},
              ${workspace.id},
              ${item.variantId},
              ${qty},
              ${workspace.stockMode || "manual"},
              ${workspace.stockMode === "allocate" ? qty : 0},
              ${nowIso()},
              ${nowIso()}
            )
          `;
        }

        // Create inventory movement for audit
        await tx`
          INSERT INTO inventory_movements
          (id, variant_id, workspace_id, type, qty_delta, note, actor_user_id, reference_id, created_at, tenant_id)
          VALUES (
            ${createId("mov")},
            ${item.variantId},
            ${workspace.id},
            ${"restock"},
            ${qty},
            ${"Alokasi stok dari toko ke event"},
            ${actorUserId},
            ${null},
            ${nowIso()},
            ${tenantId}
          )
        `;
      }
    });

    return { ok: true, workspaceId: workspace.id };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function getStoreProducts(tenantId) {
  const executor = ensureSql();

  const products = await executor`
    SELECT p.id, p.name, p.category_id, p.base_price AS "basePrice", p.is_active AS "isActive",
           c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.tenant_id = ${tenantId} AND p.is_active = true
    ORDER BY p.name ASC
  `;

  const variants = await executor`
    SELECT id, product_id AS "productId", sku,
           attribute1_value AS "attribute1Value", attribute2_value AS "attribute2Value",
           quantity_on_hand AS "quantityOnHand", is_active AS "isActive"
    FROM product_variants
    WHERE tenant_id = ${tenantId} AND is_active = true
    ORDER BY product_id, created_at ASC
  `;

  // Group variants under products
  const variantMap = new Map();
  for (const v of variants) {
    if (!variantMap.has(v.productId)) variantMap.set(v.productId, []);
    variantMap.get(v.productId).push(v);
  }

  return products.map(p => ({
    ...p,
    variants: variantMap.get(p.id) || [],
  })).filter(p => p.variants.length > 0);
}

export function checkTenantStatus(tenant) {
  if (!tenant) return { ok: false, reason: 'not_found' };
  if (tenant.status === 'suspended') return { ok: false, reason: 'suspended' };
  if (tenant.status === 'cancelled') return { ok: false, reason: 'cancelled' };

  // Trial expiry check
  if (tenant.plan === 'trial' && tenant.trialEndsAt) {
    if (new Date(tenant.trialEndsAt) < new Date()) {
      return { ok: false, reason: 'trial_expired' };
    }
  }

  // Paid subscription expiry check
  if (tenant.plan !== 'trial' && tenant.subscriptionEndsAt) {
    if (new Date(tenant.subscriptionEndsAt) < new Date()) {
      return { ok: false, reason: 'subscription_expired' };
    }
  }

  return { ok: true };
}
