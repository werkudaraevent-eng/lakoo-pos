# POS Workspace UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a workspace-aware POS flow with event lifecycle support while refreshing the shell, dashboard, and checkout UI to feel like a modern retail POS.

**Architecture:** Introduce a workspace domain that sits between auth and page routing, then make backend bootstrap, sales, inventory, and reporting workspace-scoped. Implement the product changes in vertical slices so the app remains usable after each task: workspace helpers, backend data model, frontend routing/context, shell/dashboard refresh, checkout refresh, event management, and event closing.

**Tech Stack:** Vite, React 19, React Router 7, Express, Postgres via `postgres`, plain CSS, `node:test`

---

## Scope Notes

This spec spans several visible surfaces, but they are not independent subsystems. Routing, bootstrap payloads, workspace scoping, checkout state, and event lifecycle all depend on the same shared workspace model. This plan keeps them in one coordinated implementation so the app does not end up with two competing navigation or data-scoping systems.

## File Structure

### Backend

- Create: `supabase/migrations/202603310002_workspace_events.sql`
  Adds workspace tables, workspace-linked sales and inventory columns, and lifecycle metadata.
- Modify: `supabase/seed.sql`
  Seeds `Main Store`, sample event workspaces, assignments, and example event stock.
- Modify: `server/mappers.js`
  Adds mapping helpers for workspace rows and workspace-scoped stock rows.
- Modify: `server/db.js`
  Loads workspace-aware bootstrap data, event inventory, event lifecycle actions, and workspace-tagged sales.
- Modify: `server/index.js`
  Exposes workspace-aware bootstrap and event lifecycle endpoints.

### Frontend Workspace Flow

- Create: `src/context/WorkspaceContext.jsx`
  Stores active workspace, resolves post-login entry, and handles guarded switching.
- Create: `src/features/workspaces/workspaceGuards.js`
  Pure helpers for landing route choice, workspace visibility, and switch confirmation.
- Create: `src/pages/WorkspacePickerPage.jsx`
  Lets users select a store or event when they have more than one valid workspace.
- Modify: `src/main.jsx`
  Wraps the app in `WorkspaceProvider`.
- Modify: `src/app/App.jsx`
  Adds workspace selection and event routes.
- Modify: `src/app/ProtectedRoute.jsx`
  Redirects authenticated users through workspace resolution before shell pages render.
- Modify: `src/context/AuthContext.jsx`
  Clears workspace state on logout.
- Modify: `src/context/PosDataContext.jsx`
  Reloads bootstrap data based on the active workspace and exposes event actions.
- Modify: `src/api/client.js`
  Adds query-param support for workspace-aware requests.

### UI Refresh

- Modify: `src/components/AppShell.jsx`
  Replaces the oversized hero shell with a compact retail POS frame and workspace switcher.
- Create: `src/features/workspaces/components/WorkspaceSwitcher.jsx`
  Displays current workspace, status, stock mode, and guarded switch affordance.
- Modify: `src/pages/DashboardPage.jsx`
  Restructures dashboard density and event-aware metrics.
- Modify: `src/pages/CheckoutPage.jsx`
  Adds context strip, guarded workspace switching behavior, and denser layout.
- Modify: `src/features/checkout/components/CartSummary.jsx`
  Strengthens cart summary hierarchy and sticky finalize area.
- Modify: `src/features/checkout/components/ProductSearchPanel.jsx`
  Moves search to the dominant visual anchor with compact controls.
- Modify: `src/features/checkout/components/ProductGrid.jsx`
  Densifies product cards and surfaces stock state cleanly.
- Modify: `src/features/checkout/components/LatestReceipt.jsx`
  Demotes latest receipt to a compact secondary confirmation block.
- Modify: `src/styles.css`
  Rebuilds the global visual system around a lighter, tighter POS shell.
- Modify: `src/features/checkout/checkout.css`
  Aligns checkout layout to sticky summary and denser product browsing.

### Event Operations

- Create: `src/features/events/eventHelpers.js`
  Pure helpers for event state transitions, stock mode labels, and closing summary formatting.
- Create: `src/pages/EventsPage.jsx`
  Lists draft, active, closed, and archived events with management actions.
- Create: `src/pages/EventDetailPage.jsx`
  Handles event overview, staff assignment, and stock mode-specific stock setup.
