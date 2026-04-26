import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCheckoutCategories,
  filterCheckoutVariants,
  formatCheckoutVariantMeta,
  getCheckoutStockState,
} from "../src/features/checkout/checkoutData.js";

const VARIANTS = [
  {
    id: "v1",
    productName: "Basic Oversized T-Shirt",
    sku: "TEE-BLK-M",
    attribute1Value: "M",
    attribute2Value: "Black",
    category: "T-Shirts",
    productActive: true,
    isActive: true,
  },
  {
    id: "v2",
    productName: "Classic Denim Jacket",
    sku: "OUT-DNM-L",
    attribute1Value: "L",
    attribute2Value: "Blue",
    category: "Outerwear",
    productActive: true,
    isActive: true,
  },
  {
    id: "v3",
    productName: "Canvas Tote Bag",
    sku: "ACC-TOTE-01",
    attribute1Value: "-",
    attribute2Value: "Cream",
    category: "Accessories",
    productActive: true,
    isActive: true,
  },
];

test("buildCheckoutCategories returns All Items first followed by sorted unique categories", () => {
  const result = buildCheckoutCategories(VARIANTS);

  assert.deepEqual(result, ["All Items", "Accessories", "Outerwear", "T-Shirts"]);
});

test("filterCheckoutVariants filters by active category and search query", () => {
  const result = filterCheckoutVariants({
    variants: VARIANTS,
    category: "T-Shirts",
    query: "blk",
  });

  assert.deepEqual(result.map((item) => item.id), ["v1"]);
});

test("filterCheckoutVariants ignores inactive products and variants", () => {
  const result = filterCheckoutVariants({
    variants: [
      ...VARIANTS,
      { ...VARIANTS[0], id: "v4", productActive: false },
      { ...VARIANTS[0], id: "v5", isActive: false },
    ],
    category: "All Items",
    query: "",
  });

  assert.deepEqual(result.map((item) => item.id), ["v1", "v2", "v3"]);
});

test("formatCheckoutVariantMeta prefers attribute values, then falls back to category", () => {
  assert.equal(formatCheckoutVariantMeta(VARIANTS[0]), "M / Black");
  assert.equal(formatCheckoutVariantMeta({ ...VARIANTS[2], attribute1Value: "-", attribute2Value: "" }), "Accessories");
});

test("getCheckoutStockState returns appropriate labels and tones", () => {
  assert.deepEqual(getCheckoutStockState(0), { label: "Out of stock", tone: "out" });
  assert.deepEqual(getCheckoutStockState(2), { label: "2 left", tone: "low" });
  assert.deepEqual(getCheckoutStockState(12), { label: "12 in stock", tone: "ready" });
});
