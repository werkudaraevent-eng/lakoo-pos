# POS Executive Retail Shell Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app shell and dashboard into an executive retail surface that matches the Banani checkout reference and puts sales performance first for manager and admin users.

**Architecture:** Keep the existing route structure, workspace model, and event-aware dashboard behavior, but replace the current shell hierarchy and dashboard composition with a warmer neutral visual system. Implement this in three vertical slices: dashboard helpers first, shell chrome second, and the dashboard page plus responsive CSS last so each step remains testable and buildable.

**Tech Stack:** Vite, React 19, React Router 7, plain CSS, `node:test`

---

## Scope Notes

This plan intentionally stays inside the shell and dashboard surfaces from the approved spec.

It does not include:

- checkout implementation changes
- sales, inventory, events, or reports redesign
- backend or API changes
- route or permission changes

Banani is used here as the visual reference source. The implementation work happens in React and CSS because the current tool access allows reading Banani selections, not writing new Banani screens directly.

## File Structure

### Dashboard Helpers

- Modify: `src/features/dashboard/dashboardWorkspace.js`
  Replace the flat KPI band helper with an executive-hero helper while preserving command strip behavior.
- Modify: `tests/dashboard-workspace.test.js`
  Covers the new executive hero metrics and keeps the event-aware command strip test.

### Shell

- Modify: `src/features/shell/shellLayout.js`
  Tightens dashboard route copy so the shell context matches the executive retail direction.
- Modify: `tests/shell-layout.test.js`
  Covers the revised dashboard shell metadata.
- Modify: `src/components/AppShell.jsx`
  Rebuilds the sidebar and topbar hierarchy to match the warmer, thinner shell.
- Modify: `src/features/workspaces/components/WorkspaceSwitcher.jsx`
  Reshapes workspace context into a premium system card with restrained badges.

### Dashboard Surface

- Modify: `src/pages/DashboardPage.jsx`
  Reorders the page around a compact header, quick action strip, executive performance hero, and supporting insight grid.
- Modify: `src/styles.css`
  Replaces the current teal-heavy shell and equal-weight dashboard cards with the executive retail visual system.

## Task 1: Replace the Flat Dashboard KPI Helper With an Executive Hero Helper

**Files:**
- Modify: `src/features/dashboard/dashboardWorkspace.js`
- Modify: `tests/dashboard-workspace.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDashboardCommandStrip,
  buildDashboardHeroMetrics,
} from "../src/features/dashboard/dashboardWorkspace.js";

test("buildDashboardCommandStrip returns event-aware actions for active workspaces", () => {
  const result = buildDashboardCommandStrip({ id: "event-gi", type: "event", status: "active" });

  assert.deepEqual(result.map((item) => item.label), [
    "Open checkout",
    "View sales",
    "Adjust stock",
    "Close event",
  ]);
});

test("buildDashboardHeroMetrics returns revenue-led executive metrics", () => {
  const result = buildDashboardHeroMetrics({
    revenue: 900000,
    transactions: 3,
    discountTotal: 60000,
  });

  assert.deepEqual(result, {
    primary: {
      label: "Revenue today",
      value: 900000,
      kind: "currency",
      meta: "3 transactions today",
    },
    secondary: [
      {
        label: "Transactions",
        value: 3,
        kind: "count",
        meta: "Completed sales today.",
      },
      {
        label: "Average order value",
        value: 300000,
        kind: "currency",
        meta: "Average basket across finalized sales.",
      },
      {
        label: "Discount total",
        value: 60000,
        kind: "currency",
        meta: "Applied across finalized sales today.",
      },
    ],
  });
});

test("buildDashboardHeroMetrics falls back to zero average order value when there are no transactions", () => {
  const result = buildDashboardHeroMetrics({
    revenue: 0,
    transactions: 0,
    discountTotal: 0,
  });

  assert.equal(result.secondary[1].value, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/dashboard-workspace.test.js`
Expected: FAIL because `buildDashboardHeroMetrics` is not exported from `src/features/dashboard/dashboardWorkspace.js`