- Create: `src/pages/EventClosingPage.jsx`
  Runs the three-step closing review flow.

### Tests

- Create: `tests/workspace-guards.test.js`
  Covers landing route selection, visible workspaces, and switch confirmation rules.
- Modify: `tests/server-mappers.test.js`
  Covers mapped workspace rows and workspace-scoped stock rows.
- Create: `tests/event-helpers.test.js`
  Covers lifecycle transitions and closing review readiness.
- Modify: `tests/checkout-guards.test.js`
  Covers workspace-switch blocking when the cart is dirty.

## Task 1: Define Workspace Guard Helpers

**Files:**
- Create: `src/features/workspaces/workspaceGuards.js`
- Test: `tests/workspace-guards.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  filterAccessibleWorkspaces,
  getRoleLandingPath,
  shouldConfirmWorkspaceSwitch,
} from "../src/features/workspaces/workspaceGuards.js";

test("getRoleLandingPath sends cashiers to checkout and managers to dashboard", () => {
  assert.equal(getRoleLandingPath("cashier"), "/checkout");
  assert.equal(getRoleLandingPath("manager"), "/dashboard");
  assert.equal(getRoleLandingPath("admin"), "/dashboard");
});

test("filterAccessibleWorkspaces hides draft events from cashiers", () => {
  const workspaces = [
    { id: "store-main", type: "store", status: "active", isVisible: true, assignedUserIds: ["u3"] },
    { id: "event-draft", type: "event", status: "draft", isVisible: true, assignedUserIds: ["u3"] },
    { id: "event-live", type: "event", status: "active", isVisible: true, assignedUserIds: ["u3"] },
  ];

  const result = filterAccessibleWorkspaces(workspaces, {
    id: "u3",
    role: "cashier",
  });

  assert.deepEqual(result.map((workspace) => workspace.id), ["store-main", "event-live"]);
});

test("shouldConfirmWorkspaceSwitch blocks switching when checkout still has items", () => {
  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/checkout",
      cartCount: 2,
      hasPendingEventClosing: false,
    }),
    true
  );

  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/dashboard",
      cartCount: 0,
      hasPendingEventClosing: false,
    }),
    false
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/workspace-guards.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/features/workspaces/workspaceGuards.js`

- [ ] **Step 3: Write minimal implementation**

```js
const CASHIER_BLOCKED_EVENT_STATUSES = new Set(["draft", "closed", "archived"]);

export function getRoleLandingPath(role) {
  return role === "cashier" ? "/checkout" : "/dashboard";
}

export function filterAccessibleWorkspaces(workspaces, user) {
  return workspaces.filter((workspace) => {
    if (!workspace.isVisible) {
      return false;
    }

    const assigned = workspace.assignedUserIds?.includes(user.id) ?? false;
    if (user.role === "admin") {
      return true;
    }

    if (!assigned) {
      return false;
    }

    if (user.role === "cashier" && workspace.type === "event") {
      return !CASHIER_BLOCKED_EVENT_STATUSES.has(workspace.status);
    }

    return true;
  });
}

export function shouldConfirmWorkspaceSwitch({ currentPath, cartCount, hasPendingEventClosing }) {
  if (currentPath.startsWith("/checkout") && cartCount > 0) {
    return true;
  }

  return hasPendingEventClosing;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/workspace-guards.test.js`
Expected: PASS for all three tests

- [ ] **Step 5: Commit**

```bash
git add tests/workspace-guards.test.js src/features/workspaces/workspaceGuards.js
git commit -m "feat: add workspace guard helpers"
```

## Task 2: Add Workspace and Event Data to the Backend

**Files:**
- Create: `supabase/migrations/202603310002_workspace_events.sql`
- Modify: `supabase/seed.sql`
- Modify: `server/mappers.js`
- Modify: `server/db.js`
- Modify: `server/index.js`
- Modify: `tests/server-mappers.test.js`

- [ ] **Step 1: Write the failing mapper test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { mapWorkspaceRows } from "../server/mappers.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server-mappers.test.js`
Expected: FAIL because `mapWorkspaceRows` is not exported yet

- [ ] **Step 3: Add the migration, mapper, and bootstrap implementation**

