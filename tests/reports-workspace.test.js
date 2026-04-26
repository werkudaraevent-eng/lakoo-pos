import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRecentTransactions,
  buildReportsCsv,
  buildReportsSummary,
  buildSalesOverTime,
  buildTopCategories,
  filterSalesByPeriod,
} from "../src/features/reports/reportsWorkspace.js";

test("filterSalesByPeriod keeps only last 7 days by default", () => {
  const result = filterSalesByPeriod(
    [
      { createdAt: "2026-04-02T10:00:00.000Z" },
      { createdAt: "2026-03-20T10:00:00.000Z" },
    ],
    "7d",
    new Date("2026-04-02T12:00:00.000Z")
  );

  assert.equal(result.length, 1);
});

test("buildReportsSummary derives key KPI values", () => {
  const result = buildReportsSummary([
    { subtotal: 100000, grandTotal: 90000, items: [{ qty: 2 }, { qty: 1 }] },
    { subtotal: 200000, grandTotal: 180000, items: [{ qty: 1 }] },
  ]);

  assert.deepEqual(result, {
    grossSales: 300000,
    totalOrders: 2,
    avgOrderValue: 135000,
    itemsSold: 4,
  });
});

test("buildSalesOverTime creates day buckets with ratios", () => {
  const result = buildSalesOverTime(
    [
      { createdAt: "2026-04-01T10:00:00.000Z", grandTotal: 100000 },
      { createdAt: "2026-04-02T10:00:00.000Z", grandTotal: 200000 },
    ],
    "7d",
    new Date("2026-04-02T12:00:00.000Z")
  );

  assert.equal(result.length, 7);
  assert.equal(result.reduce((sum, bucket) => sum + bucket.total, 0), 300000);
  assert.equal(Math.max(...result.map((bucket) => bucket.heightRatio)), 1);
});

test("buildTopCategories aggregates category totals", () => {
  const result = buildTopCategories(
    [{ items: [{ variantId: "v1", lineTotal: 100000 }, { variantId: "v2", lineTotal: 50000 }] }],
    [
      { category: "Shirts", variants: [{ id: "v1" }] },
      { category: "Pants", variants: [{ id: "v2" }] },
    ]
  );

  assert.deepEqual(result.map((item) => item.label), ["Shirts", "Pants"]);
});

test("buildRecentTransactions returns recent mapped rows", () => {
  const result = buildRecentTransactions([
    {
      id: "s-1",
      receiptNumber: "POS-1",
      createdAt: "2026-04-02T10:00:00.000Z",
      grandTotal: 120000,
      items: [{ qty: 2 }],
    },
  ]);

  assert.equal(result[0].customer, "Walk-in");
  assert.equal(result[0].items, 2);
  assert.equal(result[0].status, "Completed");
});

test("buildReportsCsv returns quoted rows", () => {
  const csv = buildReportsCsv([
    {
      id: "s-1",
      receiptNumber: "POS-1",
      createdAt: "2026-04-02T10:00:00.000Z",
      grandTotal: 120000,
      items: [{ qty: 2 }],
    },
  ]);

  assert.match(csv, /"Receipt","Created At","Items","Status","Total"/);
  assert.match(csv, /"POS-1"/);
});