- [ ] **Step 3: Write minimal implementation**

```js
export function buildDashboardCommandStrip(workspace) {
  const commands = [
    { label: "Open checkout", href: "/checkout" },
    { label: "View sales", href: "/sales" },
    { label: "Adjust stock", href: "/inventory" },
  ];

  if (workspace?.type === "event" && workspace?.status === "active") {
    commands.push({ label: "Close event", href: `/events/${workspace.id}/close`, tone: "warning" });
  } else {
    commands.push({ label: "View events", href: "/events" });
  }

  return commands;
}

export function buildDashboardHeroMetrics({ revenue = 0, transactions = 0, discountTotal = 0 } = {}) {
  const averageOrderValue = transactions > 0 ? Math.round(revenue / transactions) : 0;

  return {
    primary: {
      label: "Revenue today",
      value: revenue,
      kind: "currency",
      meta: `${transactions} transactions today`,
    },
    secondary: [
      {
        label: "Transactions",
        value: transactions,
        kind: "count",
        meta: "Completed sales today.",
      },
      {
        label: "Average order value",
        value: averageOrderValue,
        kind: "currency",
        meta: "Average basket across finalized sales.",
      },
      {
        label: "Discount total",
        value: discountTotal,
        kind: "currency",
        meta: "Applied across finalized sales today.",
      },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/dashboard-workspace.test.js`
Expected: PASS for the command strip test and both executive hero metric tests

- [ ] **Step 5: Commit**

```bash
git add tests/dashboard-workspace.test.js src/features/dashboard/dashboardWorkspace.js
git commit -m "feat: add executive dashboard hero metrics"
```

## Task 2: Refresh the Shell Hierarchy Around a Premium Workspace Context

**Files:**
- Modify: `src/features/shell/shellLayout.js`
- Modify: `tests/shell-layout.test.js`
- Modify: `src/components/AppShell.jsx`
- Modify: `src/features/workspaces/components/WorkspaceSwitcher.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Extend the failing shell metadata test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { getShellRouteMeta, getShellTone } from "../src/features/shell/shellLayout.js";

test("getShellTone keeps checkout and sales in compact operational mode", () => {
  assert.equal(getShellTone("/checkout"), "compact");
  assert.equal(getShellTone("/sales"), "compact");
  assert.equal(getShellTone("/dashboard"), "default");
});

test("getShellRouteMeta returns executive retail copy for the dashboard", () => {
  assert.deepEqual(getShellRouteMeta("/dashboard"), {
    eyebrow: "Dashboard",
    title: "Executive retail overview",
    description: "Track revenue, product momentum, and workspace health from one sales-first view.",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/shell-layout.test.js`
Expected: FAIL on the dashboard metadata assertion because the current dashboard title and description still use the old copy

- [ ] **Step 3: Update shell route copy and rebuild the shell structure**

```js
const ROUTE_META = [
  {
    match: (pathname) => pathname.startsWith("/dashboard"),
    meta: {
      eyebrow: "Dashboard",
      title: "Executive retail overview",
      description: "Track revenue, product momentum, and workspace health from one sales-first view.",
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
```

