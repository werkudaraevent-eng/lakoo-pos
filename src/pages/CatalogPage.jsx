import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function CatalogPage() {
  const { products, workspaces, categories, settings, loading, loadError, updateProduct, getStoreProducts, allocateStockToEvent } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isEventWorkspace = activeWorkspace?.type === "event";

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingStore, setLoadingStore] = useState(false);
  const [selections, setSelections] = useState({}); // { variantId: qty }
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  // Load store products when import modal opens
  useEffect(() => {
    if (importModal) {
      setLoadingStore(true);
      setSelections({});
      getStoreProducts()
        .then(setStoreProducts)
        .catch(() => {})
        .finally(() => setLoadingStore(false));
    }
  }, [importModal]);

  async function handleImport() {
    const items = Object.entries(selections)
      .filter(([_, qty]) => qty > 0)
      .map(([variantId, quantity]) => ({ variantId, quantity }));
    if (items.length === 0) return;

    setImporting(true);
    try {
      await allocateStockToEvent(activeWorkspaceId, items);
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);
      showToast("success", `Berhasil menambahkan ${items.length} variant (${totalQty} unit) ke event.`);
      setImportModal(false);
    } catch (err) {
      showToast("error", err.message || "Gagal menambahkan produk.");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(product) {
    await updateProduct(product.id, { isActive: false });
    setDeleteConfirm(null);
  }

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

      {/* Event info banner */}
      {isEventWorkspace && (
        <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-soft)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🏪</span>
          <div style={{ flex: 1 }}>
            <strong>Katalog Event: {activeWorkspace?.name}</strong>
            <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>
              Menampilkan produk yang tersedia di event ini. Gunakan "Ambil dari Toko" untuk menambahkan produk dari toko utama.
            </div>
          </div>
        </div>
      )}

      {/* Search + Add */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="input-wrap" style={{ flex: "1 1 200px" }}>
          <span className="input-icon">
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isEventWorkspace && (
          <button className="btn btn-primary" onClick={() => setImportModal(true)}>
            🏪 Ambil dari Toko
          </button>
        )}
        {!isEventWorkspace && (
          <Link to="/catalog/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {" "}Tambah Produk
          </Link>
        )}
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
                <button className="btn btn-ghost btn-sm btn-icon" style={{ color: "var(--danger)" }} type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p); }}>
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

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, padding: "12px 20px", borderRadius: 10, background: toast.type === "success" ? "var(--success)" : "var(--danger)", color: "#fff", fontSize: 13.5, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxWidth: 400 }}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.message}
        </div>
      )}

      {/* Import from Store Modal */}
      {importModal && (
        <div className="modal-overlay" onClick={() => setImportModal(false)}>
          <div className="modal" style={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>Ambil Produk dari Toko</div>
                <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  Pilih produk dan jumlah stok awal untuk event.
                  {activeWorkspace?.stockMode === "allocate" && " Stok toko akan berkurang."}
                  {activeWorkspace?.stockMode === "manual" && " Stok toko tidak terpengaruh."}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setImportModal(false)}>✕</button>
            </div>

            {loadingStore ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-soft)", fontSize: 13 }}>Memuat produk toko...</div>
            ) : (
              <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {(() => {
                  // Filter out products already fully in event
                  const eventVariantIds = new Set((products || []).flatMap(p => (p.variants || []).map(v => v.id)));
                  const available = storeProducts.filter(p =>
                    p.variants.some(v => !eventVariantIds.has(v.id) && v.quantityOnHand > 0)
                  );

                  if (available.length === 0) {
                    return (
                      <div style={{ padding: 24, textAlign: "center", color: "var(--text-soft)", fontSize: 13 }}>
                        Semua produk toko sudah ada di event ini.
                      </div>
                    );
                  }

                  return available.map(product => (
                    <div key={product.id}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                        {product.name}
                        <span style={{ fontWeight: 400, color: "var(--text-soft)", marginLeft: 6 }}>{product.category}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {product.variants.map(v => {
                          const label = v.attribute1Value || v.sku;
                          const storeQty = v.quantityOnHand || 0;
                          const alreadyInEvent = eventVariantIds.has(v.id);
                          const qty = selections[v.id] || 0;

                          return (
                            <div key={v.id} style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "6px 10px", background: "var(--surface)", borderRadius: 8,
                              fontSize: 12, opacity: storeQty === 0 || alreadyInEvent ? 0.5 : 1,
                            }}>
                              <div style={{ minWidth: 28, height: 22, borderRadius: 4, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10 }}>{label}</div>
                              <div style={{ flex: 1, color: "var(--text-soft)" }}>
                                Toko: <strong style={{ color: storeQty === 0 ? "var(--danger)" : "var(--text)" }}>{storeQty}</strong>
                                {alreadyInEvent && <span className="badge badge-blue" style={{ fontSize: 9, marginLeft: 6 }}>sudah di event</span>}
                              </div>
                              {storeQty > 0 && !alreadyInEvent && (
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                                    onClick={() => setSelections(s => ({ ...s, [v.id]: Math.max(0, (s[v.id] || 0) - 1) }))}>−</div>
                                  <input type="number" min={0} max={activeWorkspace?.stockMode === "allocate" ? storeQty : 9999} value={qty}
                                    onChange={e => {
                                      const max = activeWorkspace?.stockMode === "allocate" ? storeQty : 9999;
                                      setSelections(s => ({ ...s, [v.id]: Math.min(max, Math.max(0, parseInt(e.target.value) || 0)) }));
                                    }}
                                    style={{ width: 40, textAlign: "center", padding: "2px", border: "1px solid var(--line)", borderRadius: 4, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }} />
                                  <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                                    onClick={() => {
                                      const max = activeWorkspace?.stockMode === "allocate" ? storeQty : 9999;
                                      setSelections(s => ({ ...s, [v.id]: Math.min(max, (s[v.id] || 0) + 1) }));
                                    }}>+</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {(() => {
              const totalItems = Object.values(selections).filter(q => q > 0).length;
              const totalQty = Object.values(selections).reduce((a, b) => a + b, 0);
              return totalItems > 0 ? (
                <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-soft)", borderRadius: 8, padding: "10px 14px", marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-soft)" }}>{totalItems} variant dipilih</span>
                  <span style={{ fontWeight: 800, color: "var(--accent)" }}>{totalQty} unit</span>
                </div>
              ) : null;
            })()}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setImportModal(false)} disabled={importing}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 42 }}
                disabled={Object.values(selections).reduce((a, b) => a + b, 0) === 0 || importing}
                onClick={handleImport}>
                {importing ? "Menambahkan..." : "Tambahkan ke Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ width: 380, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            {/* Red circle with trash icon */}
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Hapus Produk?</div>
            <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 20 }}>
              Produk <strong>{deleteConfirm.name}</strong> akan dihapus dari katalog.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn" style={{ flex: 1, background: "var(--danger)", color: "#fff" }} onClick={() => handleDelete(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
