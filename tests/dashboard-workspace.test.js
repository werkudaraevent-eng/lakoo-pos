import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDashboardCommandStrip,
  buildDashboardKpiCards,
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

test("buildDashboardKpiCards returns the Banani-style KPI cards", () => {
  const result = buildDashboardKpiCards({
    revenue: 900000,
    transactions: 3,
    itemsSold: 7,
  });

  assert.deepEqual(result, [
    {
      label: "Gross revenue",
      value: 900000,
      kind: "currency",
      tone: "up",
      meta: "3 transactions today",
    },
    {
      label: "Transactions",
      value: 3,
      kind: "count",
      tone: "up",
      meta: "Completed sales today.",
    },
    {
      label: "Average order value",
      value: 300000,
      kind: "currency",
      tone: "down",
      meta: "Average basket size.",
    },
    {
      label: "Items sold",
      value: 7,
      kind: "count",
      tone: "up",
      meta: "Units sold today.",
    },
  ]);
});

test("buildDashboardKpiCards falls back to zero average order value when there are no transactions", () => {
  const result = buildDashboardKpiCards({
    revenue: 0,
    transactions: 0,
    itemsSold: 0,
  });

  assert.equal(result[2].value, 0);
});

test("buildDashboardKpiCards keeps gross revenue first when there is one transaction", () => {
  const result = buildDashboardKpiCards({
    revenue: 250000,
    transactions: 1,
    itemsSold: 2,
  });

  assert.deepEqual(result[0], {
    label: "Gross revenue",
    value: 250000,
    kind: "currency",
    tone: "up",
    meta: "1 transactions today",
  });
});