```jsx
export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentRoute = getShellRouteMeta(location.pathname);
  const shellTone = getShellTone(location.pathname);
  const allowedGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className={`app-shell app-shell-${shellTone}`}>
      <aside className="sidebar sidebar-executive-shell">
        <div className="brand-block brand-block-executive">
          <div className="brand-badge brand-badge-neutral">H</div>
          <div className="brand-copy">
            <p className="eyebrow">Harness POS</p>
            <h1>Retail OS</h1>
          </div>
        </div>

        <WorkspaceSwitcher />

        <nav className="sidebar-nav sidebar-nav-grouped" aria-label="Primary">
          {allowedGroups.map((group) => (
            <section className="sidebar-group" key={group.label}>
              <p className="sidebar-section-title">{group.label}</p>
              <div className="sidebar-group-links">
                {group.items.map((item) => (
                  <NavLink
                    className={({ isActive }) => `sidebar-link sidebar-link-executive${isActive ? " is-active" : ""}`}
                    key={item.to}
                    to={item.to}
                    end={item.to !== "/sales"}
                  >
                    <span className="sidebar-link-label">{item.label}</span>
                    <span className="sidebar-link-support">{item.description}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-user sidebar-user-executive">
          <div className="sidebar-user-head">
            <div>
              <strong>{user.name}</strong>
              <p className="muted-text">@{user.username}</p>
            </div>
            <span className="role-pill">{user.role}</span>
          </div>
          <button className="ghost-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar-app topbar-app-executive">
          <div className="shell-heading">
            <p className="eyebrow">{currentRoute.eyebrow}</p>
            <h2>{currentRoute.title}</h2>
            <p className="shell-subtitle">{currentRoute.description}</p>
          </div>
          <div className="topbar-context topbar-context-executive">
            <span className="role-pill">{user.role}</span>
            <p className="muted-text">Signed in as {user.username}</p>
          </div>
        </header>

        <div className="page-shell">{children}</div>
      </div>
    </div>
  );
}
```

```jsx
export function WorkspaceSwitcher() {
  const location = useLocation();
  const { user } = useAuth();
  const { workspaces, loading } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
  const activeWorkspace =
    accessibleWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    null;
  const statusLabel = formatWorkspaceStatus(activeWorkspace?.eventStatus ?? activeWorkspace?.status);
  const stockModeLabel = formatStockMode(activeWorkspace?.stockMode);
  const canSwitch = accessibleWorkspaces.length > 1;

  function handleSwitchClick(event) {
    const cartCount =
      typeof window === "undefined"
        ? 0
        : Number(window.sessionStorage.getItem(CHECKOUT_CART_COUNT_STORAGE_KEY) || 0);
    const requiresConfirm = shouldConfirmWorkspaceSwitch({
      currentPath: location.pathname,
      cartCount: Number.isFinite(cartCount) ? cartCount : 0,
    });

    if (
      requiresConfirm &&
      typeof window !== "undefined" &&
      !window.confirm("The current checkout cart still has items. Switch workspace anyway?")
    ) {
      event.preventDefault();
    }
  }

  return (
    <section className="workspace-switcher workspace-switcher-executive">
      <div className="workspace-switcher-head">
        <div>
          <p className="eyebrow">Current Workspace</p>
          <strong className="workspace-switcher-title">
            {activeWorkspace?.name || (loading ? "Loading workspace..." : "No workspace selected")}
          </strong>
          {activeWorkspace ? (
            <p className="workspace-switcher-subtitle">
              Sales and stock context for the current session.
            </p>
          ) : null}
        </div>

        <Link
          className="secondary-button small-button workspace-switcher-button"
          onClick={handleSwitchClick}
          to="/workspace/select"
          state={{ from: `${location.pathname}${location.search}` }}
        >
          {canSwitch ? "Switch" : "Open"}
        </Link>
      </div>

      {activeWorkspace ? (
        <div className="workspace-switcher-meta">
          <span className="badge-soft">{formatWorkspaceType(activeWorkspace.type)}</span>
          {statusLabel ? <span className="badge-soft">{statusLabel}</span> : null}
          {stockModeLabel ? <span className="badge-soft">{stockModeLabel}</span> : null}
        </div>
      ) : (
        <p className="muted-text workspace-switcher-empty">
          Select a workspace to scope dashboard, sales, and inventory data.
        </p>
      )}
    </section>
  );
}
```

```css
:root {
  --bg: #f3efe8;
  --bg-soft: #f8f4ee;
  --panel: rgba(255, 252, 248, 0.94);
  --panel-strong: #fffdfa;
  --sidebar: #f8f4ee;
  --sidebar-soft: #f2ece4;
  --text: #231f1b;
  --text-soft: #746b61;
  --line: rgba(35, 31, 27, 0.12);
  --accent: #2f2923;
  --accent-deep: #1f1a16;
  --accent-soft: rgba(47, 41, 35, 0.08);
  --shadow: 0 10px 30px rgba(35, 31, 27, 0.04);
}

.sidebar-executive-shell {
  gap: 14px;
  padding: 18px 16px;
  background:
    linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-soft) 100%);
}

.brand-badge-neutral {
  background: var(--accent);
}

.sidebar-link-executive.is-active {
  transform: none;
  color: var(--panel-strong);
  border-color: var(--accent);
  background: var(--accent);
}

.workspace-switcher-executive,
.sidebar-user-executive,
.topbar-app-executive {
  background: rgba(255, 253, 250, 0.82);
  backdrop-filter: blur(8px);
}
```

