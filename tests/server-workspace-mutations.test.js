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

test("POST /api/events creates a draft event and returns refreshed bootstrap data", async () => {
  let capturedPayload = null;
  let capturedActorId = null;

  const app = createApp({
    authMiddleware: createAuthMiddleware({ id: "u-admin", role: "admin", isActive: true }),
    requireRoleMiddleware: () => (_req, _res, next) => next(),
    createEventRecordFn: async (payload, actorUserId) => {
      capturedPayload = payload;
      capturedActorId = actorUserId;
      return {
        ok: true,
        eventId: "workspace-event-2",
      };
    },
    getBootstrapFn: async () => ({
      workspaces: [{ id: "workspace-event-2", name: "Bazar PIK", status: "draft" }],
    }),
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Bazar PIK",
        code: "PIK-APR",
        locationLabel: "PIK Avenue",
        startsAt: "2026-04-05T08:00:00.000Z",
        endsAt: "2026-04-07T15:00:00.000Z",
        stockMode: "allocate",
        assignedUserIds: ["u-manager", "u-cashier"],
      }),
    });

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.eventId, "workspace-event-2");
    assert.deepEqual(body.data.workspaces, [{ id: "workspace-event-2", name: "Bazar PIK", status: "draft" }]);
  });

  assert.deepEqual(capturedPayload, {
    name: "Bazar PIK",
    code: "PIK-APR",
    locationLabel: "PIK Avenue",
    startsAt: "2026-04-05T08:00:00.000Z",
    endsAt: "2026-04-07T15:00:00.000Z",
    stockMode: "allocate",
    assignedUserIds: ["u-manager", "u-cashier"],
  });
  assert.equal(capturedActorId, "u-admin");
});

test("PATCH /api/events/:id/status updates event status and returns refreshed bootstrap data", async () => {
  let capturedEventId = null;
  let capturedPayload = null;
  let capturedActorId = null;

  const app = createApp({
    authMiddleware: createAuthMiddleware({ id: "u-manager", role: "manager", isActive: true }),
    requireRoleMiddleware: () => (_req, _res, next) => next(),
    updateEventStatusRecordFn: async (eventId, payload, actorUserId) => {
      capturedEventId = eventId;
      capturedPayload = payload;
      capturedActorId = actorUserId;
      return {
        ok: true,
        eventId,
        nextStatus: payload.nextStatus,
      };
    },
    getBootstrapFn: async () => ({
      workspaces: [{ id: "workspace-event-2", status: "active" }],
    }),
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/events/workspace-event-2/status`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nextStatus: "active",
      }),
    });

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.eventId, "workspace-event-2");
    assert.equal(body.nextStatus, "active");
    assert.deepEqual(body.data.workspaces, [{ id: "workspace-event-2", status: "active" }]);
  });

  assert.equal(capturedEventId, "workspace-event-2");
  assert.deepEqual(capturedPayload, { nextStatus: "active" });
  assert.equal(capturedActorId, "u-manager");
});

test("POST /api/events/:id/close validates closing review and returns refreshed bootstrap data", async () => {
  let capturedEventId = null;
  let capturedPayload = null;
  let capturedActorId = null;

  const app = createApp({
    authMiddleware: createAuthMiddleware({ id: "u-manager", role: "manager", isActive: true }),
    requireRoleMiddleware: () => (_req, _res, next) => next(),
    closeEventRecordFn: async (eventId, payload, actorUserId) => {
      capturedEventId = eventId;
      capturedPayload = payload;
      capturedActorId = actorUserId;
      return {
        ok: true,
        eventId,
      };
    },
    getBootstrapFn: async () => ({
      workspaces: [{ id: "workspace-event-2", status: "closed" }],
    }),
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/events/workspace-event-2/close`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        salesReviewed: true,
        stockReviewed: true,
        paymentReviewed: true,
      }),
    });

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.eventId, "workspace-event-2");
    assert.deepEqual(body.data.workspaces, [{ id: "workspace-event-2", status: "closed" }]);
  });

  assert.equal(capturedEventId, "workspace-event-2");
  assert.deepEqual(capturedPayload, {
    salesReviewed: true,
    stockReviewed: true,
    paymentReviewed: true,
  });
  assert.equal(capturedActorId, "u-manager");
});
