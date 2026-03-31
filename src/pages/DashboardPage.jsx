import { useMemo } from "react";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency, formatDate } from "../utils/formatters";

export function DashboardPage() {
  const { sales, variants, inventoryMovements, loading, loadError } = usePosData();

  const metrics = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todaySales = sales.filter((sale) => new Date(sale.createdAt).toDateString() === todayKey);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const discountTotal = sales.reduce((sum, sale) => sum + sale.discountTotal, 0);
    const lowStock = variants.filter((item) => item.quantityOnHand <= item.lowStockThreshold).length;

    return {
      transactions: todaySales.length,
      revenue: todayRevenue,
      discountTotal,
      lowStock,
    };
  }, [sales, variants]);

  const topItems = useMemo(() => {
    const tally = new Map();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        tally.set(item.productNameSnapshot, (tally.get(item.productNameSnapshot) || 0) + item.qty);
      });
    });

    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [sales]);

  const lowStockItems = variants.filter((item) => item.quantityOnHand <= item.lowStockThreshold).slice(0, 5);

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Store pulse for today's operation.</h1>
          <p className="muted-text">
            Monitor revenue, transaction flow, low-stock pressure, and recent inventory movement in one place.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading dashboard data...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Today Revenue</span>
          <strong>{formatCurrency(metrics.revenue)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Transactions</span>
          <strong>{metrics.transactions}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Discount Used</span>
          <strong>{formatCurrency(metrics.discountTotal)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Low Stock Variants</span>
          <strong>{metrics.lowStock}</strong>
        </article>
      </section>

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Top-selling items</h2>
            <span className="badge-soft">Finalized sales only</span>
          </div>
          <div className="stack-list">
            {topItems.map(([name, qty]) => (
              <div className="list-row" key={name}>
                <div>
                  <strong>{name}</strong>
                  <p className="muted-text">Quantity sold</p>
                </div>
                <span className="pill-strong">{qty}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Low-stock alerts</h2>
            <span className="badge-soft warning">Needs restock</span>
          </div>
          <div className="stack-list">
            {lowStockItems.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.productName}</strong>
                  <p className="muted-text">
                    {item.size} / {item.color} - {item.sku}
                  </p>
                </div>
                <span className="pill-warning">{item.quantityOnHand} pcs</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Recent sales</h2>
          </div>
          <div className="table-list">
            {sales.slice(0, 5).map((sale) => (
              <div className="table-row" key={sale.id}>
                <div>
                  <strong>{sale.receiptNumber}</strong>
                  <p className="muted-text">
                    {sale.cashierUser} - {formatDate(sale.createdAt)}
                  </p>
                </div>
                <span>{formatCurrency(sale.grandTotal)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Inventory movements</h2>
          </div>
          <div className="table-list">
            {inventoryMovements.slice(0, 5).map((movement) => (
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
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
