import { useMemo, useState } from "react";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function ReportsPage() {
  const { sales, settings, loading, loadError } = usePosData();
  const [period, setPeriod] = useState("30d");

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const filteredSales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    return (sales || []).filter((s) => new Date(s.createdAt) >= cutoff);
  }, [sales, periodDays]);

  const totalRev = filteredSales.reduce((s, t) => s + (t.grandTotal || 0), 0);
  const totalItems = filteredSales.reduce((s, t) => s + (t.items?.length || 0), 0);

  // Weekly data
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
      result.push({ day: days[d.getDay()], rev });
    }
    return result;
  }, [sales]);

  const maxRev = Math.max(...weeklyData.map((d) => d.rev), 1);
  const totalWeek = weeklyData.reduce((s, d) => s + d.rev, 0);

  // Dynamic payment method labels from settings
  const payMethodLabels = useMemo(() => {
    const methods = settings?.paymentMethods;
    if (Array.isArray(methods) && methods.length > 0 && typeof methods[0] === "object") {
      return Object.fromEntries(methods.map(m => [m.id, m.label]));
    }
    return { cash: "Cash", qris: "QRIS", transfer: "Transfer", card: "Kartu Debit/Kredit", ewallet: "E-Wallet" };
  }, [settings?.paymentMethods]);

  // Payment method breakdown
  const methodBreakdown = useMemo(() => {
    const counts = {};
    filteredSales.forEach((s) => {
      const m = s.paymentMethod || "cash";
      counts[m] = (counts[m] || 0) + 1;
    });
    const total = filteredSales.length || 1;
    const colors = { cash: "var(--blue)", qris: "var(--success)", transfer: "#8b5cf6", card: "var(--accent)", ewallet: "#e67e22" };
    return Object.entries(counts)
      .map(([key, count]) => ({ label: payMethodLabels[key] || key, pct: Math.round((count / total) * 100), color: colors[key] || "var(--accent)" }))
      .sort((a, b) => b.pct - a.pct);
  }, [filteredSales, payMethodLabels]);

  // Top products
  const topProducts = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const name = item.productNameSnapshot || "Unknown";
        if (!map[name]) map[name] = { name, sold: 0, rev: 0 };
        map[name].sold += item.qty || 0;
        map[name].rev += item.lineTotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.rev - a.rev).slice(0, 5);
  }, [filteredSales]);

  const totalProductRev = topProducts.reduce((s, p) => s + p.rev, 0) || 1;

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Period selector */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div className="cat-filter" style={{ margin: 0 }}>
          {[{ key: "7d", label: "7 Hari" }, { key: "30d", label: "30 Hari" }, { key: "90d", label: "90 Hari" }].map((p) => (
            <div key={p.key} className={`cat-chip${period === p.key ? " active" : ""}`} onClick={() => setPeriod(p.key)}>{p.label}</div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-3 mb-16">
        <div className="card">
          <div className="kpi-label">Pendapatan Periode Ini</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatCurrency(totalRev)}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Total Transaksi</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{filteredSales.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Produk Terjual</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{totalItems} item</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Weekly chart */}
        <div className="card">
          <div className="section-title">Pendapatan Mingguan</div>
          <svg width="100%" viewBox={`0 0 ${weeklyData.length * 60} 110`} style={{ overflow: "visible" }}>
            {weeklyData.map((d, i) => {
              const bh = maxRev > 0 ? (d.rev / maxRev) * 80 : 0;
              const x = i * 60 + 16;
              return (
                <g key={i}>
                  <rect x={x} y={80 - bh} width={28} height={Math.max(bh, 2)} rx={4} fill="var(--accent)" opacity={0.85} />
                  <text x={x + 14} y={98} textAnchor="middle" fontSize={11} fill="var(--text-soft)" fontWeight={600} style={{ fontFamily: "inherit" }}>{d.day}</text>
                  {d.rev > 0 ? (
                    <text x={x + 14} y={80 - bh - 6} textAnchor="middle" fontSize={10} fill="var(--text-soft)" style={{ fontFamily: "inherit" }}>
                      {(d.rev / 1000000).toFixed(1)}M
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <div className="divider" />
          <div className="row-between text-sm">
            <span className="text-muted">Total minggu ini</span>
            <span className="font-bold">{formatCurrency(totalWeek)}</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="card">
          <div className="section-title">Metode Pembayaran</div>
          {methodBreakdown.length > 0 ? methodBreakdown.map((m, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div className="row-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800 }}>{m.pct}%</span>
              </div>
              <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 8 }}>
                <div style={{ height: "100%", width: `${m.pct}%`, background: m.color, borderRadius: 8 }} />
              </div>
            </div>
          )) : (
            <div className="text-sm text-muted" style={{ padding: "24px 0", textAlign: "center" }}>Belum ada data</div>
          )}
          <div className="divider" />
          <div className="text-sm text-muted">Berdasarkan {filteredSales.length} transaksi</div>
        </div>
      </div>

      {/* Top products table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Produk Terlaris</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Produk</th><th>Terjual</th><th>Pendapatan</th><th>% dari Total</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => {
                const pct = ((p.rev / totalProductRev) * 100).toFixed(1);
                return (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 800, color: "var(--text-soft)" }}>{i + 1}</span></td>
                    <td><span style={{ fontWeight: 700 }}>{p.name}</span></td>
                    <td>{p.sold} item</td>
                    <td><span style={{ fontWeight: 800 }}>{formatCurrency(p.rev)}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: "var(--surface-2)", borderRadius: 4 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {topProducts.length === 0 ? (
                <tr><td colSpan={5} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>Belum ada data</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
