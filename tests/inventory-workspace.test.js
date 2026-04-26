import test from "node:test";
import assert from "node:assert/strict";

import {
  buildInventoryCsv,
  buildInventoryProductRows,
  buildInventoryWorkspaceSummary,
  filterInventoryProductRows,
  getInventoryStatusLabel,
  paginateInventoryRows,
} from "../src/features/inventory/inventoryWorkspace.js";

test("getInventoryStatusLabel marks low stock clearly", () => {
  assert.deepEqual(getInventoryStatusLabel({ quantityOnHand: 2, lowStockThreshold: 3 }), {
    tone: "warning",
    label: "Low stock",
  });
});

test("getInventoryStatusLabel marks healthy stock as stable", () => {
  assert.deepEqual(getInventoryStatusLabel({ quantityOnHand: 8, lowStockThreshold: 3 }), {
    tone: "stable",
    label: "In stock",
  });
});

test("getInventoryStatusLabel marks zero stock as empty", () => {
  assert.deepEqual(getInventoryStatusLabel({ quantityOnHand: 0, lowStockThreshold: 3 }), {
    tone: "none",
    label: "Out of stock",
  });
});

test("buildInventoryWorkspaceSummary returns stock counts for the toolbar", () => {
  const result = buildInventoryWorkspaceSummary({
    variants: [
      { quantityOnHand: 2, lowStockThreshold: 3 },
      { quantityOnHand: 5, lowStockThreshold: 3 },
      { quantityOnHand: 0, lowStockThreshold: 2 },
    ],
  });

  assert.deepEqual(result, {
    totalVariants: 3,
    lowStockCount: 2,
    totalOnHand: 7,
  });
});

test("buildInventoryProductRows aggregates product inventory for active workspace", () => {
  const rows = buildInventoryProductRows(
    [
      {
        id: "p-1",
        name: "Aster Overshirt",
        category: "Shirts",
        description: "Cotton",
        variants: [
          { sku: "AST-BLK-M", quantityOnHand: 2, lowStockThreshold: 3, isActive: true },
          { sku: "AST-BLK-L", quantityOnHand: 4, lowStockThreshold: 2, isActive: true },
        ],
      },
    ],
    { activeWorkspace: { type: "event", name: "Bazar GI" } }
  );

  assert.deepEqual(rows[0], {
    id: "p-1",
    name: "Aster Overshirt",
    category: "Shirts",
    description: "Cotton",
    totalStock: 6,
    warehouseStock: null,
    workspaceStock: 6,
    workspaceLabel: "Bazar GI",
    lowThreshold: 5,
    status: { tone: "warning", label: "Low stock" },
    variants: 2,
    sku: "AST-BLK-M",
  });
});

test("filterInventoryProductRows matches query category and status", () => {
  const rows = [
    {
      name: "Aster Overshirt",
      category: "Shirts",
      description: "Cotton",
      variants: [{ sku: "AST-BLK-M", attribute1Value: "M", attribute2Value: "Black" }],
      status: { tone: "warning", label: "Low stock" },
    },
    {
      name: "Mora Wide Pants",
      category: "Pants",
      description: "Wide",
      variants: [{ sku: "MOR-NVY-M", attribute1Value: "M", attribute2Value: "Navy" }],
      status: { tone: "stable", label: "In stock" },
    },
  ];

  const result = filterInventoryProductRows(rows, { query: "navy", category: "Pants", status: "stable" });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Mora Wide Pants");
});

test("paginateInventoryRows returns the correct slice", () => {
  const result = paginateInventoryRows([{ id: "1" }, { id: "2" }, { id: "3" }], { page: 2, pageSize: 2 });
  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
  assert.deepEqual(result.items, [{ id: "3" }]);
});

test("buildInventoryCsv returns quoted rows", () => {
  const csv = buildInventoryCsv([
    {
      name: "Aster Overshirt",
      category: "Shirts",
      totalStock: 6,
      warehouseStock: 2,
      workspaceStock: 4,
      status: { label: "Low stock" },
    },
  ]);

  assert.match(csv, /"Product","Category","Total Stock","Warehouse","Workspace","Status"/);
  assert.match(csv, /"Aster Overshirt","Shirts","6","2","4","Low stock"/);
});
