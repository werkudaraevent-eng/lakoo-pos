import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

const statusMeta = {
  active: { label: "Aktif", cls: "badge-green" },
  scheduled: { label: "Mendatang", cls: "badge-blue" },
  ended: { label: "Selesai", cls: "badge-gray" },
};

function getPromoStatus(promo) {
  if (!promo.isActive) return "ended";
  const now = new Date();
  if (new Date(promo.startAt) > now) return "scheduled";
  if (new Date(promo.endAt) < now) return "ended";
  return "active";
}

export function PromotionsPage() {
  const { promotions, sales, loading, loadError } = usePosData();
  const [filter, setFilter] = useState("Semua");

  const filters = ["Semua", "Aktif", "Mendatang", "Selesai"];

  // Count promo usage from sales
  const promoUsage = useMemo(() => {
    const counts = {};
    (sales || []).forEach((s) => {
      if (s.promotion?.promotionId) {
        counts[s.promotion.promotionId] = (counts[s.promotion.promotionId] || 0) + 1;
      }
    });
    return counts;
  }, [sales]);

  const promoList = useMemo(() => {
    return (promotions || []).map((p) => ({
      ...p,
      status: getPromoStatus(p),
      used: promoUsage[p.id] || 0,
    }));
  }, [promotions, promoUsage]);

  const filtered = promoList.filter((p) => {
    if (filter === "Semua") return true;
    const meta = statusMeta[p.status];
    return meta && meta.label === filter;
  });

  const typeMeta = { percentage: "Diskon %", fixed: "Diskon Rp" };

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Header */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="cat-filter" style={{ margin: 0 }}>
          {filters.map((f) => (
            <div key={f} className={`cat-chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</div>
          ))}
        </div>
        <Link to="/promotions/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          + Buat Promo Baru
        </Link>
      </div>

      {/* KPI */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Promo</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{promoList.length}</div>
        </div>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Promo Aktif</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{promoList.filter((p) => p.status === "active").length}</div>
        </div>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Penggunaan</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{promoList.reduce((s, p) => s + p.used, 0)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tipe</th>
                <th>Nilai</th>
                <th>Min. Pembelian</th>
                <th>Periode</th>
                <th>Digunakan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const meta = statusMeta[p.status] || statusMeta.ended;
                return (
                  <tr key={p.id}>
                    <td><span style={{ fontWeight: 700, color: "var(--accent)" }}>{p.code}</span></td>
                    <td className="text-sm">{typeMeta[p.type] || p.type}</td>
                    <td><span style={{ fontWeight: 700 }}>
                      {p.type === "percentage" ? `${p.value}%` : formatCurrency(p.value)}
                    </span></td>
                    <td className="text-sm text-muted">{p.minPurchase > 0 ? formatCurrency(p.minPurchase) : "-"}</td>
                    <td className="text-sm text-muted">
                      {new Date(p.startAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      {" – "}
                      {new Date(p.endAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{p.used}x</span></td>
                    <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>Tidak ada promo</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
