import test from "node:test";
import assert from "node:assert/strict";

import {
  filterRowsByWorkspace,
  mapProducts,
  mapSales,
  mapSettingsRows,
  mapWorkspaceRows,
  overlayProductsWithWorkspaceStock,
} from "../server/mappers.js";

test("mapSettingsRows parses JSON-backed settings values", () => {
  const result = mapSettingsRows([
    { key: "storeName", value: "Luna Mode" },
    { key: "paymentMethods", value: '["cash","card"]' },
    { key: "serviceChargeEnabled", value: "false" },
  ]);

  assert.deepEqual(result, {
    storeName: "Luna Mode",
    paymentMethods: ["cash", "card"],
    serviceChargeEnabled: false,
  });
});

test("mapProducts groups variants under each product and converts booleans", () => {
  const result = mapProducts([
    {
      id: "p1",
      name: "Aster Overshirt",
      category: "Shirts",
      description: "Relaxed overshirt",
      basePrice: 329000,
      isActive: true,
      createdAt: "2026-03-30T08:00:00.000Z",
      variantId: "v1",
      sku: "AST-BLK-S",
      size: "S",
      color: "Black",
      priceOverride: null,
      quantityOnHand: 12,
      lowStockThreshold: 4,
      variantIsActive: true,
      variantCreatedAt: "2026-03-30T08:00:00.000Z",
    },
    {
      id: "p1",
      name: "Aster Overshirt",
      category: "Shirts",
      description: "Relaxed overshirt",
      basePrice: 329000,
      isActive: true,
      createdAt: "2026-03-30T08:00:00.000Z",
      variantId: "v2",
      sku: "AST-BLK-M",
      size: "M",
      color: "Black",
      priceOverride: null,
      quantityOnHand: 5,
      lowStockThreshold: 4,
      variantIsActive: false,
      variantCreatedAt: "2026-03-30T08:00:00.000Z",
    },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].variants.length, 2);
  assert.equal(result[0].isActive, true);
  assert.equal(result[0].variants[1].isActive, false);
});

test("mapSales attaches items and optional promotion to each sale", () => {
  const result = mapSales(
    [
      {
        id: "sale-1",
        receiptNumber: "POS-20260330-1",
        cashierUserId: "u3",
        cashierUser: "Salsa Dewi",
        subtotal: 618000,
        discountTotal: 61800,
        grandTotal: 556200,
        paymentMethod: "card",
        paidAmount: 556200,
        createdAt: "2026-03-30T08:12:00.000Z",
      },
    ],
    [
      {
        id: "si-1",
        saleId: "sale-1",
        variantId: "v2",
        productNameSnapshot: "Aster Overshirt",
        skuSnapshot: "AST-BLK-M",
        sizeSnapshot: "M",
        colorSnapshot: "Black",
        unitPriceSnapshot: 329000,
        qty: 1,
        lineTotal: 329000,
      },
    ],
    [
      {
        saleId: "sale-1",
        promotionId: "promo-1",
        codeSnapshot: "LUNA10",
        discountAmount: 61800,
      },
    ]
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 1);
  assert.equal(result[0].promotion.codeSnapshot, "LUNA10");
});

test("mapWorkspaceRows groups assignments and stock metadata under each workspace", () => {
  const result = mapWorkspaceRows([
    {
      id: "event-gi",
      type: "event",
      name: "Bazar GI",
      status: "active",
      stockMode: "allocate",
      isVisible: true,
      locationLabel: "Grand Indonesia",
      startsAt: "2026-04-01T10:00:00.000Z",
      endsAt: "2026-04-03T21:00:00.000Z",
      assignedUserId: "u3",
    },
    {
      id: "event-gi",
      type: "event",
      name: "Bazar GI",
      status: "active",
      stockMode: "allocate",
      isVisible: true,
      locationLabel: "Grand Indonesia",
      startsAt: "2026-04-01T10:00:00.000Z",
      endsAt: "2026-04-03T21:00:00.000Z",
      assignedUserId: "u2",
    },
  ]);

  assert.deepEqual(result, [
    {
      id: "event-gi",
      type: "event",
      name: "Bazar GI",
      status: "active",
      stockMode: "allocate",
      isVisible: true,
      locationLabel: "Grand Indonesia",
      startsAt: "2026-04-01T10:00:00.000Z",
      endsAt: "2026-04-03T21:00:00.000Z",
      assignedUserIds: ["u3", "u2"],
    },
  ]);
});

