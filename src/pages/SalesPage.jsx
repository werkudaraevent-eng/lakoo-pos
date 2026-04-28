import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function SalesPage() {
  const { sales, settings, loading, loadError } = usePosData();
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("Semua");
  const [detail, setDetail] = useState(null);

  const payMethodLabels = useMemo(() => {
    const methods = settings?.paymentMethods;
    if (Array.isArray(methods) && methods.length > 0 && typeof methods[0] === "object") {
      return Object.fromEntries(methods.map(m => [m.id, m.label]));
    }
    return { cash: "Cash", qris: "QRIS", transfer: "Transfer", card: "Kartu Debit/Kredit", ewallet: "E-Wallet" };
  }, [settings?.paymentMethods]);

  const enabledMethods = useMemo(() => {
    const methods = settings?.paymentMethods;
    if (!Array.isArray(methods) || methods.length === 0) {
      return [{ id: "cash", label: "Cash" }, { id: "qris", label: "QRIS" }];
    }
    if (typeof methods[0] === "string") {
      return methods.map(id => ({ id, label: id.toUpperCase() }));
    }
    return methods.filter(m => m.enabled);
  }, [settings?.paymentMethods]);

  const methods = ["Semua", ...enabledMethods.map(m => m.id)];
  const methodLabels = payMethodLabels;

  const filtered = useMemo(() => {
    return (sales || []).filter((s) => {
      const matchMethod = method === "Semua" || s.paymentMethod === method;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (s.receiptNumber || "").toLowerCase().includes(q) ||
        (s.items || []).some((item) =>
          (item.productNameSnapshot || "").toLowerCase().includes(q)
        );
      return matchMethod && matchSearch;
    });
  }, [sales, search, method]);

  const totalRev = filtered.reduce((s, t) => s + (t.grandTotal || 0), 0);
  const totalItems = filtered.reduce(
    (s, t) => s + (t.items || []).reduce((sum, item) => sum + (item.qty || 0), 0),
    0
  );

  function getProductSummary(items) {
    if (!items || items.length === 0) return "-";
    const names = items.map((i) => i.productNameSnapshot || "Produk");
    const shown = names.slice(0, 2);
    const remaining = names.length - 2;
    const text = shown.join(", ");
    return remaining > 0 ? `${text} +${remaining}` : text;
  }

  function getPaymentBadgeClass(pm) {
    if (pm === "qris") return "badge badge-blue";
    if (pm === "transfer") return "badge badge-green";
    return "badge badge-gray";
  }

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
          <input className="input has-icon" placeholder="Cari ID atau produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th>Tanggal &amp; Waktu</th>
                <th>Produk</th>
                <th>Items</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Status</th>
                <th></th>
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
                    {formatDate(sale.createdAt)}
                  </td>
                  <td>
                    <span className="text-sm" style={{ maxWidth: 180, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getProductSummary(sale.items)}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: 600 }}>{(sale.items || []).reduce((sum, item) => sum + (item.qty || 0), 0)}</span></td>
                  <td><span style={{ fontWeight: 800 }}>{formatCurrency(sale.grandTotal)}</span></td>
                  <td><span className={getPaymentBadgeClass(sale.paymentMethod)}>{methodLabels[sale.paymentMethod] || sale.paymentMethod}</span></td>
                  <td><span className="badge badge-green">Lunas</span></td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontWeight: 600, color: "var(--accent)" }}
                      onClick={() => setDetail(sale)}
                    >
                      Detail →
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt-style Detail Modal */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ width: 400, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            {/* Dark header */}
            <div style={{ background: "var(--text)", padding: "24px 24px 20px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>{settings?.storeName || "Lakoo."}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 2 }}>Point of Sale</div>
            </div>

            {/* Receipt body */}
            <div style={{ padding: 24 }}>
              {/* Date */}
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                {formatDate(detail.createdAt)}
              </div>

              {/* Transaction ID */}
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>
                {detail.receiptNumber}
              </div>

              {/* Products list with dashed borders */}
              <div style={{ borderTop: "1px dashed var(--border)", borderBottom: "1px dashed var(--border)", margin: "16px 0", padding: "12px 0" }}>
                {(detail.items || []).map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.productNameSnapshot}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                        {item.attribute1Snapshot}{item.attribute2Snapshot ? ` · ${item.attribute2Snapshot}` : ""} × {item.qty}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(item.lineTotal)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "var(--text-2)" }}>Subtotal</span>
                <span>{formatCurrency(detail.subtotal)}</span>
              </div>
              {detail.discountTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-2)" }}>Diskon</span>
                  <span style={{ color: "var(--red)" }}>-{formatCurrency(detail.discountTotal)}</span>
                </div>
              )}
              {detail.taxTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-2)" }}>Pajak</span>
                  <span>{formatCurrency(detail.taxTotal)}</span>
                </div>
              )}
              <div className="divider" />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: "var(--accent)" }}>{formatCurrency(detail.grandTotal)}</span>
              </div>

              {/* Payment method */}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--surface)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>Metode Pembayaran</span>
                <span className={getPaymentBadgeClass(detail.paymentMethod)}>
                  {methodLabels[detail.paymentMethod] || (detail.paymentMethod || "").toUpperCase()}
                </span>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                Terima kasih telah berbelanja di {settings?.storeName || "Lakoo."}!
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDetail(null)}>Tutup</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>
                  Cetak Struk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