- [ ] **Step 4: Run tests and build**

Run: `node --test tests/shell-layout.test.js`
Expected: PASS for both shell tone and dashboard metadata tests

Run: `npm run build`
Expected: PASS with the revised shell imports, class names, and workspace switcher structure

- [ ] **Step 5: Commit**

```bash
git add tests/shell-layout.test.js src/features/shell/shellLayout.js src/components/AppShell.jsx src/features/workspaces/components/WorkspaceSwitcher.jsx src/styles.css
git commit -m "feat: redesign executive shell chrome"
```

## Task 3: Rebuild the Dashboard Around a Revenue-Led Executive Composition

**Files:**
- Modify: `src/pages/DashboardPage.jsx`
- Modify: `src/styles.css`
- Modify: `src/features/dashboard/dashboardWorkspace.js`
- Modify: `tests/dashboard-workspace.test.js`

- [ ] **Step 1: Extend the failing dashboard helper test with event fallback coverage**

```js
import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboardHeroMetrics } from "../src/features/dashboard/dashboardWorkspace.js";

test("buildDashboardHeroMetrics keeps revenue primary even when discount total is zero", () => {
  const result = buildDashboardHeroMetrics({
    revenue: 250000,
    transactions: 1,
    discountTotal: 0,
  });

  assert.deepEqual(result.primary, {
    label: "Revenue today",
    value: 250000,
    kind: "currency",
    meta: "1 transactions today",
  });
});
```

- [ ] **Step 2: Run test to verify current helper behavior before the page refactor**

Run: `node --test tests/dashboard-workspace.test.js`
Expected: PASS after Task 1, including the new primary-metric assertion

- [ ] **Step 3: Rebuild the dashboard page**

