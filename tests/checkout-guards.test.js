import test from "node:test";
import assert from "node:assert/strict";

import { createFinalizeSaleLock, evaluateCartAddition } from "../src/features/checkout/checkoutGuards.js";

test("evaluateCartAddition rejects variants with zero stock before first add", () => {
  const variant = {
    id: "variant-1",
    productName: "Aster",
    sku: "AST-BLK-M",
    size: "M",
    color: "Black",
    price: 250000,
    quantityOnHand: 0,
  };

  const result = evaluateCartAddition([], variant);

  assert.equal(result.blocked, true);
  assert.equal(result.reason, "out-of-stock");
  assert.deepEqual(result.nextCart, []);
});

test("evaluateCartAddition adds an in-stock variant on the first click", () => {
  const variant = {
    id: "variant-2",
    productName: "Aster",
    sku: "AST-BLK-M",
    size: "M",
    color: "Black",
    price: 250000,
    quantityOnHand: 3,
  };

  const result = evaluateCartAddition([], variant);

  assert.equal(result.blocked, false);
  assert.equal(result.reason, null);
  assert.deepEqual(result.nextCart, [
    {
      variantId: "variant-2",
      productName: "Aster",
      sku: "AST-BLK-M",
      size: "M",
      color: "Black",
      price: 250000,
      qty: 1,
    },
  ]);
});

test("evaluateCartAddition blocks when the cart is already at stock capacity", () => {
  const variant = {
    id: "variant-3",
    productName: "Aster",
    sku: "AST-BLK-L",
    size: "L",
    color: "Black",
    price: 250000,
    quantityOnHand: 2,
  };
  const current = [
    {
      variantId: "variant-3",
      productName: "Aster",
      sku: "AST-BLK-L",
      size: "L",
      color: "Black",
      price: 250000,
      qty: 2,
    },
  ];

  const result = evaluateCartAddition(current, variant);

  assert.equal(result.blocked, true);
  assert.equal(result.reason, "at-capacity");
  assert.deepEqual(result.nextCart, current);
});

test("createFinalizeSaleLock blocks a second finalize attempt until the first releases", () => {
  const lock = createFinalizeSaleLock();

  assert.equal(lock.tryBegin(), true);
  assert.equal(lock.tryBegin(), false);

  lock.release();

  assert.equal(lock.tryBegin(), true);
});
