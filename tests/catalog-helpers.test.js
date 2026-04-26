import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCatalogCsv,
  buildCatalogStockSummary,
  createEmptyProductDraft,
  createEmptyVariantDraft,
  filterCatalogProducts,
  normalizeProductPayload,
  normalizeVariantPayload,
  paginateCatalogProducts,
  sortCatalogProducts,
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
    attribute1Value: "",
    attribute2Value: "",
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
      attribute1Value: " M ",
      attribute2Value: " Black ",
      priceOverride: "",
      quantityOnHand: "12",
      lowStockThreshold: "4",
      isActive: true,
    }),
    {
      sku: "LUN-BLK-M",
      attribute1Value: "M",
      attribute2Value: "Black",
      priceOverride: null,
      quantityOnHand: 12,
      lowStockThreshold: 4,
      isActive: true,
    }
  );
});

test("buildCatalogStockSummary derives stock tone and total from variants", () => {
  assert.deepEqual(
    buildCatalogStockSummary({
      variants: [
        { quantityOnHand: 2, lowStockThreshold: 4, isActive: true },
        { quantityOnHand: 5, lowStockThreshold: 1, isActive: true },
      ],
    }),
    {
      tone: "low",
      label: "7 in stock",
      total: 7,
    }
  );
});

test("filterCatalogProducts matches query and stock filter", () => {
  const products = [
    {
      name: "Aster Overshirt",
      category: "Shirts",
      description: "Relaxed cotton",
      variants: [{ sku: "AST-BLK-M", attribute1Value: "M", attribute2Value: "Black", quantityOnHand: 2, lowStockThreshold: 3, isActive: true }],
    },
    {
      name: "Mora Wide Pants",
      category: "Pants",
      description: "Wide fit",
      variants: [{ sku: "MOR-NVY-M", attribute1Value: "M", attribute2Value: "Navy", quantityOnHand: 10, lowStockThreshold: 2, isActive: true }],
    },
  ];

  const result = filterCatalogProducts(products, { query: "navy", stockFilter: "high" });

  assert.deepEqual(result.map((product) => product.name), ["Mora Wide Pants"]);
});

test("sortCatalogProducts supports price and stock ordering", () => {
  const products = [
    { name: "B", basePrice: 400000, variants: [{ quantityOnHand: 2, lowStockThreshold: 1 }] },
    { name: "A", basePrice: 200000, variants: [{ quantityOnHand: 9, lowStockThreshold: 1 }] },
  ];

  assert.deepEqual(sortCatalogProducts(products, "price-low").map((product) => product.name), ["A", "B"]);
  assert.deepEqual(sortCatalogProducts(products, "stock-high").map((product) => product.name), ["A", "B"]);
});

test("paginateCatalogProducts returns the current slice and page count", () => {
  const products = [{ id: "1" }, { id: "2" }, { id: "3" }];
  const result = paginateCatalogProducts(products, { page: 2, pageSize: 2 });

  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
  assert.deepEqual(result.items, [{ id: "3" }]);
});

test("buildCatalogCsv returns quoted csv rows", () => {
  const csv = buildCatalogCsv([
    {
      name: "Aster Overshirt",
      category: "Shirts",
      basePrice: 329000,
      isActive: true,
      variants: [{ quantityOnHand: 4, lowStockThreshold: 2 }],
    },
  ]);

  assert.match(csv, /"Product","Category","Base Price","Status","Stock","Variants"/);
  assert.match(csv, /"Aster Overshirt","Shirts","329000","active","4","1"/);
});
