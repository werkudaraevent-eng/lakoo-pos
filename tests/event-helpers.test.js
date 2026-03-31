import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardSummary } from "../src/features/events/eventHelpers.js";

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