```sql
CREATE TABLE IF NOT EXISTS workspaces (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('store', 'event')),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  stock_mode text CHECK (stock_mode IN ('allocate', 'manual')),
  location_label text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_visible boolean NOT NULL DEFAULT true,
  closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_assignments (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_variant_stocks (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  variant_id text NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity_on_hand integer NOT NULL,
  source_mode text NOT NULL CHECK (source_mode IN ('allocate', 'manual')),
  allocated_from_main integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (workspace_id, variant_id)
);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS workspace_id text REFERENCES workspaces(id);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS workspace_id text REFERENCES workspaces(id);
```

```js
export function mapWorkspaceRows(rows) {
  const workspaces = [];
  const byId = new Map();

  for (const row of rows) {
    if (!byId.has(row.id)) {
      const workspace = {
        id: row.id,
        type: row.type,
        name: row.name,
        status: row.status,
        stockMode: row.stockMode,
        isVisible: toBoolean(row.isVisible),
        locationLabel: row.locationLabel,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        assignedUserIds: [],
      };

      byId.set(row.id, workspace);
      workspaces.push(workspace);
    }

    if (row.assignedUserId) {
      byId.get(row.id).assignedUserIds.push(row.assignedUserId);
    }
  }

  return workspaces;
}
```

```js
async function fetchWorkspaces(executor) {
  const rows = await executor`
    SELECT
      w.id,
      w.type,
      w.name,
      w.status,
      w.stock_mode AS "stockMode",
      w.is_visible AS "isVisible",
      w.location_label AS "locationLabel",
      w.starts_at AS "startsAt",
      w.ends_at AS "endsAt",
      wa.user_id AS "assignedUserId"
    FROM workspaces w
    LEFT JOIN workspace_assignments wa ON wa.workspace_id = w.id
    ORDER BY w.type ASC, w.created_at DESC, wa.assigned_at ASC
  `;

  return mapWorkspaceRows(rows);
}

export async function getBootstrap({ workspaceId } = {}) {
  const executor = ensureSql();
  const settings = await fetchSettings(executor);
  const categories = await fetchCategories(executor);
  const users = await fetchUsers(executor);
  const products = await fetchProducts(executor);
  const promotions = await fetchPromotions(executor);
  const workspaces = await fetchWorkspaces(executor);
  const sales = await fetchSales(executor, workspaceId);
  const inventoryMovements = await fetchInventoryMovements(executor, workspaceId);

  return {
    settings,
    categories,
    users,
    products,
    promotions,
    workspaces,
    sales,
    inventoryMovements,
  };
}
```

```js
app.get(
  "/api/bootstrap",
  auth,
  asyncHandler(async (req, res) => {
    res.json({
      ok: true,
      data: await getBootstrap({
        workspaceId: req.query.workspaceId || null,
      }),
    });
  })
);
```

- [ ] **Step 4: Run tests to verify the new mapper passes**

Run: `node --test tests/server-mappers.test.js`
Expected: PASS for the existing mapper tests and the new workspace mapper test

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/202603310002_workspace_events.sql supabase/seed.sql server/mappers.js server/db.js server/index.js tests/server-mappers.test.js
git commit -m "feat: add workspace-aware backend bootstrap"
```

## Task 3: Add Workspace Resolution and Routing on the Frontend

**Files:**
- Create: `src/context/WorkspaceContext.jsx`
- Create: `src/pages/WorkspacePickerPage.jsx`
- Modify: `src/main.jsx`
- Modify: `src/app/App.jsx`
- Modify: `src/app/ProtectedRoute.jsx`
- Modify: `src/context/AuthContext.jsx`
- Modify: `src/context/PosDataContext.jsx`
- Modify: `src/api/client.js`

- [ ] **Step 1: Extend the failing workspace test with single-vs-multi workspace resolution**

```js
import { pickWorkspaceRedirect } from "../src/features/workspaces/workspaceGuards.js";

test("pickWorkspaceRedirect returns the selector route when more than one workspace is available", () => {
  const result = pickWorkspaceRedirect([
    { id: "store-main" },
    { id: "event-gi" },
  ]);

  assert.equal(result, "/workspace/select");
});

