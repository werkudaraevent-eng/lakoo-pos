import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function CatalogPage() {
  const { products, categories, settings, loading, loadError } = usePosData();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");

  const catList = useMemo(() => {
    const unique = [...new Set((categories || []).map((c) => c.name))].sort();
    return ["Semua", ...unique];
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (products || []).filter((p) => {
      const matchCat = cat === "Semua" || p.category === cat;
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
        (p.variants || []).some((v) => (v.sku || "").toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, search, cat]);

  function getTotalStock(product) {
    return (product.variants || []).filter((v) => v.isActive !== false)
      .reduce((sum, v) => sum + (v.quantityOnHand || 0), 0);
  }

  function getFirstSku(product) {
    const v = (product.variants || []).find((v) => v.sku);
    return v ? v.sku : "-";
  }

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Search + Add */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="input-wrap" style={{ flex: "1 1 200px" }}>
          <span className="input-icon">
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Link to="/catalog/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {" "}Tambah Produk
        </Link>
      </div>

      {/* Category filter */}
      <div className="cat-filter">
        {catList.map((c) => (
          <div key={c} className={`cat-chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</div>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginTop: 4 }}>
        {filtered.map((p) => {
          const stock = getTotalStock(p);
          const sku = getFirstSku(p);
          return (
            <div key={p.id} className="card card-sm" style={{ cursor: "pointer" }}>
              {/* Thumbnail */}
              <div style={{
                width: "100%", aspectRatio: "4/3", borderRadius: 8, background: "var(--surface)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace",
              }}>
                {p.category || "produk"}
              </div>

              {/* Name */}
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>{p.name}</div>

              {/* SKU · Category */}
              <div style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 8 }}>
                {sku} · {p.category}
              </div>

              {/* Price + Stock badge */}
              <div className="row-between">
                <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: 14 }}>{formatCurrency(p.basePrice)}</span>
                <span className={`badge ${stock > 10 ? "badge-green" : stock > 0 ? "badge-amber" : "badge-red"}`}>
                  {stock > 0 ? `${stock} stok` : "Habis"}
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <Link to={`/catalog/${p.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textDecoration: "none" }}>
                  <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  {" "}Edit
                </Link>
                <button className="btn btn-ghost btn-sm btn-icon" style={{ color: "var(--danger)" }} type="button">
                  <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <svg width={32} height={32} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginBottom: 8 }}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
            <div>Tidak ada produk ditemukan</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
