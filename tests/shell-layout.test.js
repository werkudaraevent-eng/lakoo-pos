import test from "node:test";
import assert from "node:assert/strict";

import { getShellRouteMeta, getShellTone } from "../src/features/shell/shellLayout.js";

test("getShellTone keeps checkout and sales in compact operational mode", () => {
  assert.equal(getShellTone("/checkout"), "compact");
  assert.equal(getShellTone("/sales"), "compact");
  assert.equal(getShellTone("/dashboard"), "default");
});

test("getShellRouteMeta returns concise route copy for the sales workspace", () => {
  assert.deepEqual(getShellRouteMeta("/sales"), {
    eyebrow: "Sales",
    title: "Transaction workspace",
    description: "Review finalized receipts, payment flow, and cashier activity in one split view.",
  });
});