```jsx
export function DashboardPage() {
  const { sales, variants, inventoryMovements, workspaces, loading, loadError } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const summary = buildDashboardSummary({
    sales,
    variants,
    now: new Date().toISOString(),
  });
  const eventProgress = buildEventProgress({
    workspace: activeWorkspace,
    now: new Date().toISOString(),
  });
  const commandStrip = useMemo(() => buildDashboardCommandStrip(activeWorkspace), [activeWorkspace]);
  const heroMetrics = useMemo(() => buildDashboardHeroMetrics(summary), [summary]);
  const workspaceStatus = formatLabel(activeWorkspace?.eventStatus ?? activeWorkspace?.status);
  const topItems = buildTopItems(sales);
  const lowStockItems = buildLowStockItems(variants);
  const recentSales = sortByNewest(sales).slice(0, 5);
  const recentMovements = sortByNewest(inventoryMovements).slice(0, 5);

  return (
    <div className="page-stack dashboard-workspace dashboard-workspace-executive">
      <section className="page-header-card dashboard-header dashboard-header-executive">
        <div className="dashboard-header-copy">
          <p className="eyebrow">Dashboard</p>
          <h1>{activeWorkspace?.name ? `${activeWorkspace.name} performance` : "Executive retail overview"}</h1>
          <p className="muted-text">
            Revenue, product momentum, and workspace health in one sales-first surface.
          </p>
        </div>

        <div className="dashboard-header-meta">
          {activeWorkspace?.type ? <span className="badge-soft">{formatWorkspaceType(activeWorkspace.type)}</span> : null}
          {workspaceStatus ? <span className="badge-soft">{workspaceStatus}</span> : null}
        </div>
      </section>

      {loading ? <p className="info-text">Loading dashboard data...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="panel-card dashboard-command-strip dashboard-command-strip-executive">
        {commandStrip.map((command) => (
          <Link
            className={`dashboard-command${command.tone ? ` dashboard-command-${command.tone}` : ""}`}
            key={command.label}
            to={command.href}
          >
            <span>{command.label}</span>
          </Link>
        ))}
      </section>

      <section className="dashboard-hero-grid">
        <article className="panel-card dashboard-hero-primary">
          <span className="stat-label">{heroMetrics.primary.label}</span>
          <strong>{formatCurrency(heroMetrics.primary.value)}</strong>
          <p className="summary-band-meta">{heroMetrics.primary.meta}</p>
        </article>

        <div className="dashboard-hero-secondary">
          {heroMetrics.secondary.map((item) => (
            <article className="panel-card dashboard-hero-stat" key={item.label}>
              <span className="stat-label">{item.label}</span>
              <strong>{item.kind === "currency" ? formatCurrency(item.value) : item.value}</strong>
              <p className="summary-band-meta">{item.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-grid dashboard-layout dashboard-layout-executive">
        <article className="panel-card dashboard-panel dashboard-panel-feature">
          <div className="panel-head">
            <h2>Top products</h2>
            <span className="badge-soft">{topItems.length} best sellers</span>
          </div>

          <div className="stack-list dashboard-stack-list">
            {topItems.length > 0 ? (
              topItems.map(([name, qty]) => (
                <div className="list-row dashboard-list-row" key={name}>
                  <div>
                    <strong>{name}</strong>
                    <p className="muted-text">Units sold across completed sales</p>
                  </div>
                  <span className="pill-strong">{qty}</span>
                </div>
              ))
            ) : (
              <p className="stack-empty">Top products will appear after the first completed checkout.</p>
            )}
          </div>
        </article>

        <article className="panel-card dashboard-panel">
          <div className="panel-head">
            <h2>Stock watchlist</h2>
            <span className={`badge-soft${summary.lowStock > 0 ? " warning" : ""}`}>
              {summary.lowStock > 0 ? "Needs action" : "Stable"}
            </span>
          </div>

          <div className="stack-list dashboard-stack-list">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div className="list-row dashboard-list-row" key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <p className="muted-text">
                      {item.size} / {item.color} / {item.sku}
                    </p>
                  </div>
                  <span className="pill-warning">{item.quantityOnHand} pcs</span>
                </div>
              ))
            ) : (
              <p className="stack-empty">No urgent stock pressure in this workspace.</p>
            )}
          </div>
        </article>
      </section>

      <section className="content-grid dashboard-layout dashboard-layout-tight dashboard-layout-executive-secondary">
        <article className="panel-card dashboard-panel">
          <div className="panel-head">
            <h2>Recent sales</h2>
            <span className="badge-soft">{recentSales.length} receipts</span>
          </div>

          <div className="table-list dashboard-table-list">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div className="table-row dashboard-table-row" key={sale.id}>
                  <div>
                    <strong>{sale.receiptNumber}</strong>
                    <p className="muted-text">
                      {sale.cashierUser} / {formatDate(sale.createdAt)}
                    </p>
                  </div>
                  <span>{formatCurrency(sale.grandTotal)}</span>
                </div>
              ))
            ) : (
              <p className="stack-empty">No finalized sales yet for this workspace.</p>
            )}
          </div>
        </article>

        <article className="panel-card dashboard-panel">
          <div className="panel-head">
            <h2>Workspace activity</h2>
            <span className="badge-soft">{recentMovements.length} updates</span>
          </div>

          <div className="table-list dashboard-table-list">
            {recentMovements.length > 0 ? (
              recentMovements.map((movement) => (
                <div className="table-row dashboard-table-row" key={movement.id}>
                  <div>
                    <strong>{movement.type}</strong>
                    <p className="muted-text">
                      {movement.actorUser} / {formatDate(movement.createdAt)}
                    </p>
                  </div>
                  <span className={movement.qtyDelta < 0 ? "text-danger" : "text-success"}>
                    {movement.qtyDelta > 0 ? "+" : ""}
                    {movement.qtyDelta}
                  </span>
                </div>
              ))
            ) : (
              <p className="stack-empty">Inventory updates will appear once activity starts.</p>
            )}
          </div>
        </article>
      </section>

      {activeWorkspace?.type === "event" && eventProgress ? (
        <section className="panel-card dashboard-event-strip dashboard-event-strip-executive">
          <div className="dashboard-event-copy">
            <p className="eyebrow">Event progress</p>
            <h2>{activeWorkspace.name}</h2>
            <p className="muted-text">Selling window progress for the active event workspace.</p>
          </div>

          <div className="dashboard-event-track" aria-hidden="true">
            <span className="event-progress-fill" style={{ width: `${eventProgress.progressPercent}%` }} />
          </div>

          <div className="dashboard-event-meta">
            <div className="summary-row">
              <span className="muted-text">Phase</span>
              <strong>{eventProgress.phase}</strong>
            </div>
            <div className="summary-row">
              <span className="muted-text">Progress</span>
              <strong>{eventProgress.progressPercent}%</strong>
            </div>
            <div className="summary-row total">
              <span className="muted-text">Remaining</span>
              <strong>{eventProgress.remainingHours}h</strong>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

```css
.dashboard-workspace-executive .panel-card,
.dashboard-workspace-executive .page-header-card {
  box-shadow: none;
  background: rgba(255, 253, 250, 0.96);
}

