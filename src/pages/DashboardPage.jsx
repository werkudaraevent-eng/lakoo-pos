import { useMemo } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { buildDashboardCommandStrip, buildDashboardHeroMetrics } from "../features/dashboard/dashboardWorkspace";
import { buildDashboardSummary, buildEventProgress } from "../features/events/eventHelpers";
import { formatCurrency, formatDate } from "../utils/formatters";

function formatWorkspaceType(type) {
  if (type === "event") {
    return "Event workspace";
  }

  if (type === "store") {
    return "Store workspace";
  }

  return "Workspace";
}

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sortByNewest(items) {
  return [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function buildTopItems(sales) {
  const tally = new Map();

  sales.forEach((sale) => {
    (Array.isArray(sale.items) ? sale.items : []).forEach((item) => {
      tally.set(item.productNameSnapshot, (tally.get(item.productNameSnapshot) || 0) + item.qty);
    });
  });

  return [...tally.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4);
}

function buildLowStockItems(variants) {
  return [...variants]
    .filter((item) => item.quantityOnHand <= item.lowStockThreshold)
    .sort((left, right) => left.quantityOnHand - right.quantityOnHand)
    .slice(0, 5);
}

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
                    <p className="muted-text">{sale.cashierUser} / {formatDate(sale.createdAt)}</p>
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
                    <p className="muted-text">{movement.actorUser} / {formatDate(movement.createdAt)}</p>
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
