import test from "node:test";
import assert from "node:assert/strict";

import { buildInventoryWorkspaceSummary, getInventoryStatusLabel } from "../src/features/inventory/inventoryWorkspace.js";

test("getInventoryStatusLabel marks low stock clearly", () => {
  assert.deepEqual(getInventoryStatusLabel({ quantityOnHand: 2, lowStockThreshold: 3 }), {
    tone: "warning",
    label: "Low",
  });
});

test("getInventoryStatusLabel marks healthy stock as stable", () => {
  assert.deepEqual(getInventoryStatusLabel({ quantityOnHand: 8, lowStockThreshold: 3 }), {
    tone: "stable",
    label: "Healthy",
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
