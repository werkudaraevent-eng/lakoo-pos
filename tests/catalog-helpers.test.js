import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyProductDraft,
  createEmptyVariantDraft,
  normalizeProductPayload,
  normalizeVariantPayload,
} from "../src/features/catalog/catalogHelpers.js";

test("createEmptyProductDraft returns the default product form state", () => {
  assert.deepEqual(createEmptyProductDraft(), {
    name: "",
    category: "",
    description: "",
    basePrice: "",
    isActive: true,
  });
});

test("createEmptyVariantDraft returns the default variant form state", () => {
  assert.deepEqual(createEmptyVariantDraft(), {
    sku: "",
    size: "",
    color: "",
    priceOverride: "",
    quantityOnHand: "",
    lowStockThreshold: "",
    isActive: true,
  });
});

test("normalizeProductPayload trims text and converts numeric fields", () => {
  assert.deepEqual(
    normalizeProductPayload({
      name: "  Luna Shirt  ",
      category: "  Shirts ",
      description: "  Soft cotton  ",
      basePrice: "329000",
      isActive: false,
    }),
    {
      name: "Luna Shirt",
      category: "Shirts",
      description: "Soft cotton",
      basePrice: 329000,
      isActive: false,
    }
  );
});

test("normalizeVariantPayload keeps empty price override as null and parses stock fields", () => {
  assert.deepEqual(
    normalizeVariantPayload({
      sku: "  LUN-BLK-M ",
      size: " M ",
      color: " Black ",
      priceOverride: "",
      quantityOnHand: "12",
      lowStockThreshold: "4",
      isActive: true,
    }),
    {
      sku: "LUN-BLK-M",
      size: "M",
      color: "Black",
      priceOverride: null,
      quantityOnHand: 12,
      lowStockThreshold: 4,
      isActive: true,
    }
  );
});
