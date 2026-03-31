import test from "node:test";
import assert from "node:assert/strict";

import { buildReceiptTitle, filterSales, paginateSales } from "../src/features/sales/salesHelpers.js";

const sales = [
  {
    id: "sale-1",
    receiptNumber: "POS-20260330-1",
    cashierUser: "Salsa Dewi",
    paymentMethod: "card",
    grandTotal: 556200,
    createdAt: "2026-03-30T08:12:00.000Z",
    items: [
      {
        productNameSnapshot: "Aster Overshirt",
        skuSnapshot: "AST-BLK-M",
      },
    ],
  },
  {
    id: "sale-2",
    receiptNumber: "POS-20260329-8",
    cashierUser: "Alya Rahman",
    paymentMethod: "cash",
    grandTotal: 459000,
    createdAt: "2026-03-29T12:42:00.000Z",
    items: [
      {
        productNameSnapshot: "Sora Knit Dress",
        skuSnapshot: "SOR-IVR-S",
      },
    ],
  },
];

test("filterSales matches receipt number, cashier, sku, and payment method", () => {
  const filtered = filterSales(sales, {
    query: "sor-ivr",
    paymentMethod: "cash",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "sale-2");
});

test("paginateSales returns the current slice and page count", () => {
  const result = paginateSales(sales, {
    page: 2,
    pageSize: 1,
  });

  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, "sale-2");
});

test("buildReceiptTitle creates a stable printable title", () => {
  assert.equal(buildReceiptTitle({ receiptNumber: "POS-20260330-1" }), "Receipt POS-20260330-1");
});