.dashboard-header-executive {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
}

.dashboard-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
  gap: 14px;
}

.dashboard-hero-primary,
.dashboard-hero-stat {
  border: 1px solid rgba(35, 31, 27, 0.08);
  border-radius: 22px;
  background: rgba(255, 253, 250, 0.96);
}

.dashboard-hero-primary {
  display: grid;
  gap: 10px;
  padding: 24px;
}

.dashboard-hero-primary strong {
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 0.95;
}

.dashboard-hero-secondary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.dashboard-hero-stat {
  display: grid;
  gap: 6px;
  padding: 18px;
}

.dashboard-layout-executive {
  grid-template-columns: minmax(0, 1.06fr) minmax(320px, 0.94fr);
}

.dashboard-panel-feature {
  min-height: 100%;
}

.dashboard-event-strip-executive {
  gap: 14px;
  padding: 18px 20px;
}

@media (max-width: 1180px) {
  .dashboard-hero-grid,
  .dashboard-layout-executive,
  .dashboard-layout-executive-secondary {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run tests and build**

Run: `node --test tests/dashboard-workspace.test.js tests/event-helpers.test.js`
Expected: PASS for the executive dashboard helper tests and existing event summary tests

Run: `npm run build`
Expected: PASS with the new dashboard hierarchy and CSS classes

- [ ] **Step 5: Commit**

```bash
git add src/pages/DashboardPage.jsx src/styles.css src/features/dashboard/dashboardWorkspace.js tests/dashboard-workspace.test.js
git commit -m "feat: redesign executive retail dashboard"
```

## Self-Review Notes

### Spec Coverage

- shell visual direction: covered in Task 2
- workspace switcher as system context: covered in Task 2
- dashboard compact header and quick action strip: covered in Task 3
- revenue-led performance hero with average order value: covered in Tasks 1 and 3
- supporting insight grid with top products, recent sales, stock watchlist, and workspace activity: covered in Task 3
- secondary event module placement: covered in Task 3
- warm neutral executive visual system: covered in Tasks 2 and 3
- responsive behavior for shell and dashboard: covered in Task 3

### Placeholder Scan

The plan includes exact file paths, test files, helper names, JSX structures, CSS classes, commands, and commit messages. No `TODO`, `TBD`, or deferred implementation placeholders remain.

### Type Consistency

- executive dashboard helper name remains `buildDashboardHeroMetrics` across tests, helper implementation, and page usage
- command strip helper name remains `buildDashboardCommandStrip`
- shell helper names remain `getShellTone` and `getShellRouteMeta`
- workspace switcher continues to read `activeWorkspaceId`, `stockMode`, and `eventStatus` from the current frontend data model
