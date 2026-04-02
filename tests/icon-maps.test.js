import test from "node:test";
import assert from "node:assert/strict";

import {
  getCheckoutActionIconName,
  getDashboardKpiIconName,
  getNavigationIconName,
} from "../src/features/ui/iconMaps.js";

test("getNavigationIconName maps shell items to lucide icon names", () => {
  assert.equal(getNavigationIconName("Dashboard"), "LayoutDashboard");
  assert.equal(getNavigationIconName("Checkout"), "ShoppingCart");
  assert.equal(getNavigationIconName("Sales"), "Receipt");
  assert.equal(getNavigationIconName("Events"), "CalendarDays");
  assert.equal(getNavigationIconName("Catalog"), "Package");
  assert.equal(getNavigationIconName("Inventory"), "Boxes");
  assert.equal(getNavigationIconName("Promotions"), "BadgePercent");
  assert.equal(getNavigationIconName("Reports"), "BarChart3");
});

test("getDashboardKpiIconName maps KPI labels to lucide icon names", () => {
  assert.equal(getDashboardKpiIconName("Gross revenue"), "Banknote");
  assert.equal(getDashboardKpiIconName("Transactions"), "Receipt");
  assert.equal(getDashboardKpiIconName("Average order value"), "Calculator");
  assert.equal(getDashboardKpiIconName("Items sold"), "ShoppingBag");
});

test("getCheckoutActionIconName maps checkout chrome actions to lucide icon names", () => {
  assert.equal(getCheckoutActionIconName("search"), "Search");
  assert.equal(getCheckoutActionIconName("note"), "StickyNote");
  assert.equal(getCheckoutActionIconName("customer"), "UserPlus");
  assert.equal(getCheckoutActionIconName("clear"), "Trash2");
  assert.equal(getCheckoutActionIconName("walkIn"), "User");
  assert.equal(getCheckoutActionIconName("minus"), "Minus");
  assert.equal(getCheckoutActionIconName("plus"), "Plus");
  assert.equal(getCheckoutActionIconName("charge"), "CreditCard");
});
