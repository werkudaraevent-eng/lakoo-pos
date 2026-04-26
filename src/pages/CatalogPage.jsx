import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function CatalogPage() {
  const { products, categories, settings, loading, loadError } = usePosData();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");

  const attr1Label = settings?.attribute1Label || "Size";
  const attr2Label = settings?.attribute2Label || "Color";

  const catList = useMemo(() => {
    const unique = [...new Set((categories || []).map((c) => c.name))].sort();
    return ["Semua", ...unique];
  }, [categories]);

  const filtered = useMemo(() => {
    return (products || []).filter((p) => {
      const matchCat = cat === "Semua" || p.category === cat;
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.variants || []).some((v) => (v.sku || "").toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, search, cat]);

  function getTotalStock(product) {
    return (product.variants || []).filter((v) => v.isActive !== false).reduce((sum, v) => sum + (v.quantityOnHand || 0), 0);
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
          + Tambah Produk
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
          return (
            <Link to={`/catalog/${p.id}`} key={p.id} className="card card-sm" style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}>
              <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 8, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 24, fontWeight: 800, color: "var(--text-muted)" }}>
                {p.name.charAt(0)}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-soft)", marginBottom: 8 }}>
                {(p.variants || []).length > 0 ? (p.variants[0].sku || "") : ""} · {p.category}
              </div>
              <div className="row-between">
                <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: 14 }}>{formatCurrency(p.basePrice)}</span>
                <span className={`badge ${stock > 10 ? "badge-green" : stock > 0 ? "badge-amber" : "badge-red"}`}>
                  {stock > 0 ? `${stock} stok` : "Habis"}
                </span>
              </div>
            </Link>
          );
        })}
        {!loading && filtered.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>Tidak ada produk ditemukan</div>
        ) : null}
      </div>
    </div>
  );
}