test("pickWorkspaceRedirect returns a single workspace route when only one workspace is available", () => {
  const result = pickWorkspaceRedirect([{ id: "store-main" }]);
  assert.equal(result, "/workspace/select?auto=store-main");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/workspace-guards.test.js`
Expected: FAIL because `pickWorkspaceRedirect` does not exist yet

- [ ] **Step 3: Implement the workspace context, routing, and bootstrap scoping**

```js
export function pickWorkspaceRedirect(workspaces) {
  if (workspaces.length === 1) {
    return `/workspace/select?auto=${workspaces[0].id}`;
  }

  return "/workspace/select";
}
```

```jsx
const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem("pos-workspace-id") || "");
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState(null);

  function selectWorkspace(workspaceId) {
    setActiveWorkspaceId(workspaceId);
    localStorage.setItem("pos-workspace-id", workspaceId);
  }

  function clearWorkspace() {
    setActiveWorkspaceId("");
    localStorage.removeItem("pos-workspace-id");
  }

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        pendingSwitchTarget,
        selectWorkspace,
        clearWorkspace,
        setPendingSwitchTarget,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
```

```jsx
const workspaceId = activeWorkspaceId || "";

async function reload() {
  setLoading(true);
  setLoadError("");

  try {
    const path = workspaceId ? `/api/bootstrap?workspaceId=${workspaceId}` : "/api/bootstrap";
    const payload = await apiGet(path);
    setState(payload.data);
  } catch (error) {
    setLoadError(error.message);
  } finally {
    setLoading(false);
  }
}
```

```jsx
<Route path="/workspace/select" element={<WorkspacePickerPage />} />

<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/checkout" element={<CheckoutPage />} />
</Route>
```

```jsx
if (!user) {
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

if (!activeWorkspaceId && location.pathname !== "/workspace/select") {
  return <Navigate to="/workspace/select" replace />;
}
```

- [ ] **Step 4: Run tests and build to verify the routing slice**

Run: `node --test tests/workspace-guards.test.js`
Expected: PASS, including the new `pickWorkspaceRedirect` assertions

Run: `npm run build`
Expected: Vite build completes without route or import errors

- [ ] **Step 5: Commit**

```bash
git add src/context/WorkspaceContext.jsx src/pages/WorkspacePickerPage.jsx src/main.jsx src/app/App.jsx src/app/ProtectedRoute.jsx src/context/AuthContext.jsx src/context/PosDataContext.jsx src/api/client.js src/features/workspaces/workspaceGuards.js tests/workspace-guards.test.js
git commit -m "feat: add workspace resolution flow"
```

## Task 4: Refresh the Shell and Dashboard Visual Hierarchy

**Files:**
- Create: `src/features/workspaces/components/WorkspaceSwitcher.jsx`
- Modify: `src/components/AppShell.jsx`
- Modify: `src/pages/DashboardPage.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Extract a failing dashboard summary test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardSummary } from "../src/features/events/eventHelpers.js";

test("buildDashboardSummary returns the three headline metrics for the active workspace", () => {
  const result = buildDashboardSummary({
    sales: [
      { createdAt: "2026-03-31T08:00:00.000Z", grandTotal: 250000, discountTotal: 10000 },
      { createdAt: "2026-03-31T09:00:00.000Z", grandTotal: 350000, discountTotal: 0 },
    ],
    variants: [
      { quantityOnHand: 2, lowStockThreshold: 3 },
      { quantityOnHand: 6, lowStockThreshold: 3 },
    ],
    now: "2026-03-31T12:00:00.000Z",
  });

  assert.deepEqual(result, {
    revenue: 600000,
    transactions: 2,
    lowStock: 1,
    discountTotal: 10000,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/event-helpers.test.js`
Expected: FAIL because `tests/event-helpers.test.js` and `src/features/events/eventHelpers.js` do not exist yet

- [ ] **Step 3: Implement the summary helper and the visual shell refresh**

```js
export function buildDashboardSummary({ sales, variants, now }) {
  const todayKey = new Date(now).toDateString();
  const todaySales = sales.filter((sale) => new Date(sale.createdAt).toDateString() === todayKey);

  return {
    revenue: todaySales.reduce((sum, sale) => sum + sale.grandTotal, 0),
    transactions: todaySales.length,
    lowStock: variants.filter((item) => item.quantityOnHand <= item.lowStockThreshold).length,
    discountTotal: sales.reduce((sum, sale) => sum + sale.discountTotal, 0),
  };
}
```

```jsx
<aside className="sidebar sidebar-compact">
  <div className="brand-block brand-block-compact">
    <span className="brand-mark">H</span>
    <div>
      <strong>Harness POS</strong>
      <p className="muted-text">Retail workspace</p>
    </div>
  </div>

  <WorkspaceSwitcher />

  <nav className="sidebar-nav sidebar-nav-grouped">
    <NavLink to="/checkout">Sell</NavLink>
    <NavLink to="/dashboard">Dashboard</NavLink>
    <NavLink to="/sales">Sales</NavLink>
    <NavLink to="/inventory">Inventory</NavLink>
  </nav>
</aside>
```

```jsx
<section className="dashboard-summary-band">
  <article className="summary-stat">
    <span className="stat-label">Revenue Today</span>
    <strong>{formatCurrency(summary.revenue)}</strong>
  </article>
  <article className="summary-stat">
    <span className="stat-label">Transactions</span>
    <strong>{summary.transactions}</strong>
  </article>
  <article className="summary-stat">
    <span className="stat-label">Low Stock</span>
    <strong>{summary.lowStock}</strong>
  </article>
</section>
```

```css
:root {
  --canvas: #f5f6f8;
  --surface: #ffffff;
  --surface-muted: #f0f2f5;
  --text: #111827;
  --muted: #6b7280;
  --primary: #0f766e;
  --primary-soft: rgba(15, 118, 110, 0.12);
  --line: rgba(17, 24, 39, 0.08);
  --shadow: 0 12px 36px rgba(17, 24, 39, 0.08);
}

.app-shell {
  grid-template-columns: 248px 1fr;
  gap: 16px;
  padding: 16px;
  background: var(--canvas);
}
```

- [ ] **Step 4: Run tests and build**

Run: `node --test tests/event-helpers.test.js`
Expected: PASS for `buildDashboardSummary`

Run: `npm run build`
Expected: PASS with the new shell and dashboard imports

- [ ] **Step 5: Commit**

```bash
git add src/features/events/eventHelpers.js tests/event-helpers.test.js src/features/workspaces/components/WorkspaceSwitcher.jsx src/components/AppShell.jsx src/pages/DashboardPage.jsx src/styles.css
git commit -m "feat: refresh shell and dashboard hierarchy"
```

## Task 5: Refresh Checkout and Guard Workspace Switching

**Files:**
- Modify: `src/pages/CheckoutPage.jsx`
- Modify: `src/features/checkout/components/CartSummary.jsx`
- Modify: `src/features/checkout/components/ProductSearchPanel.jsx`
- Modify: `src/features/checkout/components/ProductGrid.jsx`
- Modify: `src/features/checkout/components/LatestReceipt.jsx`
- Modify: `src/features/checkout/checkout.css`
- Modify: `tests/checkout-guards.test.js`

- [ ] **Step 1: Add the failing dirty-cart switch test**

```js
import { shouldConfirmWorkspaceSwitch } from "../src/features/workspaces/workspaceGuards.js";

test("shouldConfirmWorkspaceSwitch stays false on checkout when the cart is empty", () => {
  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/checkout",
      cartCount: 0,
      hasPendingEventClosing: false,
    }),
    false
  );
});
```

- [ ] **Step 2: Run the relevant tests to verify coverage before the UI refactor**

Run: `node --test tests/checkout-guards.test.js tests/workspace-guards.test.js`
Expected: PASS for the current checkout guards and the new empty-cart switch case after the helper is already in place

- [ ] **Step 3: Implement the denser checkout layout and switch guard wiring**

```jsx
<section className="checkout-context-strip">
  <div>
    <span className="eyebrow">Current workspace</span>
    <strong>{activeWorkspace?.name}</strong>
  </div>
  <div className="checkout-context-meta">
    <span className="badge-soft">{activeWorkspace?.type}</span>
    {activeWorkspace?.stockMode ? <span className="badge-soft">{activeWorkspace.stockMode}</span> : null}
  </div>
</section>
```

```jsx
<aside className="checkout-summary-card checkout-summary-sticky">
  <div className="checkout-panel-head">
    <h2>Cart</h2>
    <span className="badge-soft">{cart.length} items</span>
  </div>
  <div className="checkout-total-block">
    <span>Grand total</span>
    <strong>{formatCurrency(grandTotal)}</strong>
  </div>
  <button className="primary-button checkout-finalize-button" disabled={finalizeDisabled} onClick={onFinalize} type="button">
    {submitting ? "Saving..." : "Finalize sale"}
  </button>
</aside>
```

```css
.checkout-layout {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 16px;
}

.checkout-summary-sticky {
  position: sticky;
  top: 16px;
}

.checkout-product-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
```

- [ ] **Step 4: Run checkout tests and build**

Run: `node --test tests/checkout-guards.test.js tests/workspace-guards.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with the updated checkout component tree

- [ ] **Step 5: Commit**

```bash
git add src/pages/CheckoutPage.jsx src/features/checkout/components/CartSummary.jsx src/features/checkout/components/ProductSearchPanel.jsx src/features/checkout/components/ProductGrid.jsx src/features/checkout/components/LatestReceipt.jsx src/features/checkout/checkout.css tests/checkout-guards.test.js
git commit -m "feat: modernize checkout workspace layout"
```

## Task 6: Build Event Management and Stock Mode Flows

**Files:**
- Create: `src/pages/EventsPage.jsx`
- Create: `src/pages/EventDetailPage.jsx`
- Modify: `src/app/App.jsx`
- Modify: `src/context/PosDataContext.jsx`
- Modify: `server/db.js`
- Modify: `server/index.js`
- Modify: `src/features/events/eventHelpers.js`
- Modify: `tests/event-helpers.test.js`

- [ ] **Step 1: Add failing lifecycle tests**

```js
import { canTransitionEvent, getEventActionLabel } from "../src/features/events/eventHelpers.js";

test("canTransitionEvent allows draft events to move to active and blocks archived rollback", () => {
  assert.equal(canTransitionEvent("draft", "active"), true);
  assert.equal(canTransitionEvent("archived", "active"), false);
});

test("getEventActionLabel exposes stock-mode setup labels", () => {
  assert.equal(getEventActionLabel("allocate"), "Allocate from main stock");
  assert.equal(getEventActionLabel("manual"), "Manual event stock");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/event-helpers.test.js`
Expected: FAIL because the lifecycle helpers are not implemented yet

- [ ] **Step 3: Implement event APIs, helpers, and management pages**

```js
export function canTransitionEvent(currentStatus, nextStatus) {
  const transitions = {
    draft: new Set(["active", "archived"]),
    active: new Set(["closed"]),
    closed: new Set(["archived"]),
    archived: new Set([]),
  };

  return transitions[currentStatus]?.has(nextStatus) ?? false;
}

export function getEventActionLabel(stockMode) {
  return stockMode === "allocate" ? "Allocate from main stock" : "Manual event stock";
}
```

```js
export async function createEventRecord(payload, actorUserId) {
  const executor = ensureSql();
  const eventId = createId("workspace");

  await executor.begin(async (tx) => {
    await tx`
      INSERT INTO workspaces
      (id, type, name, code, status, stock_mode, location_label, starts_at, ends_at, is_visible, created_at)
      VALUES (
        ${eventId},
        ${"event"},
        ${payload.name},
        ${payload.code},
        ${"draft"},
        ${payload.stockMode},
        ${payload.locationLabel},
        ${payload.startsAt},
        ${payload.endsAt},
        ${true},
        ${nowIso()}
      )
    `;

    for (const userId of payload.assignedUserIds || []) {
      await tx`
        INSERT INTO workspace_assignments (id, workspace_id, user_id, assigned_at)
        VALUES (${createId("wa")}, ${eventId}, ${userId}, ${nowIso()})
      `;
    }
  });

  return { ok: true, eventId, actorUserId };
}

export async function updateEventStatusRecord(eventId, payload, actorUserId) {
  const executor = ensureSql();
  await executor`
    UPDATE workspaces
    SET status = ${payload.nextStatus}
    WHERE id = ${eventId} AND type = ${"event"}
  `;

  return { ok: true, actorUserId };
}
```

```js
<Route element={<ProtectedRoute allow={["admin", "manager"]} />}>
  <Route path="/events" element={<EventsPage />} />
  <Route path="/events/:eventId" element={<EventDetailPage />} />
</Route>
```

```js
app.post(
  "/api/events",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await createEventRecord(req.body, req.auth.user.id);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap({ workspaceId: req.body.workspaceId || null }) });
  })
);

app.patch(
  "/api/events/:id/status",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await updateEventStatusRecord(req.params.id, req.body, req.auth.user.id);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap({ workspaceId: req.body.workspaceId || null }) });
  })
);
```

```jsx
<section className="page-header-card">
  <div>
    <p className="eyebrow">Events</p>
    <h1>Manage bazaar workspaces and selling readiness.</h1>
    <p className="muted-text">Draft, activate, close, and archive event workspaces from one operational screen.</p>
  </div>
  <button className="primary-button" type="button">Create event</button>
</section>
```

- [ ] **Step 4: Run tests and build**

Run: `node --test tests/event-helpers.test.js tests/server-mappers.test.js`
Expected: PASS

Run: `npm run build`
Expected: PASS with the new event routes and pages

- [ ] **Step 5: Commit**

```bash
git add src/pages/EventsPage.jsx src/pages/EventDetailPage.jsx src/app/App.jsx src/context/PosDataContext.jsx server/db.js server/index.js src/features/events/eventHelpers.js tests/event-helpers.test.js
git commit -m "feat: add event management flows"
```

## Task 7: Implement Event Closing Flow and Workspace-Scoped Finalization

**Files:**
- Create: `src/pages/EventClosingPage.jsx`
- Modify: `src/context/PosDataContext.jsx`
- Modify: `src/pages/ReportsPage.jsx`
- Modify: `src/pages/InventoryPage.jsx`
- Modify: `server/db.js`
- Modify: `server/index.js`
- Modify: `tests/event-helpers.test.js`

- [ ] **Step 1: Add failing closing-readiness tests**

```js
import { canCompleteClosingReview } from "../src/features/events/eventHelpers.js";

test("canCompleteClosingReview requires sales, stock, and payment review steps", () => {
  assert.equal(
    canCompleteClosingReview({
      salesReviewed: true,
      stockReviewed: true,
      paymentReviewed: false,
    }),
    false
  );

  assert.equal(
    canCompleteClosingReview({
      salesReviewed: true,
      stockReviewed: true,
      paymentReviewed: true,
    }),
    true
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/event-helpers.test.js`
Expected: FAIL because `canCompleteClosingReview` does not exist yet

- [ ] **Step 3: Implement closing helpers, backend transition guard, and review UI**

```js
export function canCompleteClosingReview({ salesReviewed, stockReviewed, paymentReviewed }) {
  return salesReviewed && stockReviewed && paymentReviewed;
}
```

```js
export async function finalizeSaleRecord(payload, actorUserId) {
  const executor = ensureSql();
  const workspaceId = payload.workspaceId;

  if (!workspaceId) {
    return { ok: false, message: "Workspace wajib dipilih sebelum transaksi." };
  }

  const workspaceRows = await executor`
    SELECT id, type
    FROM workspaces
    WHERE id = ${workspaceId}
    LIMIT 1
  `;
  const workspace = workspaceRows[0];

  if (!workspace) {
    return { ok: false, message: "Workspace tidak ditemukan." };
  }

  return executor.begin(async (tx) => {
    const stockRows =
      workspace.type === "event"
        ? await tx`
            SELECT variant_id AS "variantId", quantity_on_hand AS "quantityOnHand"
            FROM workspace_variant_stocks
            WHERE workspace_id = ${workspace.id}
          `
        : await tx`
            SELECT id AS "variantId", quantity_on_hand AS "quantityOnHand"
            FROM product_variants
          `;

    const stockByVariantId = new Map(stockRows.map((row) => [row.variantId, row.quantityOnHand]));

    for (const item of payload.cart) {
      if ((stockByVariantId.get(item.variantId) || 0) < item.qty) {
        throw new Error("Stock workspace tidak cukup untuk transaksi ini.");
      }
    }

    for (const item of payload.cart) {
      if (workspace.type === "event") {
        await tx`
          UPDATE workspace_variant_stocks
          SET quantity_on_hand = quantity_on_hand - ${item.qty}, updated_at = ${nowIso()}
          WHERE workspace_id = ${workspace.id} AND variant_id = ${item.variantId}
        `;
      } else {
        await tx`
          UPDATE product_variants
          SET quantity_on_hand = quantity_on_hand - ${item.qty}
          WHERE id = ${item.variantId}
        `;
      }

      await tx`
        INSERT INTO inventory_movements
        (id, variant_id, workspace_id, type, qty_delta, note, actor_user_id, reference_id, created_at)
        VALUES (
          ${createId("mov")},
          ${item.variantId},
          ${workspace.id},
          ${"sale"},
          ${item.qty * -1},
          ${`Sale in ${workspace.id}`},
          ${actorUserId},
          ${null},
          ${nowIso()}
        )
      `;
    }

    return { ok: true };
  });
}
```

```js
export async function closeEventRecord(eventId, payload, actorUserId) {
  if (!canCompleteClosingReview(payload)) {
    return { ok: false, message: "Review penutupan event belum lengkap." };
  }

  const executor = ensureSql();
  await executor`
    UPDATE workspaces
    SET status = ${"closed"}, closed_at = ${nowIso()}
    WHERE id = ${eventId} AND type = ${"event"}
  `;

  return { ok: true, actorUserId };
}
```

```js
app.post(
  "/api/events/:id/close",
  auth,
  requireRole(["admin", "manager"]),
  asyncHandler(async (req, res) => {
    const result = await closeEventRecord(req.params.id, req.body, req.auth.user.id);
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }

    res.json({ ok: true, data: await getBootstrap({ workspaceId: req.body.workspaceId || null }) });
  })
);
```

```jsx
<section className="closing-step-list">
  <article className="panel-card">
    <h2>1. Sales Summary</h2>
    <button className="secondary-button" type="button" onClick={() => markStep("salesReviewed")}>
      Confirm sales summary
    </button>
  </article>
  <article className="panel-card">
    <h2>2. Remaining Stock</h2>
    <button className="secondary-button" type="button" onClick={() => markStep("stockReviewed")}>
      Confirm stock review
    </button>
  </article>
  <article className="panel-card">
    <h2>3. Cash/Card Reconciliation</h2>
    <button className="secondary-button" type="button" onClick={() => markStep("paymentReviewed")}>
      Confirm payment reconciliation
    </button>
  </article>
</section>
```

- [ ] **Step 4: Run the full test suite and build**

Run: `npm test`
Expected: PASS for all `tests/*.test.js`

Run: `npm run build`
Expected: PASS with event closing flow, inventory scoping, and reports scoping

- [ ] **Step 5: Commit**

```bash
git add src/pages/EventClosingPage.jsx src/context/PosDataContext.jsx src/pages/ReportsPage.jsx src/pages/InventoryPage.jsx server/db.js server/index.js tests/event-helpers.test.js
git commit -m "feat: add event closing flow"
```

## Task 8: Update Architecture Documentation and Run Final Verification

**Files:**
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Document the new workspace domain**

```md
## Workspace Model

The platform now scopes operational data through `WorkspaceContext`.

- `Store` workspaces represent permanent selling locations.
- `Event` workspaces represent temporary bazaar or pop-up selling contexts.
- authenticated users must resolve a workspace before entering the shell
- dashboard, checkout, inventory, and reports all read from the active workspace
```

- [ ] **Step 2: Run final verification commands**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Review the changed files for route and workspace consistency**

```bash
git diff -- src/app/App.jsx src/app/ProtectedRoute.jsx src/context/WorkspaceContext.jsx src/context/PosDataContext.jsx server/index.js server/db.js
```

Expected: Every route and server endpoint should either read `workspaceId` directly or derive behavior from the active workspace model.

- [ ] **Step 4: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: document workspace event architecture"
```

## Self-Review Notes

### Spec Coverage

- Workspace model: covered in Tasks 1-3
- Event lifecycle and stock mode: covered in Tasks 2, 6, and 7
- Login -> workspace resolution -> role landing: covered in Task 3
- Shell, dashboard, checkout refresh: covered in Tasks 4 and 5
- Event management and closing flow: covered in Tasks 6 and 7
- Reports and inventory scoping: covered in Task 7

### Placeholder Scan

The plan uses concrete file paths, helper names, route names, SQL tables, test files, and commands. No `TBD`, `TODO`, or "implement later" placeholders remain.

### Type Consistency

- Workspace status values stay lowercase across helpers, SQL, and routes: `draft`, `active`, `closed`, `archived`
- Stock modes stay lowercase across helpers and SQL: `allocate`, `manual`
- Active workspace is tracked as `activeWorkspaceId` in the frontend and `workspaceId` in API payload/query usage
