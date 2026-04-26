import { useMemo, useState } from "react";

import { Button } from "../components/ui/button";
import { usePosData } from "../context/PosDataContext";
import {
  buildRecentTransactions,
  buildReportsCsv,
  buildReportsSummary,
  buildSalesOverTime,
  buildTopCategories,
  filterSalesByPeriod,
} from "../features/reports/reportsWorkspace";
import { AppIcon } from "../features/ui/AppIcon";
import { formatCurrency, formatDate } from "../utils/formatters";
import "../features/reports/reports.css";

function downloadReportsCsv(sales) {
  const csv = buildReportsCsv(sales);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reports-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { sales, loading, loadError, products } = usePosData();
  const [period, setPeriod] = useState("7d");

  const scopedSales = useMemo(() => filterSalesByPeriod(sales, period), [period, sales]);
  const summary = useMemo(() => buildReportsSummary(scopedSales), [scopedSales]);
  const salesOverTime = useMemo(() => buildSalesOverTime(scopedSales, period), [period, scopedSales]);
  const topCategories = useMemo(() => buildTopCategories(scopedSales, products), [products, scopedSales]);
  const recentTransactions = useMemo(() => buildRecentTransactions(scopedSales), [scopedSales]);

  return (
    <div className="reports-banani-page">
      <header className="reports-banani-header">
        <div>
          <h1 className="reports-banani-title">Reports Overview</h1>
          <p className="muted-text">
            Read sales performance quickly from a single surface that favors trend visibility over dashboard clutter.
          </p>
        </div>

        <div className="reports-banani-actions">
          <label className="reports-banani-select">
            <select onChange={(event) => setPeriod(event.target.value)} value={period}>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <span className="reports-banani-select-icon" aria-hidden="true">
              <AppIcon name="CalendarDays" size={16} />
            </span>
          </label>
          <Button className="reports-banani-button is-primary" onClick={() => downloadReportsCsv(scopedSales)} size="lg" type="button">
            <AppIcon name="Download" size={16} />
            <span>Export Report</span>
          </Button>
        </div>
      </header>

      {loading ? <p className="info-text">Loading reports...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="reports-banani-metrics">
        <article className="reports-banani-metric-card">
          <div className="reports-banani-metric-head">
            <span className="reports-banani-metric-title">Gross Sales</span>
            <AppIcon name="Banknote" size={18} />
          </div>
          <strong className="reports-banani-metric-value">{formatCurrency(summary.grossSales)}</strong>
        </article>

        <article className="reports-banani-metric-card">
          <div className="reports-banani-metric-head">
            <span className="reports-banani-metric-title">Total Orders</span>
            <AppIcon name="ShoppingBag" size={18} />
          </div>
          <strong className="reports-banani-metric-value">{summary.totalOrders}</strong>
        </article>

        <article className="reports-banani-metric-card">
          <div className="reports-banani-metric-head">
            <span className="reports-banani-metric-title">Avg. Order Value</span>
            <AppIcon name="Receipt" size={18} />
          </div>
          <strong className="reports-banani-metric-value">{formatCurrency(summary.avgOrderValue)}</strong>
        </article>

        <article className="reports-banani-metric-card">
          <div className="reports-banani-metric-head">
            <span className="reports-banani-metric-title">Items Sold</span>
            <AppIcon name="Tag" size={18} />
          </div>
          <strong className="reports-banani-metric-value">{summary.itemsSold}</strong>
        </article>
      </section>

      <section className="reports-banani-charts">
        <article className="reports-banani-chart-card">
          <div className="reports-banani-chart-head">
            <h2>Sales Over Time</h2>
          </div>
          <div className="reports-banani-bars">
            {salesOverTime.map((bucket) => (
              <div className="reports-banani-bar-group" key={bucket.key}>
                <div className="reports-banani-bar-track">
                  <div className="reports-banani-bar" style={{ height: `${Math.max(bucket.heightRatio * 100, bucket.total ? 6 : 0)}%` }} />
                </div>
                <span className="reports-banani-bar-label">{bucket.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="reports-banani-chart-card">
          <div className="reports-banani-chart-head">
            <h2>Top Categories</h2>
          </div>
          <div className="reports-banani-horizontal-list">
            {topCategories.length ? (
              topCategories.map((item) => (
                <div className="reports-banani-horizontal-row" key={item.label}>
                  <div className="reports-banani-horizontal-head">
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                  <div className="reports-banani-horizontal-track">
                    <div className="reports-banani-horizontal-fill" style={{ width: `${item.ratio * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="reports-banani-empty">No category trend is available for the selected period.</div>
            )}
          </div>
        </article>
      </section>

      <section className="reports-banani-table-card">
        <div className="reports-banani-table-head">
          <h2>Recent Transactions</h2>
        </div>
        {recentTransactions.length ? (
          <div className="reports-banani-table-wrap">
            <table className="reports-banani-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="is-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.time ? formatDate(sale.time.toISOString()) : "-"}</td>
                    <td>{sale.orderId}</td>
                    <td>{sale.customer}</td>
                    <td>{sale.items}</td>
                    <td>
                      <span className="reports-banani-status">{sale.status}</span>
                    </td>
                    <td className="is-right">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-banani-empty">No transactions are available for the selected period.</div>
        )}
      </section>
    </div>
  );
}
