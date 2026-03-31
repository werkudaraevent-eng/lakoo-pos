import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import { createApp } from "../server/index.js";

function createAuthMiddleware(user = { id: "u-manager", role: "manager", isActive: true }) {
  return (req, _res, next) => {
    req.auth = { user };
    next();
  };
}

async function withServer(app, run) {
  const server = app.listen(0);
  await once(server, "listening");

  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("POST /api/sales uses the request workspace for writes and bootstrap reads when the body omits workspaceId", async () => {
  let capturedPayload = null;
  let bootstrapWorkspaceId = null;

  const app = createApp({
    authMiddleware: createAuthMiddleware({ id: "u-cashier", role: "cashier", isActive: true }),
    finalizeSaleRecordFn: async (payload) => {
      capturedPayload = payload;
      return {
        ok: true,
        saleId: "sale-event-1",
        workspaceId: payload.workspaceId ?? null,
      };
    },
    getBootstrapFn: async ({ workspaceId }) => {
      bootstrapWorkspaceId = workspaceId;
      return {
        sales: [{ id: "sale-event-1" }],
        inventoryMovements: [],
      };
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/sales?workspaceId=event-gi`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cart: [{ variantId: "variant-1", qty: 1, price: 199000 }],
        paymentMethod: "cash",
      }),
    });

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.sale?.id, "sale-event-1");
  });

  assert.equal(capturedPayload?.workspaceId, "event-gi");
  assert.equal(bootstrapWorkspaceId, "event-gi");
});

test("POST /api/inventory/movements uses the request workspace for writes and bootstrap reads when the body omits workspaceId", async () => {
  let capturedPayload = null;
  let bootstrapWorkspaceId = null;

  const app = createApp({
    authMiddleware: createAuthMiddleware(),
    requireRoleMiddleware: () => (_req, _res, next) => next(),
    adjustInventoryRecordFn: async (payload) => {
      capturedPayload = payload;
      return {
        ok: true,
        workspaceId: payload.workspaceId ?? null,
      };
    },
    getBootstrapFn: async ({ workspaceId }) => {
      bootstrapWorkspaceId = workspaceId;
      return {
        sales: [],
        inventoryMovements: [{ id: "mov-event-1" }],
      };
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/inventory/movements?workspaceId=event-gi`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        variantId: "variant-1",
        quantity: 2,
        mode: "restock",
        note: "Event top up",
      }),
    });

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.data.inventoryMovements, [{ id: "mov-event-1" }]);
  });

  assert.equal(capturedPayload?.workspaceId, "event-gi");
  assert.equal(bootstrapWorkspaceId, "event-gi");
});
