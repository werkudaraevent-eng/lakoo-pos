import "dotenv/config";

import express from "express";

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

await initializeDatabase();

const app = express();
const port = Number(process.env.PORT || 3001);
const auth = requireAuth(getUserById);

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    const user = await authenticateUser(username, password);

    if (!user) {
      res.status(401).json({ ok: false, message: "Username atau password tidak valid." });
      return;
    }

    const token = signJwt({
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
      data: await getBootstrap({
        workspaceId: req.query.workspaceId || null,
      }),
    });
  })
);

app.post(
  "/api/promotions",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    await createPromotionRecord(req.body, req.auth.user.id);
    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.post(
  "/api/inventory/movements",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await adjustInventoryRecord(req.body, req.auth.user.id);

    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.post(
  "/api/sales",
  auth,
  asyncHandler(async (req, res) => {
    const result = await finalizeSaleRecord(req.body, req.auth.user.id);

    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    const data = await getBootstrap();
    const sale = data.sales.find((item) => item.id === result.saleId) ?? null;
    res.json({ ok: true, sale, data });
  })
);

app.put(
  "/api/settings",
  auth,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    await updateSettingsRecord(req.body);
    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.post(
  "/api/users",
  auth,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    await createUserRecord(req.body);
    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.patch(
  "/api/users/:id",
  auth,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    const result = await updateUserRecord(req.params.id, req.body);

    if (!result.ok) {
      res.status(404).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.post(
  "/api/products",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await createProductRecord(req.body);

    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.patch(
  "/api/products/:id",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await updateProductRecord(req.params.id, req.body);

    if (!result.ok) {
      res.status(404).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.post(
  "/api/products/:id/variants",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await createVariantRecord(req.params.id, req.body);

    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.patch(
  "/api/variants/:id",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await updateVariantRecord(req.params.id, req.body);

    if (!result.ok) {
      res.status(404).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap() });
  })
);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    ok: false,
    message: error.message || "Internal server error.",
  });
});

app.listen(port, () => {
  console.log(`POS API listening on http://localhost:${port}`);
});
