import "dotenv/config";

import crypto from "node:crypto";
import express from "express";
import { pathToFileURL } from "node:url";

import { requireAuth, requireRole, signJwt } from "./auth.js";

// ── In-memory rate limiter (no external dependency) ──────────────
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  const hits = new Map();

  // Cleanup old entries periodically
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of hits) {
      if (now - data.start > windowMs) hits.delete(key);
    }
  }, windowMs);
  if (cleanup.unref) cleanup.unref(); // Don't keep process alive for cleanup

  return (req, res, next) => {
    const key = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now - record.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        ok: false,
        message: "Terlalu banyak permintaan. Coba lagi nanti.",
      });
    }

    next();
  };
}

// ── Password validation ──────────────────────────────────────────
function validatePassword(password) {
  if (!password) return "Password wajib diisi.";
  if (typeof password !== "string") return "Password tidak valid.";
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (password.length > 128) return "Password terlalu panjang.";
  return null;
}

// ── Rate limiters ────────────────────────────────────────────────
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const registerLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });
const apiLimiter = createRateLimiter({ windowMs: 1 * 60 * 1000, max: 120 });

import {
  adjustInventoryRecord,
  allocateStockToEvent,
  authenticateUser,
  authenticatePlatformAdmin,
  bulkCreateProducts,
  bulkDeleteAllProducts,
  bulkDeleteAllSales,
  checkTenantStatus,
  createCategory,
  deleteCategory,
  renameCategory,
  closeEventRecord,
  createAuditLog,
  createEventRecord,
  deactivateEventRecord,
  createProductRecord,
  createPromotionRecord,
  createTenant,
  createUserRecord,
  createVariantRecord,
  finalizeSaleRecord,
  getAuditLogs,
  getBootstrap,
  getPlanLimits,
  getPlatformAdminById,
  getPlatformStats,
  getRecycleBin,
  getStoreProducts,
  getTenantAdminUser,
  getTenantById,
  getTenantDetail,
  getTenantUsage,
  getUserById,
  initializeDatabase,
  listTenants,
  permanentDelete,
  resetAllStock,
  restoreFromRecycleBin,
  setWorkspaceAssignments,
  softDeleteProducts,
  softDeletePromotion,
  softDeleteSales,
  updateEventRecord,
  updateEventStatusRecord,
  updateProductRecord,
  updateSettingsRecord,
  updateTenantRecord,
  updateUserRecord,
  updateVariantRecord,
} from "./db.js";

const port = Number(process.env.PORT || 3001);

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function getRequestWorkspaceId(req, fallback = null) {
  const queryWorkspaceId = typeof req.query.workspaceId === "string" ? req.query.workspaceId.trim() : "";
  if (queryWorkspaceId) {
    return queryWorkspaceId;
  }

  const bodyWorkspaceId = typeof req.body?.workspaceId === "string" ? req.body.workspaceId.trim() : "";
  if (bodyWorkspaceId) {
    return bodyWorkspaceId;
  }

  return fallback;
}

function withRequestWorkspace(payload, workspaceId) {
  if (!workspaceId) {
    return payload || {};
  }

  return {
    ...(payload || {}),
    workspaceId,
  };
}

function requirePlatformAdmin(req, res, next) {
  // Check both payload (from JWT) and user (from DB) for platform_admin role
  const isPlatformAdmin =
    req.auth?.user?.role === "platform_admin" ||
    req.auth?.payload?.role === "platform_admin";
  if (!isPlatformAdmin) {
    res.status(403).json({ ok: false, message: "Forbidden." });
    return;
  }
  next();
}

