# POS Near-Full Visual Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the POS shell and operational pages so the product feels like a modern retail operations system instead of a generic SaaS dashboard.

**Architecture:** Keep the existing workspace-aware product model and backend behavior, but refactor the UI into a flatter visual system with denser split-pane surfaces. The implementation should proceed in vertical slices: foundation first, then sales, inventory, events, dashboard, reports, checkout, and entry flows.

**Tech Stack:** Vite, React 19, React Router 7, Express, plain CSS, `node:test`

---

## File Structure

### Shared UI Foundation

- Create: `src/features/shell/shellLayout.js`
  Pure helpers for shell route metadata and compact shell state.
- Create: `tests/shell-layout.test.js`
  Covers the new shell metadata and compact route behavior.
- Modify: `src/components/AppShell.jsx`
  Rebuilds sidebar and topbar into a thinner operational shell.
- Modify: `src/features/workspaces/components/WorkspaceSwitcher.jsx`
  Rebuilds the workspace module into a compact context system.
- Modify: `src/styles.css`
  Replaces the card-heavy system with a flatter retail operations visual language.

### Sales Workspace

- Create: `src/features/sales/salesWorkspace.js`
  Pure helpers for split-pane sales summary and row formatting.
- Modify: `src/pages/SalesPage.jsx`
  Converts sales history into a receipt list + detail workspace.
- Modify: `tests/sales-helpers.test.js`
  Adds tests for the new sales workspace helpers.

### Inventory Workspace

- Create: `src/features/inventory/inventoryWorkspace.js`
  Pure helpers for stock status labels and inventory toolbar summaries.
- Create: `tests/inventory-workspace.test.js`
  Covers stock-state and toolbar summary behavior.
- Modify: `src/pages/InventoryPage.jsx`
  Rebuilds inventory as a list-and-action workspace instead of a card stack.

### Event Workspace

- Create: `src/features/events/eventWorkspace.js`
  Pure helpers for event row summaries and detail panel actions.
- Create: `tests/event-workspace.test.js`
  Covers event table rows and lifecycle action visibility.
- Modify: `src/pages/EventsPage.jsx`
  Rebuilds events into a list/detail operations view.
- Modify: `src/pages/EventDetailPage.jsx`
  Refactors event detail into a right-side operational panel style.
- Modify: `src/pages/EventClosingPage.jsx`
  Aligns closing review to the new system language.

### Dashboard and Reports

- Create: `src/features/dashboard/dashboardWorkspace.js`
  Pure helpers for command-strip items and compact KPI summaries.
- Create: `tests/dashboard-workspace.test.js`
  Covers command-strip and workspace-aware dashboard summaries.
- Modify: `src/pages/DashboardPage.jsx`
  Converts dashboard into a command surface with denser metrics and activity.
- Modify: `src/pages/ReportsPage.jsx`
  Converts reports into tighter analytical surfaces.

### Checkout and Entry Flows

- Modify: `src/pages/CheckoutPage.jsx`
  Applies the flatter visual system and tighter hierarchy to checkout.
- Modify: `src/features/checkout/components/CartSummary.jsx`
  Sharpens total hierarchy and action treatment.
- Modify: `src/features/checkout/components/ProductSearchPanel.jsx`
  Aligns checkout search to the new visual system.
- Modify: `src/features/checkout/components/ProductGrid.jsx`
  Flattens and densifies product browsing.
- Modify: `src/features/checkout/components/LatestReceipt.jsx`
  Rebuilds receipt confirmation into a cleaner secondary surface.
- Modify: `src/features/checkout/checkout.css`
  Replaces checkout-specific card styling.
- Modify: `src/pages/LoginPage.jsx`
  Rebuilds login into a simpler, more professional entry page.
- Modify: `src/pages/WorkspacePickerPage.jsx`
  Rebuilds workspace selection into a cleaner operational selector.

### Documentation

- Modify: `docs/ARCHITECTURE.md`
  Adds the visual reset architecture note and split-pane surface principles.

## Task 1: Define Shell Layout Helpers and Replace the Shell Foundation

**Files:**
- Create: `src/features/shell/shellLayout.js`
- Test: `tests/shell-layout.test.js`
- Modify: `src/components/AppShell.jsx`
- Modify: `src/features/workspaces/components/WorkspaceSwitcher.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { getShellTone, getShellRouteMeta } from "../src/features/shell/shellLayout.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/shell-layout.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/features/shell/shellLayout.js`