test("filterRowsByWorkspace keeps legacy null rows in the fallback store workspace only", () => {
  const rows = [
    { id: "sale-legacy", workspaceId: null },
    { id: "sale-store", workspaceId: "store-main" },
    { id: "sale-event", workspaceId: "event-gi" },
  ];

  assert.deepEqual(
    filterRowsByWorkspace(rows, {
      workspaceId: "store-main",
      fallbackWorkspaceId: "store-main",
    }).map((row) => row.id),
    ["sale-legacy", "sale-store"]
  );

  assert.deepEqual(
    filterRowsByWorkspace(rows, {
      workspaceId: "event-gi",
      fallbackWorkspaceId: "store-main",
    }).map((row) => row.id),
    ["sale-event"]
  );
});

test("overlayProductsWithWorkspaceStock keeps only stocked event variants and replaces quantity on hand", () => {
  const result = overlayProductsWithWorkspaceStock(
    [
      {
        id: "p1",
        name: "Aster Overshirt",
        category: "Shirts",
        description: "Relaxed overshirt",
        basePrice: 329000,
        isActive: true,
        createdAt: "2026-03-30T08:00:00.000Z",
        variants: [
          {
            id: "v1",
            sku: "AST-BLK-S",
            size: "S",
            color: "Black",
            priceOverride: null,
            quantityOnHand: 12,
            lowStockThreshold: 4,
            isActive: true,
            createdAt: "2026-03-30T08:00:00.000Z",
          },
          {
            id: "v2",
            sku: "AST-BLK-M",
            size: "M",
            color: "Black",
            priceOverride: null,
            quantityOnHand: 5,
            lowStockThreshold: 4,
            isActive: true,
            createdAt: "2026-03-30T08:00:00.000Z",
          },
        ],
      },
      {
        id: "p2",
        name: "Mora Wide Pants",
        category: "Pants",
        description: "Wide pants",
        basePrice: 289000,
        isActive: true,
        createdAt: "2026-03-30T08:00:00.000Z",
        variants: [
          {
            id: "v3",
            sku: "MOR-NVY-M",
            size: "M",
            color: "Navy",
            priceOverride: null,
            quantityOnHand: 9,
            lowStockThreshold: 3,
            isActive: true,
            createdAt: "2026-03-30T08:00:00.000Z",
          },
        ],
      },
    ],
    [
      {
        variantId: "v2",
        quantityOnHand: 2,
        sourceMode: "allocate",
        allocatedFromMain: 2,
      },
      {
        variantId: "v3",
        quantityOnHand: 1,
        sourceMode: "manual",
        allocatedFromMain: 0,
      },
    ]
  );

  assert.deepEqual(result, [
    {
      id: "p1",
      name: "Aster Overshirt",
      category: "Shirts",
      description: "Relaxed overshirt",
      basePrice: 329000,
      isActive: true,
      createdAt: "2026-03-30T08:00:00.000Z",
      variants: [
        {
          id: "v2",
          sku: "AST-BLK-M",
          size: "M",
          color: "Black",
          priceOverride: null,
          quantityOnHand: 2,
          lowStockThreshold: 4,
          isActive: true,
          createdAt: "2026-03-30T08:00:00.000Z",
          sourceMode: "allocate",
          allocatedFromMain: 2,
        },
      ],
    },
    {
      id: "p2",
      name: "Mora Wide Pants",
      category: "Pants",
      description: "Wide pants",
      basePrice: 289000,
      isActive: true,
      createdAt: "2026-03-30T08:00:00.000Z",
      variants: [
        {
          id: "v3",
          sku: "MOR-NVY-M",
          size: "M",
          color: "Navy",
          priceOverride: null,
          quantityOnHand: 1,
          lowStockThreshold: 3,
          isActive: true,
          createdAt: "2026-03-30T08:00:00.000Z",
          sourceMode: "manual",
          allocatedFromMain: 0,
        },
      ],
    },
  ]);
});