export function createApp({
  adjustInventoryRecordFn = adjustInventoryRecord,
  allocateStockToEventFn = allocateStockToEvent,
  authenticateUserFn = authenticateUser,
  bulkCreateProductsFn = bulkCreateProducts,
  bulkDeleteAllProductsFn = bulkDeleteAllProducts,
  createCategoryFn = createCategory,
  deleteCategoryFn = deleteCategory,
  ensureCategoryFn = createCategory,
  renameCategoryFn = renameCategory,
  bulkDeleteAllSalesFn = bulkDeleteAllSales,
  closeEventRecordFn = closeEventRecord,
  createAuditLogFn = createAuditLog,
  createEventRecordFn = createEventRecord,
  deactivateEventRecordFn = deactivateEventRecord,
  createProductRecordFn = createProductRecord,
  createPromotionRecordFn = createPromotionRecord,
  createUserRecordFn = createUserRecord,
  createVariantRecordFn = createVariantRecord,
  finalizeSaleRecordFn = finalizeSaleRecord,
  getAuditLogsFn = getAuditLogs,
  getBootstrapFn = getBootstrap,
  getPlatformAdminByIdFn = getPlatformAdminById,
  getRecycleBinFn = getRecycleBin,
  getStoreProductsFn = getStoreProducts,
  getPlatformStatsFn = getPlatformStats,
  getTenantAdminUserFn = getTenantAdminUser,
  getTenantByIdFn = getTenantById,
  getTenantDetailFn = getTenantDetail,
  checkTenantStatusFn = checkTenantStatus,
  getUserByIdFn = getUserById,
  permanentDeleteFn = permanentDelete,
  requireAuthFn = requireAuth,
  requireRoleMiddleware = requireRole,
  resetAllStockFn = resetAllStock,
  restoreFromRecycleBinFn = restoreFromRecycleBin,
  setWorkspaceAssignmentsFn = setWorkspaceAssignments,
  signJwtFn = signJwt,
  softDeleteProductsFn = softDeleteProducts,
  softDeletePromotionFn = softDeletePromotion,
  softDeleteSalesFn = softDeleteSales,
  updateEventRecordFn = updateEventRecord,
  updateEventStatusRecordFn = updateEventStatusRecord,
  updateProductRecordFn = updateProductRecord,
  updateSettingsRecordFn = updateSettingsRecord,
  updateUserRecordFn = updateUserRecord,
  updateVariantRecordFn = updateVariantRecord,
  authMiddleware = null,
} = {}) {
  const app = express();
  const auth = authMiddleware ?? requireAuthFn(getUserByIdFn, getTenantByIdFn, checkTenantStatusFn);

  // Higher limit for image upload endpoint (must be before the general limit)
  app.use("/api/upload", express.json({ limit: "10mb" }));
  app.use(express.json({ limit: "1mb" }));

  // ── Security headers ────────────────────────────────────────────
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // ── General API rate limiter ────────────────────────────────────
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // ── Image upload to Cloudinary ─────────────────────────────────
  app.post(
    "/api/upload/image",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const { image } = req.body; // base64 data URI

      if (!image) {
        res.status(400).json({ ok: false, message: "Tidak ada gambar." });
        return;
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        res.status(500).json({ ok: false, message: "Cloudinary belum dikonfigurasi." });
        return;
      }

      // Generate signature for signed upload
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = `lakoo/${req.auth.user.tenantId}`;
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash("sha256")
        .update(paramsToSign + apiSecret)
        .digest("hex");

      // Upload to Cloudinary via REST API
      const formData = new URLSearchParams();
      formData.append("file", image);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || uploadData.error) {
        res.status(500).json({ ok: false, message: uploadData.error?.message || "Upload gagal." });
        return;
      }

      res.json({
        ok: true,
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
      });
    })
  );

  app.post(
    "/api/auth/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const { username, password, tenantSlug } = req.body || {};
      const user = await authenticateUserFn(username, password, tenantSlug || null);

      if (!user) {
        res.status(401).json({ ok: false, message: "Username atau password tidak valid." });
        return;
      }

      // Check tenant status
      if (user.tenant) {
        const tenantCheck = checkTenantStatus(user.tenant);
        if (!tenantCheck.ok) {
          const messages = {
            suspended: "Akun bisnis Anda sedang disuspend. Hubungi support.",
            cancelled: "Akun bisnis Anda sudah dibatalkan.",
            trial_expired: "Masa trial Anda sudah habis. Silakan upgrade ke paket berbayar.",
            subscription_expired: "Langganan Anda sudah berakhir. Silakan perpanjang langganan.",
          };
          res.status(403).json({ ok: false, message: messages[tenantCheck.reason] || "Akun tidak aktif." });
          return;
        }
      }

      const token = signJwtFn({
        sub: user.id,
        role: user.role,
        username: user.username,
        tenantId: user.tenantId,
      });

      const limits = user.tenant ? getPlanLimits(user.tenant.plan) : null;
      const usage = user.tenantId ? await getTenantUsage(user.tenantId) : null;
      res.json({ ok: true, token, user: { ...user, tenant: user.tenant }, limits, usage });
    })
  );

  // Registration (create new tenant + admin user)
  app.post(
    "/api/auth/register",
    registerLimiter,
    asyncHandler(async (req, res) => {
      const { businessName, slug, email, password, ownerName } = req.body || {};

      if (!businessName || !slug || !email || !password) {
        res.status(400).json({ ok: false, message: "Semua field wajib diisi." });
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ ok: false, message: passwordError });
        return;
      }

      const result = await createTenant({
        name: businessName,
        slug,
        email,
        password,
        ownerName: ownerName || businessName,
        ownerUsername: email.split('@')[0],
      });

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.json({ ok: true, tenantId: result.tenantId });
    })
  );

  app.get(
    "/api/auth/me",
    auth,
    asyncHandler(async (req, res) => {
      const tenant = req.auth.user.tenantId
        ? await getTenantById(req.auth.user.tenantId)
        : null;
      const usage = req.auth.user.tenantId
        ? await getTenantUsage(req.auth.user.tenantId)
        : null;
      const limits = tenant ? getPlanLimits(tenant.plan) : null;
      res.json({ ok: true, user: req.auth.user, tenant, usage, limits });
    })
  );

  // Tenant info
  app.get(
    "/api/tenant",
    auth,
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      if (!tenantId) {
        res.status(400).json({ ok: false, message: "No tenant." });
        return;
      }
      const tenant = await getTenantById(tenantId);
      const usage = await getTenantUsage(tenantId);
      const limits = getPlanLimits(tenant?.plan);
      res.json({ ok: true, tenant, usage, limits });
    })
  );

  app.get(
    "/api/bootstrap",
    auth,
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      if (!tenantId) {
        res.status(400).json({ ok: false, message: "No tenant context." });
        return;
      }
      res.json({
        ok: true,
        data: await getBootstrapFn({
          workspaceId: req.query.workspaceId || null,
          tenantId,
        }),
      });
    })
  );

  app.post(
    "/api/events",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;

      // Enforce workspace limit
      const tenant = await getTenantByIdFn(tenantId);
      const limits = getPlanLimits(tenant?.plan);
      if (limits.workspaces > 0) {
        const usage = await getTenantUsage(tenantId);
        if (usage.workspaces >= limits.workspaces) {
          res.status(403).json({ ok: false, message: `Batas workspace untuk paket ${tenant.plan} adalah ${limits.workspaces}. Upgrade paket untuk menambah workspace.` });
          return;
        }
      }

      const result = await createEventRecordFn(req.body, req.auth.user.id, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "event.create", entityType: "event", entityId: result.eventId, details: { name: req.body.name, location: req.body.locationLabel, stockMode: req.body.stockMode }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        eventId: result.eventId,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.patch(
    "/api/events/:id/status",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await updateEventStatusRecordFn(req.params.id, req.body, req.auth.user.id, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "event.status_change", entityType: "event", entityId: result.eventId, details: { status: req.body.status }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        eventId: result.eventId,
        nextStatus: result.nextStatus,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/events/:id/close",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await closeEventRecordFn(req.params.id, req.body, req.auth.user.id, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "event.close", entityType: "event", entityId: result.eventId, details: { eventId: req.params.id }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        eventId: result.eventId,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.patch(
    "/api/events/:id",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await updateEventRecordFn(req.params.id, req.body, tenantId);
      if (!result.ok) { res.status(400).json(result); return; }
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.delete(
    "/api/events/:id",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await deactivateEventRecordFn(req.params.id, tenantId);
      if (!result.ok) { res.status(400).json(result); return; }
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.post(
    "/api/events/:id/allocate",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await allocateStockToEventFn(
        { ...req.body, workspaceId: req.params.id },
        req.auth.user.id,
        tenantId
      );
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const data = await getBootstrapFn({
        workspaceId: getRequestWorkspaceId(req, result.workspaceId),
        tenantId,
      });
      res.json({ ok: true, data });
    })
  );

  app.get(
    "/api/store-products",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const products = await getStoreProductsFn(tenantId);
      res.json({ ok: true, products });
    })
  );

  app.put(
    "/api/workspaces/:id/assignments",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await setWorkspaceAssignmentsFn(req.params.id, req.body.userIds || [], tenantId);
      if (!result.ok) { res.status(400).json(result); return; }
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.post(
    "/api/promotions",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await createPromotionRecordFn(req.body, req.auth.user.id, tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "promotion.create", entityType: "promotion", details: { code: req.body.code, type: req.body.type, value: req.body.value }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/inventory/movements",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const requestWorkspaceId = getRequestWorkspaceId(req);
      const result = await adjustInventoryRecordFn(
        withRequestWorkspace(req.body, requestWorkspaceId),
        req.auth.user.id,
        tenantId
      );

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "inventory.adjust", entityType: "inventory", details: { variantId: req.body.variantId, mode: req.body.mode, quantity: req.body.quantity }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        data: await getBootstrapFn({
          workspaceId: getRequestWorkspaceId(req, result.workspaceId ?? null),
          tenantId,
        }),
      });
    })
  );

  app.post(
    "/api/sales",
    auth,
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const requestWorkspaceId = getRequestWorkspaceId(req);
      const result = await finalizeSaleRecordFn(withRequestWorkspace(req.body, requestWorkspaceId), req.auth.user.id, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      const data = await getBootstrapFn({
        workspaceId: getRequestWorkspaceId(req, result.workspaceId ?? null),
        tenantId,
      });
      const sale = data.sales.find((item) => item.id === result.saleId) ?? null;
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "sale.create", entityType: "sale", entityId: result.saleId, details: { receiptNumber: sale?.receiptNumber, total: sale?.grandTotal, paymentMethod: req.body.paymentMethod, items: req.body.cart?.length }, ipAddress: req.ip }); } catch (_) {}
      res.json({ ok: true, sale, data });
    })
  );

  app.delete(
    "/api/sales/:id",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await softDeleteSalesFn([req.params.id], tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "Admin", action: "sale.delete", entityType: "sale", entityId: req.params.id, details: { saleId: req.params.id }, ipAddress: req.ip }); } catch (_) {}
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.delete(
    "/api/promotions/:id",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await softDeletePromotionFn(req.params.id, tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "promotion.delete", entityType: "promotion", entityId: req.params.id, details: { promoId: req.params.id }, ipAddress: req.ip }); } catch (_) {}
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.put(
    "/api/settings",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await updateSettingsRecordFn(req.body, tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "settings.update", entityType: "settings", details: { fields: Object.keys(req.body).filter(k => req.body[k] !== undefined).join(", ") }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/users",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;

      // Enforce user limit
      const tenant = await getTenantByIdFn(tenantId);
      const limits = getPlanLimits(tenant?.plan);
      if (limits.users > 0) {
        const usage = await getTenantUsage(tenantId);
        if (usage.users >= limits.users) {
          res.status(403).json({ ok: false, message: `Batas pengguna untuk paket ${tenant.plan} adalah ${limits.users}. Upgrade paket untuk menambah pengguna.` });
          return;
        }
      }

      // Validate password
      const passwordError = validatePassword(req.body?.password);
      if (passwordError) {
        res.status(400).json({ ok: false, message: passwordError });
        return;
      }

      // Validate role
      const allowedRoles = ["admin", "manager", "cashier"];
      if (req.body.role && !allowedRoles.includes(req.body.role)) {
        res.status(400).json({ ok: false, message: "Role tidak valid." });
        return;
      }

      const result = await createUserRecordFn(req.body, tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "user.create", entityType: "user", entityId: result.userId, details: { name: req.body.name, username: req.body.username, role: req.body.role }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        userId: result.userId,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.patch(
    "/api/users/:id",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;

      // Validate password if provided
      if (req.body?.password) {
        const passwordError = validatePassword(req.body.password);
        if (passwordError) {
          res.status(400).json({ ok: false, message: passwordError });
          return;
        }
      }

      // Validate role if provided
      const allowedRoles = ["admin", "manager", "cashier"];
      if (req.body?.role && !allowedRoles.includes(req.body.role)) {
        res.status(400).json({ ok: false, message: "Role tidak valid." });
        return;
      }

      const result = await updateUserRecordFn(req.params.id, req.body, tenantId);

      if (!result.ok) {
        res.status(404).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "user.update", entityType: "user", entityId: req.params.id, details: { name: req.body.name, role: req.body.role }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/products",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;

      // Enforce product limit
      const tenant = await getTenantByIdFn(tenantId);
      const limits = getPlanLimits(tenant?.plan);
      if (limits.products > 0) {
        const usage = await getTenantUsage(tenantId);
        if (usage.products >= limits.products) {
          res.status(403).json({ ok: false, message: `Batas produk untuk paket ${tenant.plan} adalah ${limits.products}. Upgrade paket untuk menambah produk.` });
          return;
        }
      }

      const result = await createProductRecordFn(req.body, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "product.create", entityType: "product", details: { name: req.body.name, category: req.body.category, price: req.body.basePrice }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/categories",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const { name } = req.body;
      if (!name || !name.trim()) { res.status(400).json({ ok: false, message: "Nama kategori wajib diisi." }); return; }
      await ensureCategoryFn(name.trim(), tenantId);
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.delete(
    "/api/categories/:name",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await deleteCategoryFn(decodeURIComponent(req.params.name), tenantId);
      if (!result.ok) { res.status(400).json(result); return; }
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.patch(
    "/api/categories/:name",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const { newName } = req.body;
      if (!newName) { res.status(400).json({ ok: false, message: "Nama baru wajib diisi." }); return; }
      const result = await renameCategoryFn(decodeURIComponent(req.params.name), newName, tenantId);
      if (!result.ok) { res.status(400).json(result); return; }
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  app.post(
    "/api/products/import",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const products = req.body.products || [];
      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({ ok: false, message: "Data produk tidak valid." });
        return;
      }
      if (products.length > 500) {
        res.status(400).json({ ok: false, message: "Maksimal 500 produk per import." });
        return;
      }

      // Enforce product limit
      const tenant = await getTenantByIdFn(tenantId);
      const limits = getPlanLimits(tenant?.plan);
      if (limits.products > 0) {
        const usage = await getTenantUsage(tenantId);
        const remaining = limits.products - usage.products;
        if (remaining <= 0) {
          res.status(403).json({ ok: false, message: `Batas produk untuk paket ${tenant.plan} adalah ${limits.products}. Upgrade paket untuk menambah produk.` });
          return;
        }
        if (products.length > remaining) {
          res.status(403).json({ ok: false, message: `Sisa kuota produk Anda: ${remaining}. Anda mencoba import ${products.length} produk. Kurangi jumlah atau upgrade paket.` });
          return;
        }
      }

      const result = await bulkCreateProductsFn(products, tenantId);
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, ...result, data });
    })
  );

  app.patch(
    "/api/products/:id",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await updateProductRecordFn(req.params.id, req.body, tenantId);

      if (!result.ok) {
        res.status(404).json(result);
        return;
      }

      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name || "User", action: "product.update", entityType: "product", entityId: req.params.id, details: { name: result.productName || req.body.name, fields: result.changes && result.changes.length > 0 ? result.changes.join(", ") : "data" }, ipAddress: req.ip }); } catch (_) {}
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/products/:id/variants",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await createVariantRecordFn(req.params.id, req.body, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.patch(
    "/api/variants/:id",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await updateVariantRecordFn(req.params.id, req.body, tenantId);

      if (!result.ok) {
        res.status(404).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  // ── Audit Logs ─────────────────────────────────────────────────
  app.get(
    "/api/audit-logs",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const { limit, offset, action, entityType } = req.query;
      const logs = await getAuditLogsFn(tenantId, { limit: Number(limit) || 50, offset: Number(offset) || 0, action, entityType });
      res.json({ ok: true, logs });
    })
  );

  // ── Recycle Bin ───────────────────────────────────────────────────
  app.get(
    "/api/recycle-bin",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const bin = await getRecycleBinFn(tenantId);
      res.json({ ok: true, ...bin });
    })
  );

  app.post(
    "/api/recycle-bin/restore",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const { entityType, entityIds } = req.body;

      // Enforce limits when restoring products
      if (entityType === "product") {
        const tenant = await getTenantByIdFn(tenantId);
        const limits = getPlanLimits(tenant?.plan);
        if (limits.products > 0) {
          const usage = await getTenantUsage(tenantId);
          const remaining = limits.products - usage.products;
          if (entityIds.length > remaining) {
            res.status(403).json({ ok: false, message: `Sisa kuota produk: ${remaining}. Anda mencoba memulihkan ${entityIds.length} produk. Hapus beberapa produk atau upgrade paket.` });
            return;
          }
        }
      }

      await restoreFromRecycleBinFn(entityType, entityIds, tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name, action: `${entityType}.restore`, entityType, details: { count: entityIds.length } }); } catch (_) {}
      res.json({ ok: true });
    })
  );

  app.post(
    "/api/recycle-bin/delete",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const { entityType, entityIds } = req.body;
      await permanentDeleteFn(entityType, entityIds, tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name, action: `${entityType}.permanent_delete`, entityType, details: { count: entityIds.length } }); } catch (_) {}
      res.json({ ok: true });
    })
  );

  // ── Bulk Actions ──────────────────────────────────────────────────
  app.post(
    "/api/bulk/delete-products",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const count = await bulkDeleteAllProductsFn(tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name, action: "product.bulk_delete", entityType: "product", details: { count } }); } catch (_) {}
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, count, data });
    })
  );

  app.post(
    "/api/bulk/delete-sales",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const count = await bulkDeleteAllSalesFn(tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name, action: "sale.bulk_delete", entityType: "sale", details: { count } }); } catch (_) {}
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, count, data });
    })
  );

  app.post(
    "/api/bulk/reset-stock",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await resetAllStockFn(tenantId);
      try { await createAuditLogFn({ tenantId, userId: req.auth.user.id, userName: req.auth.user.name, action: "inventory.reset_all", entityType: "inventory", details: {} }); } catch (_) {}
      const data = await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId });
      res.json({ ok: true, data });
    })
  );

  // ── Platform admin routes ──────────────────────────────────────

  app.post(
    "/api/platform/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const { email, password } = req.body || {};
      const admin = await authenticatePlatformAdmin(email, password);
      if (!admin) {
        res.status(401).json({ ok: false, message: "Email atau password tidak valid." });
        return;
      }
      const token = signJwtFn({ sub: admin.id, role: 'platform_admin', email: admin.email });
      res.json({ ok: true, token, admin });
    })
  );

  app.get(
    "/api/platform/me",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const admin = await getPlatformAdminByIdFn(req.auth.payload.sub);
      if (!admin) {
        res.status(401).json({ ok: false, message: "Admin tidak ditemukan." });
        return;
      }
      res.json({ ok: true, admin });
    })
  );

  app.get(
    "/api/platform/tenants",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const tenants = await listTenants();
      res.json({ ok: true, tenants });
    })
  );

  app.get(
    "/api/platform/stats",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const stats = await getPlatformStatsFn();
      res.json({ ok: true, ...stats });
    })
  );

  app.get(
    "/api/platform/tenants/:id",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const detail = await getTenantDetailFn(req.params.id);
      if (!detail) {
        res.status(404).json({ ok: false, message: "Tenant tidak ditemukan." });
        return;
      }
      res.json({ ok: true, ...detail });
    })
  );

  app.patch(
    "/api/platform/tenants/:id",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const result = await updateTenantRecord(req.params.id, req.body);
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const detail = await getTenantDetailFn(req.params.id);
      res.json({ ok: true, ...detail });
    })
  );

  // Platform: create tenant
  app.post(
    "/api/platform/tenants",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const { businessName, slug, email, password, ownerName, plan, trialDays } = req.body || {};
      if (!businessName || !slug || !email || !password) {
        res.status(400).json({ ok: false, message: "Nama bisnis, slug, email, dan password wajib diisi." });
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ ok: false, message: passwordError });
        return;
      }
      const result = await createTenant({
        name: businessName,
        slug,
        email,
        password,
        ownerName: ownerName || businessName,
        ownerUsername: email.split('@')[0],
        trialDays: plan === 'trial' ? (parseInt(trialDays) || 14) : undefined,
      });
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      // If plan specified (not trial), update it with subscription dates
      if (plan && plan !== 'trial') {
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

        await updateTenantRecord(result.tenantId, {
          plan,
          status: 'active',
          subscriptionStartsAt: now.toISOString(),
          subscriptionEndsAt: oneYearLater.toISOString(),
        });
      }
      const tenants = await listTenants();
      res.json({ ok: true, tenants, tenantId: result.tenantId });
    })
  );

  // Platform: update a tenant's user (reset password, change role, etc.)
  app.patch(
    "/api/platform/tenants/:tenantId/users/:userId",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const result = await updateUserRecordFn(req.params.userId, req.body, req.params.tenantId);
      if (result && !result.ok) {
        res.status(400).json(result);
        return;
      }
      const detail = await getTenantDetailFn(req.params.tenantId);
      res.json({ ok: true, ...detail });
    })
  );

  app.post(
    "/api/platform/login-as/:tenantId",
    auth,
    requirePlatformAdmin,
    asyncHandler(async (req, res) => {
      const adminUser = await getTenantAdminUserFn(req.params.tenantId);
      if (!adminUser) {
        res.status(404).json({ ok: false, message: "Admin user tidak ditemukan untuk tenant ini." });
        return;
      }
      // Issue a token as if this admin user logged in
      const token = signJwtFn({
        sub: adminUser.id,
        role: adminUser.role,
        username: adminUser.username,
        tenantId: adminUser.tenantId,
      });
      res.json({ ok: true, token, user: adminUser });
    })
  );

  // ── Global error handler with production sanitization ──────────
  app.use((error, _req, res, _next) => {
    console.error("Unhandled error:", error);
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      ok: false,
      message: isDev ? (error.message || "Internal server error.") : "Terjadi kesalahan pada server.",
    });
  });

  return app;
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  await initializeDatabase();

  const app = createApp();
  app.listen(port, () => {
    console.log(`POS API listening on http://localhost:${port}`);
  });
}
