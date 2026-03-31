import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
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
  const workspaceStatus = formatLabel(activeWorkspace?.eventStatus ?? activeWorkspace?.status);
  const topItems = (() => {
    const tally = new Map();

    sales.forEach((sale) => {
      (Array.isArray(sale.items) ? sale.items : []).forEach((item) => {
        tally.set(item.productNameSnapshot, (tally.get(item.productNameSnapshot) || 0) + item.qty);
      });
    });

    return [...tally.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4);
  })();
  const lowStockItems = [...variants]
    .filter((item) => item.quantityOnHand <= item.lowStockThreshold)
    .sort((left, right) => left.quantityOnHand - right.quantityOnHand)
    .slice(0, 5);
  const recentSales = sortByNewest(sales).slice(0, 5);
  const recentMovements = sortByNewest(inventoryMovements).slice(0, 5);

  return (
    <div className="page-stack">
      <section className="page-header-card dashboard-header">
        <div className="dashboard-header-copy">
          <p className="eyebrow">Dashboard</p>
          <h1>
            {activeWorkspace?.name ? `${activeWorkspace.name} at a glance.` : "Workspace pulse at a glance."}
          </h1>
          <p className="muted-text">
            Daily revenue, selling flow, and replenishment pressure for the active workspace in one compact view.
          </p>
        </div>

        <div className="dashboard-header-meta">
          {activeWorkspace?.type ? (
            <span className="badge-soft">{formatWorkspaceType(activeWorkspace.type)}</span>
          ) : null}
          {workspaceStatus ? <span className="badge-soft">{workspaceStatus}</span> : null}
        </div>
      </section>

      {loading ? <p className="info-text">Loading dashboard data...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="dashboard-summary-band">
        <article className="stat-card summary-band-card">
          <span className="stat-label">Revenue today</span>
          <strong>{formatCurrency(summary.revenue)}</strong>
          <p className="summary-band-meta">
            Discounts recorded: {formatCurrency(summary.discountTotal)}
          </p>
        </article>

        <article className="stat-card summary-band-card">
          <span className="stat-label">Transactions</span>
          <strong>{summary.transactions}</strong>
          <p className="summary-band-meta">Completed sales for the current day.</p>
        </article>

        <article className="stat-card summary-band-card">
          <span className="stat-label">Low-stock variants</span>
          <strong>{summary.lowStock}</strong>
          <p className="summary-band-meta">
            {summary.lowStock > 0 ? "Restock attention needed now." : "Stock position is stable."}
          </p>
        </article>
      </section>

      {activeWorkspace?.type === "event" && eventProgress ? (
        <section className="panel-card event-progress-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Event Progress</p>
              <h2>{activeWorkspace.name}</h2>
            </div>
            <span className="badge-soft">{eventProgress.phase}</span>
          </div>

          <div className="event-progress-grid">
            <div className="event-progress-track" aria-hidden="true">
              <span
                className="event-progress-fill"
                style={{ width: `${eventProgress.progressPercent}%` }}
              />
            </div>

            <div className="event-progress-meta">
              <div className="summary-row">
                <span className="muted-text">Timeline completion</span>
                <strong>{eventProgress.progressPercent}%</strong>
              </div>
              <div className="summary-row">
                <span className="muted-text">Elapsed</span>
                <strong>{eventProgress.elapsedHours}h</strong>
              </div>
              <div className="summary-row">
                <span className="muted-text">Remaining</span>
                <strong>{eventProgress.remainingHours}h</strong>
              </div>
              <div className="summary-row total">
                <span className="muted-text">Selling window</span>
                <strong>{eventProgress.totalHours}h</strong>
              </div>
            </div>

            <div className="event-progress-schedule">
              <p className="muted-text">Start</p>
              <strong>{formatDate(activeWorkspace.startsAt)}</strong>
              <p className="muted-text">End</p>
              <strong>{formatDate(activeWorkspace.endsAt)}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className="content-grid two-column dashboard-split">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Alerts</h2>
            <span className={`badge-soft${summary.lowStock > 0 ? " warning" : ""}`}>
              {summary.lowStock > 0 ? "Needs action" : "Stable"}
            </span>
          </div>

          <div className="stack-list">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div className="list-row" key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <p className="muted-text">
                      {item.size} / {item.color} - {item.sku}
                    </p>
                  </div>
                  <span className="pill-warning">{item.quantityOnHand} pcs</span>
                </div>
              ))
            ) : (
              <p className="stack-empty">No urgent stock alerts in this workspace.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Activity snapshot</h2>
            <span className="badge-soft">{topItems.length} best sellers</span>
          </div>

          <div className="summary-box">
            <div className="summary-row">
              <span className="muted-text">Discount total</span>
              <strong>{formatCurrency(summary.discountTotal)}</strong>
            </div>
            <div className="summary-row total">
              <span className="muted-text">Inventory updates</span>
              <strong>{recentMovements.length}</strong>
            </div>
          </div>

          <div className="stack-list">
            {topItems.length > 0 ? (
              topItems.map(([name, qty]) => (
                <div className="list-row" key={name}>
                  <div>
                    <strong>{name}</strong>
                    <p className="muted-text">Units sold across completed sales</p>
                  </div>
                  <span className="pill-strong">{qty}</span>
                </div>
              ))
            ) : (
              <p className="stack-empty">Sales activity will appear here after the first checkout.</p>
            )}
          </div>
        </article>
      </section>

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Recent sales</h2>
            <span className="badge-soft">{recentSales.length} receipts</span>
          </div>

          <div className="table-list">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div className="table-row" key={sale.id}>
                  <div>
                    <strong>{sale.receiptNumber}</strong>
                    <p className="muted-text">
                      {sale.cashierUser} - {formatDate(sale.createdAt)}
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

        <article className="panel-card">
          <div className="panel-head">
            <h2>Inventory movement</h2>
            <span className="badge-soft">{recentMovements.length} updates</span>
          </div>

          <div className="table-list">
            {recentMovements.length > 0 ? (
              recentMovements.map((movement) => (
                <div className="table-row" key={movement.id}>
                  <div>
                    <strong>{movement.type}</strong>
                    <p className="muted-text">
                      {movement.actorUser} - {formatDate(movement.createdAt)}
                    </p>
                  </div>
                  <span className={movement.qtyDelta < 0 ? "text-danger" : "text-success"}>
                    {movement.qtyDelta > 0 ? "+" : ""}
                    {movement.qtyDelta}
                  </span>
                </div>
              ))
            ) : (
              <p className="stack-empty">Inventory adjustments will appear here once activity starts.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
