import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDashboardCommandStrip,
  buildDashboardHeroMetrics,
} from "../src/features/dashboard/dashboardWorkspace.js";

test("buildDashboardCommandStrip returns event-aware actions for active workspaces", () => {
  const result = buildDashboardCommandStrip({ id: "event-gi", type: "event", status: "active" });

  assert.deepEqual(result.map((item) => item.label), [
    "Open checkout",
    "View sales",
    "Adjust stock",
    "Close event",
  ]);
});

test("buildDashboardHeroMetrics returns revenue-led executive metrics", () => {
  const result = buildDashboardHeroMetrics({
    revenue: 900000,
    transactions: 3,
    discountTotal: 60000,
  });

  assert.deepEqual(result, {
    primary: {
      label: "Revenue today",
      value: 900000,
      kind: "currency",
      meta: "3 transactions today",
    },
    secondary: [
      {
        label: "Transactions",
        value: 3,
        kind: "count",
        meta: "Completed sales today.",
      },
      {
        label: "Average order value",
        value: 300000,
        kind: "currency",
        meta: "Average basket across finalized sales.",
      },
      {
        label: "Discount total",
        value: 60000,
        kind: "currency",
        meta: "Applied across finalized sales today.",
      },
    ],
  });
});

test("buildDashboardHeroMetrics falls back to zero average order value when there are no transactions", () => {
  const result = buildDashboardHeroMetrics({
    revenue: 0,
    transactions: 0,
    discountTotal: 0,
  });

  assert.equal(result.secondary[1].value, 0);
});

test("buildDashboardHeroMetrics keeps revenue primary even when discount total is zero", () => {
  const result = buildDashboardHeroMetrics({
    revenue: 250000,
    transactions: 1,
    discountTotal: 0,
  });

  assert.deepEqual(result.primary, {
    label: "Revenue today",
    value: 250000,
    kind: "currency",
    meta: "1 transactions today",
  });
});
