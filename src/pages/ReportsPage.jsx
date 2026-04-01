import { useMemo } from "react";

import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { formatCurrency } from "../utils/formatters";

export function ReportsPage() {
  const { sales, loading, loadError, workspaces } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;

  const summary = useMemo(() => {
    const byPayment = sales.reduce(
      (acc, sale) => {
        acc[sale.paymentMethod] += sale.grandTotal;
        return acc;
      },
      { cash: 0, card: 0 }
    );

    const byCategory = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.productNameSnapshot;
        byCategory[key] = (byCategory[key] || 0) + item.lineTotal;
      });
    });

    return {
      gross: sales.reduce((sum, sale) => sum + sale.subtotal, 0),
      net: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
      discount: sales.reduce((sum, sale) => sum + sale.discountTotal, 0),
      byPayment,
      topRevenue: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [sales]);

  return (
    <div className="page-stack reports-workspace">
      <section className="page-header-card reports-header-bar">
        <div className="reports-header-copy">
          <p className="eyebrow">Reports</p>
          <h1>Operational reporting</h1>
          <p className="muted-text">
            Finalized sales data and item snapshots summarized in the same flatter visual language as the rest of the
            workspace.
          </p>
        </div>
        {activeWorkspace ? (
          <div className="reports-header-meta">
            <span className="badge-soft">{activeWorkspace.name}</span>
            <span className="badge-soft">{activeWorkspace.type}</span>
            {activeWorkspace.status ? <span className="badge-soft">{activeWorkspace.status}</span> : null}
          </div>
        ) : null}
      </section>

      {loading ? <p className="info-text">Loading reports...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="dashboard-kpi-band reports-kpi-band">
        <article className="panel-card dashboard-kpi-card">
          <span className="stat-label">Gross Sales</span>
          <strong>{formatCurrency(summary.gross)}</strong>
          <p className="summary-band-meta">Before discounts and payment split.</p>
        </article>
        <article className="panel-card dashboard-kpi-card">
          <span className="stat-label">Net Revenue</span>
          <strong>{formatCurrency(summary.net)}</strong>
          <p className="summary-band-meta">Final value recognized from receipts.</p>
        </article>
        <article className="panel-card dashboard-kpi-card">
          <span className="stat-label">Discount Total</span>
          <strong>{formatCurrency(summary.discount)}</strong>
          <p className="summary-band-meta">Promotions and discounts applied.</p>
        </article>
      </section>

      <section className="content-grid reports-layout">
        <article className="panel-card reports-panel">
          <div className="panel-head">
            <h2>Revenue by payment method</h2>
          </div>
          <div className="table-list reports-table-list">
            <div className="table-row reports-table-row">
              <span>Cash</span>
              <strong>{formatCurrency(summary.byPayment.cash)}</strong>
            </div>
            <div className="table-row reports-table-row">
              <span>Card</span>
              <strong>{formatCurrency(summary.byPayment.card)}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card reports-panel">
          <div className="panel-head">
            <h2>Top revenue items</h2>
          </div>
          <div className="table-list reports-table-list">
            {summary.topRevenue.map(([name, total]) => (
              <div className="table-row reports-table-row" key={name}>
                <span>{name}</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
