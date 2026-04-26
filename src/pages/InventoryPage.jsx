import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

function getTotalStock(product) {
  return (product.variants || []).filter((v) => v.isActive !== false).reduce((sum, v) => sum + (v.quantityOnHand || 0), 0);
}

function getStatus(total) {
  if (total === 0) return "Habis";
  if (total <= 3) return "Hampir Habis";
  if (total <= 10) return "Terbatas";
  return "Tersedia";
}

function getBadge(total) {
  if (total === 0) return "badge-red";
  if (total <= 3) return "badge-red";
  if (total <= 10) return "badge-amber";
  return "badge-green";
}

// ── Tambah Stok Modal ──
function TambahStokModal({ product, settings, onClose, onSave }) {
  const attr1Label = settings?.attribute1Label || "Size";
  const variants = (product.variants || []).filter((v) => v.isActive !== false);
  const [deltas, setDeltas] = useState(() => {
    const d = {};
    variants.forEach((v) => { d[v.id] = 0; });
    return d;
  });
  const total = Object.values(deltas).reduce((a, b) => a + b, 0);
  const set = (id, val) => setDeltas((prev) => ({ ...prev, [id]: Math.max(0, parseInt(val) || 0) }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div className="modal-title" style={{ marginBottom: 2 }}>Tambah Stok</div>
            <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 20 }}>
              {product.name} · <span className="tag">{variants[0]?.sku || "-"}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {variants.map((v) => {
            const current = v.quantityOnHand || 0;
            const label = v.attribute1Value || v.sku;
            const delta = deltas[v.id] || 0;
            return (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--surface)", borderRadius: 8 }}>
                <div style={{ width: 40, height: 30, borderRadius: 6, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{attr1Label} {label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-soft)" }}>Stok saat ini: <strong>{current}</strong></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 600 }}>+ Tambah</span>
                  <div className="qty-btn" style={{ width: 26, height: 26 }} onClick={() => set(v.id, delta - 1)}>−</div>
                  <input type="number" min={0} value={delta} onChange={(e) => set(v.id, e.target.value)}
                    style={{ width: 52, textAlign: "center", padding: 4, border: "1px solid var(--line)", borderRadius: 6, fontFamily: "inherit", fontWeight: 700, fontSize: 14 }} />
                  <div className="qty-btn" style={{ width: 26, height: 26 }} onClick={() => set(v.id, delta + 1)}>+</div>
                </div>
                <div style={{ minWidth: 60, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--success)" }}>
                  {delta > 0 ? `→ ${current + delta}` : ""}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-soft)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--text-soft)", fontWeight: 500 }}>Total penambahan</span>
          <span style={{ fontWeight: 800, color: "var(--accent)" }}>+ {total} unit</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2, height: 42 }} disabled={total === 0} onClick={() => { onSave(product, deltas); onClose(); }}>
            Simpan Penambahan Stok
          </button>
        </div>
      </div>
    </div>
  );
}

export function InventoryPage() {
  const { products, settings, adjustInventory, loading, loadError } = usePosData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showFilter, setShowFilter] = useState(false);
  const [tambahModal, setTambahModal] = useState(null); // null | 'picker' | product

  const attr1Label = settings?.attribute1Label || "Size";

  const catList = useMemo(() => {
    const unique = [...new Set((products || []).map((p) => p.category).filter(Boolean))].sort();
    return ["Semua", ...unique];
  }, [products]);

  const statuses = ["Semua", "Tersedia", "Terbatas", "Hampir Habis", "Habis"];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (products || []).filter((p) => {
      const total = getTotalStock(p);
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.variants || []).some((v) => (v.sku || "").toLowerCase().includes(q));
      const matchCat = catFilter === "Semua" || p.category === catFilter;
      const matchStatus = statusFilter === "Semua" || getStatus(total) === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, catFilter, statusFilter]);

  const allProducts = products || [];
  const summaryStats = useMemo(() => ({
    total: allProducts.length,
    hampirHabis: allProducts.filter((p) => { const t = getTotalStock(p); return t > 0 && t <= 3; }).length,
    habis: allProducts.filter((p) => getTotalStock(p) === 0).length,
    totalUnit: allProducts.reduce((s, p) => s + getTotalStock(p), 0),
  }), [allProducts]);

  async function handleTambahSave(product, deltas) {
    for (const [variantId, qty] of Object.entries(deltas)) {
      if (qty > 0) {
        await adjustInventory({ variantId, mode: "restock", quantity: qty, note: "Tambah stok manual", actor: user });
      }
    }
  }

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Search + Filter + Tambah */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div className="input-wrap" style={{ flex: "1 1 200px" }}>
          <span className="input-icon">
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`btn ${showFilter ? "btn-primary" : "btn-secondary"}`} onClick={() => setShowFilter(!showFilter)}>
          <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          {" "}Filter {catFilter !== "Semua" || statusFilter !== "Semua" ? "●" : ""}
        </button>
        <button className="btn btn-primary" onClick={() => setTambahModal("picker")}>
          <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {" "}Tambah Stok
        </button>
      </div>

      {/* Filter bar */}
      {showFilter ? (
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-soft)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kategori</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {catList.map((c) => <div key={c} className={`cat-chip${catFilter === c ? " active" : ""}`} style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setCatFilter(c)}>{c}</div>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-soft)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status Stok</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {statuses.map((s) => <div key={s} className={`cat-chip${statusFilter === s ? " active" : ""}`} style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setStatusFilter(s)}>{s}</div>)}
            </div>
          </div>
          {catFilter !== "Semua" || statusFilter !== "Semua" ? (
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-end" }} onClick={() => { setCatFilter("Semua"); setStatusFilter("Semua"); }}>Reset</button>
          ) : null}
        </div>
      ) : null}

      {/* Summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Produk", val: summaryStats.total },
          { label: "Hampir Habis", val: summaryStats.hampirHabis, warn: true },
          { label: "Stok Habis", val: summaryStats.habis, danger: true },
          { label: "Total Unit", val: summaryStats.totalUnit },
        ].map((k, i) => (
          <div key={i} className="card card-sm" style={{ flex: 1, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.danger ? "var(--danger)" : k.warn ? "var(--accent)" : "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.danger && k.val > 0 ? "var(--danger)" : k.warn && k.val > 0 ? "var(--accent)" : "var(--text)" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Produk</th><th>SKU</th><th>Kategori</th><th>Ukuran & Stok</th><th>Total</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const total = getTotalStock(p);
                const variants = (p.variants || []).filter((v) => v.isActive !== false);
                return (
                  <tr key={p.id}>
                    <td><span style={{ fontWeight: 700 }}>{p.name}</span></td>
                    <td>{variants[0] ? <span className="tag">{variants[0].sku}</span> : "-"}</td>
                    <td className="text-muted">{p.category}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {variants.map((v) => {
                          const qty = v.quantityOnHand || 0;
                          const label = v.attribute1Value || v.sku;
                          return (
                            <span key={v.id} style={{ fontSize: 11.5, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: qty === 0 ? "var(--danger-soft)" : qty <= 3 ? "var(--accent-soft)" : "var(--surface)", color: qty === 0 ? "var(--danger)" : qty <= 3 ? "var(--accent)" : "var(--text-soft)" }}>
                              {label}: {qty}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 700 }}>{total}</span></td>
                    <td><span className={`badge ${getBadge(total)}`}>{getStatus(total)}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-secondary btn-sm">
                          <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          {" "}Edit
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => setTambahModal(p)}>
                          <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          {" "}Tambah
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-muted text-sm" style={{ textAlign: "center", padding: 32 }}>Tidak ada produk ditemukan</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tambah Stok Modal */}
      {tambahModal && tambahModal !== "picker" ? (
        <TambahStokModal product={tambahModal} settings={settings} onClose={() => setTambahModal(null)} onSave={handleTambahSave} />
      ) : null}

      {/* Product Picker Modal */}
      {tambahModal === "picker" ? (
        <div className="modal-overlay" onClick={() => setTambahModal(null)}>
          <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="modal-title" style={{ marginBottom: 0 }}>Pilih Produk</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setTambahModal(null)}>
                <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 14 }}>Pilih produk yang ingin ditambah stoknya:</div>
            <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {allProducts.map((p) => {
                const tot = getTotalStock(p);
                return (
                  <div key={p.id} onClick={() => setTambahModal(p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--line)", background: "#fff", transition: "all 0.12s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{(p.variants || [])[0]?.sku || "-"} · {p.category}</div>
                    </div>
                    <span className={`badge ${getBadge(tot)}`}>{tot} unit</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
