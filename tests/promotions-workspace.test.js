import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPromotionMetrics,
  buildPromotionRows,
  buildPromotionsCsv,
  buildPromotionTypeLabel,
  filterPromotionRows,
  getPromotionStatus,
  paginatePromotionRows,
  sortPromotionRows,
} from "../src/features/promotions/promotionsWorkspace.js";

test("getPromotionStatus returns scheduled before start", () => {
  const result = getPromotionStatus(
    { isActive: true, startAt: "2026-04-05T00:00:00.000Z", endAt: "2026-04-06T00:00:00.000Z" },
    new Date("2026-04-02T00:00:00.000Z")
  );

  assert.deepEqual(result, { tone: "scheduled", label: "Scheduled" });
});

test("getPromotionStatus returns ended when inactive or past end", () => {
  const result = getPromotionStatus(
    { isActive: true, startAt: "2026-04-01T00:00:00.000Z", endAt: "2026-04-02T00:00:00.000Z" },
    new Date("2026-04-03T00:00:00.000Z")
  );

  assert.deepEqual(result, { tone: "ended", label: "Ended" });
});

test("buildPromotionTypeLabel formats percentage and fixed promos", () => {
  assert.equal(buildPromotionTypeLabel({ type: "percentage", value: 15 }), "15% Off Order");
  assert.equal(buildPromotionTypeLabel({ type: "fixed", value: 50000 }), "Rp 50.000 Off");
});

test("buildPromotionMetrics derives active scheduled and usage totals", () => {
  const result = buildPromotionMetrics(
    [
      { code: "A", isActive: true, startAt: "2026-04-01T00:00:00.000Z", endAt: "2026-04-30T00:00:00.000Z" },
      { code: "B", isActive: true, startAt: "2026-04-10T00:00:00.000Z", endAt: "2026-04-20T00:00:00.000Z" },
    ],
    [
      {
        createdAt: "2026-04-02T05:00:00.000Z",
        promotion: { codeSnapshot: "A", discountAmount: 25000 },
      },
    ],
    new Date("2026-04-02T10:00:00.000Z")
  );

  assert.deepEqual(result, {
    activeCount: 1,
    scheduledCount: 1,
    totalDiscounts: 25000,
    promoUsedToday: 1,
  });
});

test("buildPromotionRows maps usage and status", () => {
  const rows = buildPromotionRows(
    [{ code: "A", type: "percentage", value: 15, isActive: true, startAt: "2026-04-01", endAt: "2026-04-30" }],
    [{ promotion: { codeSnapshot: "A", discountAmount: 10000 } }],
    new Date("2026-04-02")
  );

  assert.equal(rows[0].usageCount, 1);
  assert.equal(rows[0].totalDiscount, 10000);
  assert.equal(rows[0].status.tone, "active");
});

test("filterPromotionRows filters by query and status", () => {
  const result = filterPromotionRows(
    [
      { code: "WEEKEND15", type: "percentage", typeLabel: "15% Off Order", status: { tone: "active" } },
      { code: "FLASH50", type: "fixed", typeLabel: "Rp 50.000 Off", status: { tone: "ended" } },
    ],
    { query: "weekend", status: "active" }
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].code, "WEEKEND15");
});

test("sortPromotionRows supports usage sort", () => {
  const result = sortPromotionRows(
    [
      { code: "B", usageCount: 2, status: { tone: "active" }, createdAt: "2026-04-01" },
      { code: "A", usageCount: 5, status: { tone: "scheduled" }, createdAt: "2026-04-02" },
    ],
    "usage"
  );

  assert.deepEqual(result.map((item) => item.code), ["A", "B"]);
});

test("paginatePromotionRows returns current slice", () => {
  const result = paginatePromotionRows([{ id: "1" }, { id: "2" }, { id: "3" }], { page: 2, pageSize: 2 });
  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
  assert.deepEqual(result.items, [{ id: "3" }]);
});

test("buildPromotionsCsv outputs quoted rows", () => {
  const csv = buildPromotionsCsv([
    {
      code: "WEEKEND15",
      typeLabel: "15% Off Order",
      status: { label: "Active" },
      usageCount: 3,
      startAt: "2026-04-01",
      endAt: "2026-04-30",
    },
  ]);

  assert.match(csv, /"Code","Type","Status","Usage Count","Start","End"/);
  assert.match(csv, /"WEEKEND15","15% Off Order","Active","3","2026-04-01","2026-04-30"/);
});
