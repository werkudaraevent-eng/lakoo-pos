import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function SalesPage() {
  const { sales, loading, loadError } = usePosData();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("Semua");

  const methods = ["Semua", "cash", "card", "qris", "transfer", "ewallet"];
  const methodLabels = { cash: "Cash", card: "Card", qris: "QRIS", transfer: "Transfer", ewallet: "E-Wallet" };

  const filtered = useMemo(() => {
    return (sales || []).filter((s) => {
      const matchMethod = method === "Semua" || s.paymentMethod === method;
      const q = search.toLowerCase();
      const matchSearch = !q || (s.receiptNumber || "").toLowerCase().includes(q) ||
        (s.cashierUser || "").toLowerCase().includes(q);
      return matchMethod && matchSearch;
    });
  }, [sales, search, method]);

  const totalRev = filtered.reduce((s, t) => s + (t.grandTotal || 0), 0);
  const totalItems = filtered.reduce((s, t) => s + (t.items?.length || 0), 0);

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="input-wrap" style={{ flex: "1 1 200px" }}>
          <span className="input-icon">
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input className="input has-icon" placeholder="Cari ID atau kasir..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="cat-filter" style={{ margin: 0 }}>
          {methods.map((m) => (
            <div key={m} className={`cat-chip${method === m ? " active" : ""}`} onClick={() => setMethod(m)}>
              {m === "Semua" ? "Semua" : methodLabels[m] || m}
            </div>
          ))}
        </div>
      </div>

      {/* KPI summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Transaksi</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{filtered.length}</div>
        </div>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Pendapatan</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{formatCurrency(totalRev)}</div>
        </div>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Item</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{totalItems}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Items</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <Link to={`/sales/${sale.id}/receipt`} style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
                      {sale.receiptNumber}
                    </Link>
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(sale.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}{" "}
                    {new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="text-sm text-muted">{sale.cashierUser}</td>
                  <td><span style={{ fontWeight: 600 }}>{sale.items?.length || 0}</span></td>
                  <td><span style={{ fontWeight: 800 }}>{formatCurrency(sale.grandTotal)}</span></td>
                  <td><span className="badge badge-gray">{methodLabels[sale.paymentMethod] || sale.paymentMethod}</span></td>
                  <td><span className="badge badge-green">Lunas</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>
                    Belum ada transaksi
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
