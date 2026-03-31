import { useMemo } from "react";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";

export function ReportsPage() {
  const { sales, loading, loadError } = usePosData();

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
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>Operational reporting from finalized sales.</h1>
          <p className="muted-text">
            Semua angka di halaman ini membaca finalized sales dan snapshot item data, sesuai aturan MVP.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading reports...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Gross Sales</span>
          <strong>{formatCurrency(summary.gross)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Net Revenue</span>
          <strong>{formatCurrency(summary.net)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Discount Total</span>
          <strong>{formatCurrency(summary.discount)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Sales Count</span>
          <strong>{sales.length}</strong>
        </article>
      </section>

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Revenue by payment method</h2>
          </div>
          <div className="table-list">
            <div className="table-row">
              <span>Cash</span>
              <strong>{formatCurrency(summary.byPayment.cash)}</strong>
            </div>
            <div className="table-row">
              <span>Card</span>
              <strong>{formatCurrency(summary.byPayment.card)}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Top revenue items</h2>
          </div>
          <div className="table-list">
            {summary.topRevenue.map(([name, total]) => (
              <div className="table-row" key={name}>
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
