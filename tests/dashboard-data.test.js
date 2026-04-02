import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardCollections } from "../src/features/dashboard/dashboardData.js";

test("buildDashboardCollections keeps dashboard panels scoped to the active day", () => {
  const result = buildDashboardCollections({
    sales: [
      {
        id: "sale-today-1",
        createdAt: "2026-04-02T09:52:00+07:00",
        grandTotal: 578000,
        receiptNumber: "POS-20260402-1",
        cashierUser: "Salsa Dewi",
        items: [{ productNameSnapshot: "Mora Wide Pants", qty: 2, lineTotal: 578000 }],
      },
      {
        id: "sale-prev-1",
        createdAt: "2026-04-01T17:24:00+07:00",
        grandTotal: 605000,
        receiptNumber: "POS-20260401-1",
        cashierUser: "Walk-in",
        items: [{ productNameSnapshot: "Older Item", qty: 1, lineTotal: 605000 }],
      },
    ],
    now: "2026-04-02T10:00:00+07:00",
  });

  assert.equal(result.todaySales.length, 1);
  assert.equal(result.topItems.length, 1);
  assert.equal(result.topItems[0].name, "Mora Wide Pants");
  assert.equal(result.recentSales.length, 1);
  assert.equal(result.recentSales[0].receiptNumber, "POS-20260402-1");
});

test("buildDashboardCollections shifts chart hours so early sales still appear", () => {
  const result = buildDashboardCollections({
    sales: [
      {
        id: "sale-early",
        createdAt: "2026-04-02T09:52:00+07:00",
        grandTotal: 578000,
        items: [],
      },
    ],
    now: "2026-04-02T10:00:00+07:00",
  });

  assert.equal(result.chartBars[0].label, "9 AM");
  assert.equal(result.chartBars[0].value, 578000);
});
