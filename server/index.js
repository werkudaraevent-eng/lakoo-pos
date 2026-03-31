import "dotenv/config";

import express from "express";
import { pathToFileURL } from "node:url";

import { requireAuth, requireRole, signJwt } from "./auth.js";
import {
  adjustInventoryRecord,
  authenticateUser,
  createProductRecord,
  createPromotionRecord,
  createUserRecord,
  createVariantRecord,
  finalizeSaleRecord,
  getBootstrap,
  getUserById,
  initializeDatabase,
  updateProductRecord,
  updateSettingsRecord,
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
      const { username, password } = req.body || {};
      const user = await authenticateUserFn(username, password);

      if (!user) {
        res.status(401).json({ ok: false, message: "Username atau password tidak valid." });
        return;
      }

      const token = signJwtFn({
        sub: user.id,
        role: user.role,
        username: user.username,
      });

      res.json({ ok: true, token, user });
    })
  );

  app.get(
    "/api/auth/me",
    auth,
    asyncHandler(async (req, res) => {
      res.json({ ok: true, user: req.auth.user });
    })
  );

  app.get(
    "/api/bootstrap",
    auth,
    asyncHandler(async (req, res) => {
      res.json({
        ok: true,
        data: await getBootstrapFn({
          workspaceId: req.query.workspaceId || null,
        }),
      });
    })
  );

  app.post(
    "/api/promotions",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      await createPromotionRecordFn(req.body, req.auth.user.id);
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.post(
    "/api/inventory/movements",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const requestWorkspaceId = getRequestWorkspaceId(req);
      const result = await adjustInventoryRecordFn(
        withRequestWorkspace(req.body, requestWorkspaceId),
        req.auth.user.id
      );

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({
          workspaceId: getRequestWorkspaceId(req, result.workspaceId ?? null),
        }),
      });
    })
  );

  app.post(
    "/api/sales",
    auth,
    asyncHandler(async (req, res) => {
      const requestWorkspaceId = getRequestWorkspaceId(req);
      const result = await finalizeSaleRecordFn(withRequestWorkspace(req.body, requestWorkspaceId), req.auth.user.id);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      const data = await getBootstrapFn({
        workspaceId: getRequestWorkspaceId(req, result.workspaceId ?? null),
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
      await updateSettingsRecordFn(req.body);
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.post(
    "/api/users",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      await createUserRecordFn(req.body);
      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.patch(
    "/api/users/:id",
    auth,
    requireRoleMiddleware(["admin"]),
    asyncHandler(async (req, res) => {
      const result = await updateUserRecordFn(req.params.id, req.body);

      if (!result.ok) {
        res.status(404).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.post(
    "/api/products",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const result = await createProductRecordFn(req.body);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.patch(
    "/api/products/:id",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const result = await updateProductRecordFn(req.params.id, req.body);

      if (!result.ok) {
        res.status(404).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.post(
    "/api/products/:id/variants",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const result = await createVariantRecordFn(req.params.id, req.body);

      if (!result.ok) {
        res.status(400).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
    })
  );

  app.patch(
    "/api/variants/:id",
    auth,
    requireRoleMiddleware(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const result = await updateVariantRecordFn(req.params.id, req.body);

      if (!result.ok) {
        res.status(404).json(result);
        return;
      }

      res.json({
        ok: true,
        data: await getBootstrapFn({ workspaceId: getRequestWorkspaceId(req) }),
      });
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
