import "dotenv/config";

import express from "express";
import { pathToFileURL } from "node:url";

import { requireAuth, requireRole, signJwt } from "./auth.js";
import {
  adjustInventoryRecord,
  authenticateUser,
  authenticatePlatformAdmin,
  checkTenantStatus,
  closeEventRecord,
  createEventRecord,
  createProductRecord,
  createPromotionRecord,
  createTenant,
  createUserRecord,
  createVariantRecord,
  finalizeSaleRecord,
  getBootstrap,
  getPlanLimits,
  getTenantById,
  getTenantUsage,
  getUserById,
  initializeDatabase,
  listTenants,
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

export function createApp({
  adjustInventoryRecordFn = adjustInventoryRecord,
  authenticateUserFn = authenticateUser,
  closeEventRecordFn = closeEventRecord,
  createEventRecordFn = createEventRecord,
  createProductRecordFn = createProductRecord,
  createPromotionRecordFn = createPromotionRecord,
  createUserRecordFn = createUserRecord,
  createVariantRecordFn = createVariantRecord,
  finalizeSaleRecordFn = finalizeSaleRecord,
  getBootstrapFn = getBootstrap,
  getUserByIdFn = getUserById,
  requireAuthFn = requireAuth,
  requireRoleMiddleware = requireRole,
  signJwtFn = signJwt,
  updateEventStatusRecordFn = updateEventStatusRecord,
  updateProductRecordFn = updateProductRecord,
  updateSettingsRecordFn = updateSettingsRecord,
  updateUserRecordFn = updateUserRecord,
  updateVariantRecordFn = updateVariantRecord,
  authMiddleware = null,
} = {}) {
  const app = express();
  const auth = authMiddleware ?? requireAuthFn(getUserByIdFn);

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post(
    "/api/auth/login",
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

      res.json({ ok: true, token, user: { ...user, tenant: user.tenant } });
    })
  );

  // Registration (create new tenant + admin user)
  app.post(
    "/api/auth/register",
    asyncHandler(async (req, res) => {
      const { businessName, slug, email, password, ownerName } = req.body || {};

      if (!businessName || !slug || !email || !password) {
        res.status(400).json({ ok: false, message: "Semua field wajib diisi." });
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
      const result = await createEventRecordFn(req.body, req.auth.user.id, tenantId);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

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
      const result = await updateEventStatusRecordFn(req.params.id, req.body, req.auth.user.id);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

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
      const result = await closeEventRecordFn(req.params.id, req.body, req.auth.user.id);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.json({
        ok: true,
        eventId: result.eventId,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req), tenantId }),
      });
    })
  );

  app.post(
    "/api/promotions",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await createPromotionRecordFn(req.body, req.auth.user.id, tenantId);
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
      res.json({ ok: true, sale, data });
    })
  );

  app.put(
    "/api/settings",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      await updateSettingsRecordFn(req.body, tenantId);
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
      await createUserRecordFn(req.body, tenantId);
      res.json({
        ok: true,
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
      const result = await updateUserRecordFn(req.params.id, req.body, tenantId);

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

  app.post(
    "/api/products",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const tenantId = req.auth.user.tenantId;
      const result = await createProductRecordFn(req.body, tenantId);

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

  // ── Platform admin routes ──────────────────────────────────────

  app.post(
    "/api/platform/login",
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
    "/api/platform/tenants",
    auth,
    asyncHandler(async (req, res) => {
      if (req.auth.payload.role !== 'platform_admin') {
        res.status(403).json({ ok: false, message: "Forbidden." });
        return;
      }
      const tenants = await listTenants();
      res.json({ ok: true, tenants });
    })
  );

  app.patch(
    "/api/platform/tenants/:id",
    auth,
    asyncHandler(async (req, res) => {
      if (req.auth.payload.role !== 'platform_admin') {
        res.status(403).json({ ok: false, message: "Forbidden." });
        return;
      }
      const result = await updateTenantRecord(req.params.id, req.body);
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      const tenants = await listTenants();
      res.json({ ok: true, tenants });
    })
  );

  app.use((error, _req, res, _next) => {
    res.status(500).json({
      ok: false,
      message: error.message || "Internal server error.",
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
