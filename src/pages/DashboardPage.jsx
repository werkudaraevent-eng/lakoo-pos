import { useMemo } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { buildDashboardCollections } from "../features/dashboard/dashboardData";
import { buildDashboardKpiCards } from "../features/dashboard/dashboardWorkspace";
import { buildDashboardSummary } from "../features/events/eventHelpers";
import { AppIcon } from "../features/ui/AppIcon";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function DashboardPage() {
  const { sales, loading, loadError } = usePosData();
  const summary = buildDashboardSummary({ sales, now: new Date().toISOString() });
  const kpiCards = useMemo(() => buildDashboardKpiCards(summary), [summary]);
  const { todaySales, topItems, recentSales, chartBars } = useMemo(
    () => buildDashboardCollections({ sales, now: new Date().toISOString() }),
    [sales]
  );

  // Compute weekly data from sales
  const weeklyData = useMemo(() => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const rev = (sales || [])
        .filter((s) => s.createdAt && s.createdAt.slice(0, 10) === dayStr)
        .reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      result.push({ day: days[d.getDay()], rev, isToday: i === 0 });
    }
    return result;
  }, [sales]);

  const maxWeekly = Math.max(...weeklyData.map((d) => d.rev), 1);
  const totalWeekly = weeklyData.reduce((s, d) => s + d.rev, 0);
  const chartH = 80;

  // Top products from topItems
  const topProducts = topItems.slice(0, 5);
  const maxSold = topProducts.length > 0 ? topProducts[0].qty : 1;

  // Current month badge
  const monthYear = new Date().toLocaleDateString("id-ID", { month: "short", year: "numeric" });

  return (
    <div className="content">
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* KPI skeleton */}
          <div className="grid-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="card card-sm" style={{ animation: "none" }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14 }} />
                <div className="skeleton skeleton-text" style={{ width: "50%" }} />
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: "70%" }} />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="grid-2">
            <div className="card" style={{ animation: "none" }}><div className="skeleton skeleton-card" style={{ height: 160 }} /></div>
            <div className="card" style={{ animation: "none" }}><div className="skeleton skeleton-card" style={{ height: 160 }} /></div>
          </div>
        </div>
      ) : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* KPIs */}
      <div className="grid-4 mb-16">
        {kpiCards.map((k, index) => (
          <div key={k.label} className="card card-sm" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="kpi-icon" style={{ background: k.iconBg }}>
              <AppIcon name={k.iconName} size={18} strokeWidth={2} />
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">
              {k.kind === "currency" ? formatCurrency(k.value) : k.value}
            </div>
            <div className="kpi-sub">
              <span className={k.tone === "down" ? "kpi-down" : k.value === 0 ? "" : "kpi-up"}>
                {k.value === 0 ? "Belum ada data hari ini" : k.meta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Weekly Chart */}
        <div className="card">
          <div className="row-between mb-16">
            <div className="section-title" style={{ marginBottom: 0 }}>Pendapatan Minggu Ini</div>
            <span className="badge badge-amber">{monthYear}</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${weeklyData.length * 60} ${chartH + 28}`} style={{ overflow: "visible" }}>
            {weeklyData.map((d, i) => {
              const bh = maxWeekly > 0 ? (d.rev / maxWeekly) * chartH : 0;
              const x = i * 60 + 16;
              return (
                <g key={i}>
                  <rect x={x} y={chartH - bh} width={28} height={Math.max(bh, 2)} rx={4}
                    fill={d.isToday ? "var(--accent)" : "var(--surface-2)"} />
                  <text x={x + 14} y={chartH + 18} textAnchor="middle" fontSize={11}
                    fill="var(--text-soft)" fontWeight={600} style={{ fontFamily: "inherit" }}>{d.day}</text>
                  {d.rev > 0 ? (
                    <text x={x + 14} y={chartH - bh - 6} textAnchor="middle" fontSize={10}
                      fill="var(--text-soft)" style={{ fontFamily: "inherit" }}>
                      {(d.rev / 1000000).toFixed(1)}M
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="text-sm text-muted">Total minggu ini</span>
            <span className="font-bold" style={{ fontSize: 15 }}>{formatCurrency(totalWeekly)}</span>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="row-between mb-16">
            <div className="section-title" style={{ marginBottom: 0 }}>Produk Terlaris</div>
            <span className="text-sm text-muted">Hari ini</span>
          </div>
          {topProducts.length > 0 ? topProducts.map((p, i) => {
            const pct = maxSold > 0 ? (p.qty / maxSold) * 100 : 0;
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div className="row-between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{p.qty} terjual</span>
                </div>
                <div style={{ height: 5, background: "var(--surface-2)", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          }) : (
            <div className="text-sm text-muted" style={{ padding: "24px 0", textAlign: "center" }}>
              Belum ada data penjualan hari ini
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="row-between mb-16">
          <div className="section-title" style={{ marginBottom: 0 }}>Transaksi Terbaru</div>
          <div className="row">
            <span className="text-sm text-muted">Hari ini</span>
            <Link to="/sales" className="text-sm" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              Lihat Semua →
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Waktu</th>
                <th>Produk</th>
                <th>Items</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length > 0 ? recentSales.slice(0, 5).map((sale) => (
                <tr key={sale.id}>
                  <td><span style={{ fontWeight: 700, fontSize: 13 }}>{sale.receiptNumber}</span></td>
                  <td className="text-muted text-sm">
                    {new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="text-sm">{sale.productSummary || "-"}</td>
                  <td>{sale.items?.length || 0}</td>
                  <td><span style={{ fontWeight: 700 }}>{formatCurrency(sale.grandTotal)}</span></td>
                  <td><span className="badge badge-gray">{sale.paymentMethod}</span></td>
                  <td><span className="badge badge-green">Lunas</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>
                    Belum ada transaksi hari ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