- [ ] **Step 3: Write minimal implementation**

```js
const routeMeta = [
  {
    match: (pathname) => pathname.startsWith("/sales"),
    meta: {
      eyebrow: "Sales",
      title: "Transaction workspace",
      description: "Review finalized receipts, payment flow, and cashier activity in one split view.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/checkout"),
    meta: {
      eyebrow: "Sell",
      title: "Checkout workspace",
      description: "Search, add, review, and complete sales without leaving the workspace flow.",
    },
  },
];

export function getShellTone(pathname) {
  if (pathname.startsWith("/checkout") || pathname.startsWith("/sales")) {
    return "compact";
  }

  return "default";
}

export function getShellRouteMeta(pathname) {
  return (
    routeMeta.find((item) => item.match(pathname))?.meta ?? {
      eyebrow: "Workspace",
      title: "Retail operations",
      description: "Run daily store and event operations from one system.",
    }
  );
}
```

- [ ] **Step 4: Replace shell layout and visual foundation**

```jsx
import { getShellRouteMeta, getShellTone } from "../features/shell/shellLayout";

const shellTone = getShellTone(location.pathname);
const currentRoute = getShellRouteMeta(location.pathname);

return (
  <div className={`app-shell app-shell-${shellTone}`}>
    <aside className="sidebar sidebar-thin">
      <div className="brand-block brand-block-compact">
        <div className="brand-badge">H</div>
        <div className="brand-copy">
          <p className="eyebrow">Harness POS</p>
          <h1>Retail OS</h1>
        </div>
      </div>
      <WorkspaceSwitcher />
      {navigation}
    </aside>
    <div className="main-shell">
      <header className="topbar-app topbar-thin">
        <div className="shell-heading">
          <p className="eyebrow">{currentRoute.eyebrow}</p>
          <h2>{currentRoute.title}</h2>
          <p className="shell-subtitle">{currentRoute.description}</p>
        </div>
      </header>
      <div className="page-shell">{children}</div>
    </div>
  </div>
);
```

```css
.app-shell {
  grid-template-columns: 216px 1fr;
  gap: 12px;
  padding: 12px;
}

.sidebar-thin {
  gap: 12px;
  padding: 14px;
  background: #f8fbfc;
}

.topbar-thin {
  min-height: 88px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.92);
}
```

- [ ] **Step 5: Run tests and build**

Run: `node --test tests/shell-layout.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with the new shell imports and style classes

- [ ] **Step 6: Commit**

```bash
git add tests/shell-layout.test.js src/features/shell/shellLayout.js src/components/AppShell.jsx src/features/workspaces/components/WorkspaceSwitcher.jsx src/styles.css
git commit -m "feat: reset shell visual foundation"
```

## Task 2: Rebuild Sales Into a Split-Pane Transaction Workspace

**Files:**
- Create: `src/features/sales/salesWorkspace.js`
- Modify: `src/pages/SalesPage.jsx`
- Modify: `tests/sales-helpers.test.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildSalesWorkspaceSummary } from "../src/features/sales/salesWorkspace.js";

