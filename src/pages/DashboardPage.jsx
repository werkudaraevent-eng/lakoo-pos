import { useMemo } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { usePosData } from "../context/PosDataContext";
import { buildDashboardCollections } from "../features/dashboard/dashboardData";
import { buildDashboardKpiCards } from "../features/dashboard/dashboardWorkspace";
import { buildDashboardSummary } from "../features/events/eventHelpers";
import { AppIcon } from "../features/ui/AppIcon";
import { getDashboardKpiIconName } from "../features/ui/iconMaps";
import { formatCurrency, formatDate } from "../utils/formatters";

const PLACEHOLDER_CHART_BARS = [
  { label: "10 AM", height: 16 },
  { label: "11 AM", height: 32 },
  { label: "12 PM", height: 58 },
  { label: "1 PM", height: 92 },
  { label: "2 PM", height: 72 },
  { label: "3 PM", height: 40 },
  { label: "4 PM", height: 64 },
  { label: "5 PM", height: 82 },
];

const PLACEHOLDER_ITEMS = Array.from({ length: 4 }, (_, index) => ({
  id: `placeholder-item-${index + 1}`,
}));

const PLACEHOLDER_TRANSACTIONS = Array.from({ length: 4 }, (_, index) => ({
  id: `placeholder-tx-${index + 1}`,
}));

export function DashboardPage() {
  const { sales, loading, loadError } = usePosData();
  const summary = buildDashboardSummary({
    sales,
    now: new Date().toISOString(),
  });
  const kpiCards = useMemo(() => buildDashboardKpiCards(summary), [summary]);
  const { todaySales, topItems, recentSales, chartBars } = useMemo(
    () =>
      buildDashboardCollections({
        sales,
        now: new Date().toISOString(),
      }),
    [sales]
  );

  return (
    <div className="dashboard-container">
      <PageHeader title="Dashboard" description="Ringkasan performa bisnis hari ini." />

      {loading ? <p className="info-text">Loading dashboard data...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="kpi-grid">
        {kpiCards.map((item) => (
          <article className="kpi-card" key={item.label}>
            <div className="kpi-title">
              <span>{item.label}</span>
              <div className="kpi-icon" aria-hidden="true">
                <AppIcon name={getDashboardKpiIconName(item.label)} size={16} strokeWidth={1.9} />
              </div>
            </div>
            <div className="kpi-value">{item.kind === "currency" ? formatCurrency(item.value) : item.value}</div>
            <div
              className={`kpi-trend ${item.tone === "down" ? "trend-down" : "trend-up"}${
                item.value === 0 ? " trend-neutral" : ""
              }`}
            >
              <span>{item.value === 0 ? "No movement yet today" : item.meta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-row">
        <article className="panel">
          <div className="panel-header">
            <span className="panel-title">Sales Overview</span>
            <Link className="panel-action" to="/reports">
              View Report
            </Link>
          </div>

          <div className="panel-body">
            <div className={`chart-container${todaySales.length === 0 ? " is-placeholder" : ""}`}>
              {(todaySales.length > 0 ? chartBars : PLACEHOLDER_CHART_BARS).map((bar) => (
                <div className="chart-bar-group" key={bar.label}>
                  <div className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ height: `${bar.height}%` }} />
                  </div>
                  <span className="chart-label">{bar.label}</span>
                </div>
              ))}
            </div>
            {todaySales.length === 0 ? (
              <div className="panel-empty-copy">
                <strong>No completed sales for today yet.</strong>
                <span>Dashboard panels will populate after the first finalized transaction.</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <span className="panel-title">Top Items</span>
            <Link className="panel-action" to="/sales">
              View All
            </Link>
          </div>

          <div className="panel-body">
            <div className="item-list">
              {topItems.length > 0
                ? topItems.map((item, index) => (
                    <div className="list-item" key={item.name}>
                      <span className="item-index">{index + 1}</span>
                      <div className="item-img">
                        <span>{item.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-metric">{item.qty} sold</span>
                      </div>
                      <span className="item-value">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))
                : PLACEHOLDER_ITEMS.map((item, index) => (
                    <div className="list-item is-placeholder" key={item.id}>
                      <span className="item-index">{index + 1}</span>
                      <div className="item-img" />
                      <div className="item-details">
                        <span className="item-name">No item data yet</span>
                        <span className="item-metric">Waiting for sales</span>
                      </div>
                      <span className="item-value">Rp 0</span>
                    </div>
                  ))}
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <span className="panel-title">Recent Transactions</span>
          <Link className="panel-action" to="/sales">
            View All
          </Link>
        </div>

        <div className="panel-body panel-body-transactions">
          <div className="tx-list">
            {recentSales.length > 0
              ? recentSales.map((sale) => (
                  <div className="tx-item" key={sale.id}>
                    <div className="tx-info">
                      <span className="tx-id">{sale.receiptNumber}</span>
                      <span className="tx-time">
                        Today, {formatDate(sale.createdAt)} / {sale.customerName || sale.cashierUser || "Customer"}
                      </span>
                    </div>
                    <div className="tx-amount-group">
                      <span className="tx-amount">{formatCurrency(sale.grandTotal)}</span>
                      <span className="status-badge status-success">Completed</span>
                    </div>
                  </div>
                ))
              : PLACEHOLDER_TRANSACTIONS.map((sale) => (
                  <div className="tx-item is-placeholder" key={sale.id}>
                    <div className="tx-info">
                      <span className="tx-id">No transaction yet</span>
                      <span className="tx-time">Today's completed sales will appear here.</span>
                    </div>
                    <div className="tx-amount-group">
                      <span className="tx-amount">Rp 0</span>
                      <span className="status-badge status-success">Pending</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}
