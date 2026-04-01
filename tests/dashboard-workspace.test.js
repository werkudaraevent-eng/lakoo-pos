import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardCommandStrip, buildDashboardKpiBand } from "../src/features/dashboard/dashboardWorkspace.js";

test("buildDashboardCommandStrip returns event-aware actions for active workspaces", () => {
  const result = buildDashboardCommandStrip({ type: "event", status: "active" });

  assert.deepEqual(result.map((item) => item.label), [
    "Open checkout",
    "View sales",
    "Adjust stock",
    "Close event",
  ]);
});

test("buildDashboardKpiBand formats compact dashboard metrics", () => {
  const result = buildDashboardKpiBand({
    revenue: 120000,
    transactions: 4,
    lowStock: 2,
    discountTotal: 30000,
  });

  assert.deepEqual(result, [
    { label: "Revenue today", value: 120000, kind: "currency", meta: "Discounts recorded: 30000" },
    { label: "Transactions", value: 4, kind: "count", meta: "Completed sales for the current day." },
    { label: "Low-stock variants", value: 2, kind: "count", meta: "Restock attention needed now." },
  ]);
});