test("buildSalesWorkspaceSummary returns matched count revenue and page label", () => {
  const result = buildSalesWorkspaceSummary({
    filteredSales: [
      { grandTotal: 120000 },
      { grandTotal: 80000 },
    ],
    page: 2,
    totalPages: 4,
  });

  assert.deepEqual(result, {
    matchedCount: 2,
    matchedRevenue: 200000,
    pageLabel: "2 / 4",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sales-helpers.test.js`
Expected: FAIL because `buildSalesWorkspaceSummary` is not exported yet

- [ ] **Step 3: Write minimal implementation**

```js
export function buildSalesWorkspaceSummary({ filteredSales = [], page = 1, totalPages = 1 } = {}) {
  return {
    matchedCount: filteredSales.length,
    matchedRevenue: filteredSales.reduce((sum, sale) => sum + Number(sale.grandTotal || 0), 0),
    pageLabel: `${page} / ${totalPages}`,
  };
}
```

- [ ] **Step 4: Convert sales page into a split-pane workspace**

```jsx
const summary = buildSalesWorkspaceSummary({
  filteredSales,
  page: paginated.page,
  totalPages: paginated.totalPages,
});

return (
  <div className="page-stack sales-page">
    <section className="panel-card sales-toolbar">
      <div className="sales-toolbar-summary">
        <div className="sales-kpi">
          <span className="stat-label">Receipts</span>
          <strong>{summary.matchedCount}</strong>
        </div>
        <div className="sales-kpi">
          <span className="stat-label">Matched revenue</span>
          <strong>{formatCurrency(summary.matchedRevenue)}</strong>
        </div>
      </div>
      <div className="sales-toolbar-controls">
        <input placeholder="Receipt, cashier, product, SKU" />
        <select />
      </div>
    </section>

    <section className="content-grid sales-layout sales-layout-refined">
      <article className="panel-card sales-list-panel">{receiptList}</article>
      <article className="panel-card receipt-panel receipt-panel-refined">{receiptDetail}</article>
    </section>
  </div>
);
```

```css
.sales-layout-refined {
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
}

.sale-row-button-refined {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  border: none;
  border-bottom: 1px solid rgba(23, 33, 43, 0.08);
  background: transparent;
}
```

- [ ] **Step 5: Run tests and build**

Run: `node --test tests/sales-helpers.test.js`
Expected: PASS, including the new summary test

Run: `npm run build`
Expected: PASS with the split-pane sales workspace

- [ ] **Step 6: Commit**

```bash
git add tests/sales-helpers.test.js src/features/sales/salesWorkspace.js src/pages/SalesPage.jsx src/styles.css
git commit -m "feat: redesign sales workspace"
```

## Task 3: Rebuild Inventory Into a Stock-Control Workspace

**Files:**
- Create: `src/features/inventory/inventoryWorkspace.js`
- Create: `tests/inventory-workspace.test.js`
- Modify: `src/pages/InventoryPage.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { getInventoryStatusLabel } from "../src/features/inventory/inventoryWorkspace.js";

test("getInventoryStatusLabel marks low stock clearly", () => {
  assert.deepEqual(getInventoryStatusLabel({ quantityOnHand: 2, lowStockThreshold: 3 }), {
    tone: "warning",
    label: "Low",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/inventory-workspace.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/features/inventory/inventoryWorkspace.js`

- [ ] **Step 3: Write minimal implementation**

```js
export function getInventoryStatusLabel(variant) {
  if (Number(variant.quantityOnHand) <= Number(variant.lowStockThreshold)) {
    return { tone: "warning", label: "Low" };
  }

  return { tone: "stable", label: "Healthy" };
}
```

- [ ] **Step 4: Convert inventory to a list-and-action workspace**

```jsx
return (
  <div className="page-stack inventory-page">
    <section className="panel-card inventory-toolbar">
      <div className="inventory-toolbar-controls">
        <input placeholder="Search product, variant, SKU" />
        <select />
        <button type="button">Low stock only</button>
      </div>
    </section>

    <section className="content-grid inventory-layout">
      <article className="panel-card inventory-list-panel">{stockList}</article>
      <article className="panel-card inventory-action-panel">{adjustmentForm}</article>
    </section>
  </div>
);
```

```css
.inventory-layout {
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}
```

- [ ] **Step 5: Run tests and build**

Run: `node --test tests/inventory-workspace.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with the new inventory layout

- [ ] **Step 6: Commit**

```bash
git add tests/inventory-workspace.test.js src/features/inventory/inventoryWorkspace.js src/pages/InventoryPage.jsx src/styles.css
git commit -m "feat: redesign inventory workspace"
```

## Task 4: Rebuild Events Into a List + Detail Operations View

**Files:**
- Create: `src/features/events/eventWorkspace.js`
- Create: `tests/event-workspace.test.js`
- Modify: `src/pages/EventsPage.jsx`
- Modify: `src/pages/EventDetailPage.jsx`
- Modify: `src/pages/EventClosingPage.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildEventRowSummary } from "../src/features/events/eventWorkspace.js";

test("buildEventRowSummary exposes a compact row for event tables", () => {
  const result = buildEventRowSummary({
    name: "Bazar PIK",
    locationLabel: "PIK Avenue",
    status: "active",
    stockMode: "allocate",
  });

  assert.deepEqual(result, {
    title: "Bazar PIK",
    subtitle: "PIK Avenue",
    statusLabel: "Active",
    stockModeLabel: "Allocate from main stock",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/event-workspace.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/features/events/eventWorkspace.js`

- [ ] **Step 3: Write minimal implementation**

```js
import { getEventActionLabel } from "./eventHelpers.js";

export function buildEventRowSummary(event) {
  return {
    title: event.name,
    subtitle: event.locationLabel || "Location pending",
    statusLabel: event.status.charAt(0).toUpperCase() + event.status.slice(1),
    stockModeLabel: getEventActionLabel(event.stockMode),
  };
}
```

- [ ] **Step 4: Rebuild event pages to use a list-detail layout**

```jsx
return (
  <section className="content-grid events-layout">
    <article className="panel-card events-list-panel">{eventTable}</article>
    <article className="panel-card events-detail-panel">{selectedEventDetail}</article>
  </section>
);
```

```css
.events-layout {
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
}
```

- [ ] **Step 5: Run tests and build**

Run: `node --test tests/event-workspace.test.js tests/event-helpers.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with the event list/detail redesign

- [ ] **Step 6: Commit**

```bash
git add tests/event-workspace.test.js src/features/events/eventWorkspace.js src/pages/EventsPage.jsx src/pages/EventDetailPage.jsx src/pages/EventClosingPage.jsx src/styles.css
git commit -m "feat: redesign event operations workspace"
```

## Task 5: Convert Dashboard and Reports Into Tighter Operations Surfaces

**Files:**
- Create: `src/features/dashboard/dashboardWorkspace.js`
- Create: `tests/dashboard-workspace.test.js`
- Modify: `src/pages/DashboardPage.jsx`
- Modify: `src/pages/ReportsPage.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildCommandStrip } from "../src/features/dashboard/dashboardWorkspace.js";

test("buildCommandStrip returns event-aware actions for active workspaces", () => {
  const result = buildCommandStrip({ type: "event", status: "active" });

  assert.deepEqual(result, ["Open checkout", "View sales", "Adjust stock", "Close event"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/dashboard-workspace.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/features/dashboard/dashboardWorkspace.js`

- [ ] **Step 3: Write minimal implementation**

```js
export function buildCommandStrip(workspace) {
  if (workspace?.type === "event" && workspace?.status === "active") {
    return ["Open checkout", "View sales", "Adjust stock", "Close event"];
  }

  return ["Open checkout", "View sales", "Adjust stock"];
}
```

- [ ] **Step 4: Rebuild dashboard and reports**

```jsx
<section className="panel-card dashboard-command-strip">
  {commands.map((command) => (
    <button key={command} type="button">{command}</button>
  ))}
</section>
```

```jsx
<section className="content-grid reports-layout">
  <article className="panel-card">{metricsBand}</article>
  <article className="panel-card">{rankedTables}</article>
</section>
```

```css
.dashboard-command-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
```

- [ ] **Step 5: Run tests and build**

Run: `node --test tests/dashboard-workspace.test.js tests/event-helpers.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with tighter dashboard and reports surfaces

- [ ] **Step 6: Commit**

```bash
git add tests/dashboard-workspace.test.js src/features/dashboard/dashboardWorkspace.js src/pages/DashboardPage.jsx src/pages/ReportsPage.jsx src/styles.css
git commit -m "feat: redesign dashboard and reports surfaces"
```

## Task 6: Align Checkout to the New System Tone

**Files:**
- Modify: `src/pages/CheckoutPage.jsx`
- Modify: `src/features/checkout/components/CartSummary.jsx`
- Modify: `src/features/checkout/components/ProductSearchPanel.jsx`
- Modify: `src/features/checkout/components/ProductGrid.jsx`
- Modify: `src/features/checkout/components/LatestReceipt.jsx`
- Modify: `src/features/checkout/checkout.css`

- [ ] **Step 1: Extend the checkout guard test with the new compact context copy**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildReceiptTitle } from "../src/features/sales/salesHelpers.js";

test("buildReceiptTitle remains stable after the visual checkout reset", () => {
  assert.equal(buildReceiptTitle({ receiptNumber: "POS-20260401-1" }), "Receipt POS-20260401-1");
});
```

- [ ] **Step 2: Run test to verify coverage stays green before refactor**

Run: `node --test tests/checkout-guards.test.js tests/sales-helpers.test.js`
Expected: PASS

- [ ] **Step 3: Rebuild checkout visuals**

```jsx
<section className="checkout-context-strip checkout-context-flat">
  <div>
    <p className="eyebrow">Checkout</p>
    <h1>{activeWorkspace?.name}</h1>
  </div>
  <div className="checkout-context-meta">{contextChips}</div>
</section>
```

```css
.checkout-context-flat,
.checkout-products-card,
.checkout-summary-card,
.checkout-receipt-card {
  border: 1px solid rgba(23, 33, 43, 0.08);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(23, 33, 43, 0.04);
}
```

- [ ] **Step 4: Run tests and build**

Run: `node --test tests/checkout-guards.test.js tests/sales-helpers.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with the flatter checkout system

- [ ] **Step 5: Commit**

```bash
git add src/pages/CheckoutPage.jsx src/features/checkout/components/CartSummary.jsx src/features/checkout/components/ProductSearchPanel.jsx src/features/checkout/components/ProductGrid.jsx src/features/checkout/components/LatestReceipt.jsx src/features/checkout/checkout.css
git commit -m "feat: align checkout with visual reset"
```

## Task 7: Redesign Login and Workspace Picker

**Files:**
- Modify: `src/pages/LoginPage.jsx`
- Modify: `src/pages/WorkspacePickerPage.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Extract a failing workspace selector copy test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { getShellRouteMeta } from "../src/features/shell/shellLayout.js";

test("getShellRouteMeta keeps workspace copy concise after the reset", () => {
  assert.equal(getShellRouteMeta("/workspace/select").title, "Retail operations");
});
```

- [ ] **Step 2: Run test to verify existing behavior still holds**

Run: `node --test tests/shell-layout.test.js`
Expected: PASS

- [ ] **Step 3: Rebuild entry pages**

```jsx
<section className="auth-surface auth-surface-centered">
  <div className="auth-copy">
    <p className="eyebrow">Sign in</p>
    <h1>Access your retail workspace</h1>
  </div>
  <form>{fields}</form>
</section>
```

```jsx
<section className="workspace-picker-surface">
  <header>
    <p className="eyebrow">Workspace</p>
    <h1>Select the workspace for this shift</h1>
  </header>
  <div className="workspace-picker-list">{workspaceRows}</div>
</section>
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS with updated entry surfaces

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.jsx src/pages/WorkspacePickerPage.jsx src/styles.css
git commit -m "feat: redesign login and workspace picker"
```

## Task 8: Document the Visual Reset and Run Final Verification

**Files:**
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Add the visual reset architecture note**

```md
## Visual System

The application now uses a flatter retail operations UI:

- thin shell navigation
- workspace-first context display
- split-pane operational surfaces for sales, inventory, and events
- denser list and table patterns instead of card-heavy dashboards
```

- [ ] **Step 2: Run full verification**

Run: `npm test`
Expected: PASS for all `tests/*.test.js`

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Review final diff for visual reset consistency**

Run: `git diff -- src/components/AppShell.jsx src/pages/SalesPage.jsx src/pages/InventoryPage.jsx src/pages/EventsPage.jsx src/pages/DashboardPage.jsx src/pages/ReportsPage.jsx src/pages/CheckoutPage.jsx src/pages/LoginPage.jsx src/pages/WorkspacePickerPage.jsx src/styles.css`
Expected: layout language should consistently reflect thin shell, flatter panels, and split-pane operational surfaces

- [ ] **Step 4: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: record visual reset architecture"
```

## Self-Review Notes

### Spec Coverage

- shell reset: covered in Task 1
- sales split-pane structure: covered in Task 2
- inventory list-action structure: covered in Task 3
- events operations view: covered in Task 4
- dashboard and reports reset: covered in Task 5
- checkout refinement: covered in Task 6
- login and workspace picker alignment: covered in Task 7
- final architecture note and verification: covered in Task 8

### Placeholder Scan

The plan includes exact file paths, exact commands, concrete helper names, concrete JSX/CSS examples, and concrete verification steps. No `TODO`, `TBD`, or deferred placeholders remain.

### Type Consistency

- shell helper names stay consistent: `getShellTone`, `getShellRouteMeta`
- sales helper name stays consistent: `buildSalesWorkspaceSummary`
- inventory helper name stays consistent: `getInventoryStatusLabel`
- dashboard helper name stays consistent: `buildCommandStrip`
