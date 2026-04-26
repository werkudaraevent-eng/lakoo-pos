import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import "../features/dashboard/dashboard.css";

export function InventoryPage() {
  const { products, settings, loading, loadError } = usePosData();
  const [search, setSearch] = useState("");

  const attr1Label = settings?.attribute1Label || "Size";
  const attr2Label = settings?.attribute2Label || "Color";

  const filtered = useMemo(() => {
    return (products || []).filter((p) => {
      const q = search.toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || (p.variants || []).some((v) => (v.sku || "").toLowerCase().includes(q));
    });
  }, [products, search]);

  function getTotalStock(product) {
    return (product.variants || []).filter((v) => v.isActive !== false).reduce((sum, v) => sum + (v.quantityOnHand || 0), 0);
  }

  function getStockStatus(total) {
    if (total === 0) return { label: "Habis", cls: "badge-red" };
    if (total <= 5) return { label: "Hampir Habis", cls: "badge-red" };
    if (total <= 10) return { label: "Terbatas", cls: "badge-amber" };
    return { label: "Tersedia", cls: "badge-green" };
  }

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Search + actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="input-wrap" style={{ flex: 1 }}>
          <span className="input-icon">
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Link to="/inventory/receive" className="btn btn-primary" style={{ textDecoration: "none" }}>
          + Tambah Stok
        </Link>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Varian & Stok</th>
                <th>Total Stok</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const total = getTotalStock(p);
                const status = getStockStatus(total);
                const variants = (p.variants || []).filter((v) => v.isActive !== false);
                return (
                  <tr key={p.id}>
                    <td><span style={{ fontWeight: 700 }}>{p.name}</span></td>
                    <td>
                      {variants.length > 0 ? <span className="tag">{variants[0].sku}</span> : "-"}
                    </td>
                    <td className="text-muted">{p.category}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {variants.map((v) => {
                          const qty = v.quantityOnHand || 0;
                          const label = [v.attribute1Value, v.attribute2Value].filter(Boolean).join("/") || v.sku;
                          return (
                            <span key={v.id} style={{
                              fontSize: 11.5, padding: "2px 7px", borderRadius: 4, fontWeight: 600,
                              background: qty === 0 ? "var(--danger-soft)" : qty <= 3 ? "var(--accent-soft)" : "var(--surface)",
                              color: qty === 0 ? "var(--danger)" : qty <= 3 ? "var(--accent)" : "var(--text-soft)",
                            }}>
                              {label}: {qty}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 700 }}>{total}</span></td>
                    <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
