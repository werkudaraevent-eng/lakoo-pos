import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardSummary, buildEventProgress } from "../src/features/events/eventHelpers.js";

test("buildDashboardSummary returns the headline dashboard metrics for the active day", () => {
  const result = buildDashboardSummary({
    sales: [
      {
        createdAt: "2026-03-31T08:00:00.000Z",
        grandTotal: 250000,
        discountTotal: 10000,
      },
      {
        createdAt: "2026-03-31T09:00:00.000Z",
        grandTotal: 350000,
        discountTotal: 0,
      },
      {
        createdAt: "2026-03-30T00:30:00.000Z",
        grandTotal: 125000,
        discountTotal: 5000,
      },
    ],
    variants: [
      { quantityOnHand: 2, lowStockThreshold: 3 },
      { quantityOnHand: 6, lowStockThreshold: 3 },
      { quantityOnHand: 0, lowStockThreshold: 1 },
    ],
    now: "2026-03-31T12:00:00.000Z",
  });

  assert.deepEqual(result, {
    revenue: 600000,
    transactions: 2,
    lowStock: 2,
    discountTotal: 15000,
  });
});

test("buildDashboardSummary tolerates missing arrays and invalid timestamps", () => {
  const result = buildDashboardSummary({
    sales: [{ createdAt: "", grandTotal: 100000, discountTotal: 5000 }],
    variants: null,
    now: "2026-03-31T12:00:00.000Z",
  });

  assert.deepEqual(result, {
    revenue: 0,
    transactions: 0,
    lowStock: 0,
    discountTotal: 5000,
  });
});

test("buildEventProgress returns compact timeline indicators for an active event workspace", () => {
  const result = buildEventProgress({
    workspace: {
      id: "event-gi",
      type: "event",
      status: "active",
      startsAt: "2026-04-01T10:00:00.000Z",
      endsAt: "2026-04-03T10:00:00.000Z",
    },
    now: "2026-04-02T10:00:00.000Z",
  });

  assert.deepEqual(result, {
    phase: "Live now",
    progressPercent: 50,
    elapsedHours: 24,
    remainingHours: 24,
    totalHours: 48,
    isComplete: false,
  });
});

test("buildEventProgress returns null for non-event workspaces or invalid schedules", () => {
  assert.equal(
    buildEventProgress({
      workspace: {
        id: "store-main",
        type: "store",
        status: "active",
      },
      now: "2026-04-02T10:00:00.000Z",
    }),
    null
  );

  assert.equal(
    buildEventProgress({
      workspace: {
        id: "event-gi",
        type: "event",
        status: "active",
        startsAt: "bad-date",
        endsAt: "2026-04-03T10:00:00.000Z",
      },
      now: "2026-04-02T10:00:00.000Z",
    }),
    null
  );
});
