import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function CatalogPage() {
  const { products, workspaces, categories, settings, loading, loadError, updateProduct, getStoreProducts, allocateStockToEvent, bulkImportProducts } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isEventWorkspace = activeWorkspace?.type === "event";

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingStore, setLoadingStore] = useState(false);
  const [selections, setSelections] = useState({}); // allocate: { variantId: qty }, manual: { variantId: true }
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [importCsvModal, setImportCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const csvFileRef = useRef(null);
  const isAllocateMode = activeWorkspace?.stockMode === "allocate";

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const XLSX_HEADERS = ["Nama Produk", "Kategori", "Harga Dasar", "SKU", "Atribut 1", "Atribut 2", "Stok", "Harga Override", "Status"];

  function handleExportXlsx() {
    const rows = [];
    for (const product of (products || [])) {
      for (const variant of (product.variants || [])) {
        rows.push({
          "Nama Produk": product.name,
          "Kategori": product.category || "",
          "Harga Dasar": product.basePrice || 0,
          "SKU": variant.sku || "",
          "Atribut 1": variant.attribute1Value || "",
          "Atribut 2": variant.attribute2Value || "",
          "Stok": variant.quantityOnHand || 0,
          "Harga Override": variant.priceOverride || "",
          "Status": product.isActive ? "active" : "inactive",
        });
      }
      if (!product.variants || product.variants.length === 0) {
        rows.push({
          "Nama Produk": product.name,
          "Kategori": product.category || "",
          "Harga Dasar": product.basePrice || 0,
          "SKU": "", "Atribut 1": "", "Atribut 2": "", "Stok": "", "Harga Override": "",
          "Status": product.isActive ? "active" : "inactive",
        });
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows, { header: XLSX_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Katalog");
    XLSX.writeFile(wb, `katalog-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function handleDownloadTemplate() {
    const templateRows = [
      { "Nama Produk": "Contoh Produk A", "Kategori": "Atasan", "Harga Dasar": 150000, "SKU": "PRD-A-S", "Atribut 1": "S", "Atribut 2": "Hitam", "Stok": 10, "Harga Override": "", "Status": "active" },
      { "Nama Produk": "Contoh Produk A", "Kategori": "Atasan", "Harga Dasar": 150000, "SKU": "PRD-A-M", "Atribut 1": "M", "Atribut 2": "Hitam", "Stok": 15, "Harga Override": "", "Status": "active" },
      { "Nama Produk": "Contoh Produk B", "Kategori": "Bawahan", "Harga Dasar": 200000, "SKU": "PRD-B-L", "Atribut 1": "L", "Atribut 2": "Navy", "Stok": 8, "Harga Override": 185000, "Status": "active" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateRows, { header: XLSX_HEADERS });
    // Set column widths
    ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-import-katalog.xlsx");
  }

  function handleImportFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      setCsvPreview(rows);
    };
    reader.readAsArrayBuffer(file);
  }

  function xlsxRowsToProducts(rows) {
    const productMap = new Map();
    for (const row of rows) {
      const name = row["Nama Produk"];
      if (!name) continue;
      if (!productMap.has(name)) {
        productMap.set(name, {
          name,
          category: row["Kategori"] || "",
          basePrice: Number(row["Harga Dasar"]) || 0,
          description: "",
          variants: [],
        });
      }
      const product = productMap.get(name);
      if (row["SKU"] || row["Atribut 1"]) {
        product.variants.push({
          sku: String(row["SKU"] || ""),
          attribute1Value: String(row["Atribut 1"] || ""),
          attribute2Value: String(row["Atribut 2"] || ""),
          quantityOnHand: Number(row["Stok"]) || 0,
          priceOverride: row["Harga Override"] ? Number(row["Harga Override"]) : null,
        });
      }
    }
    return [...productMap.values()];
  }

  async function handleImportConfirm() {
    const productsToImport = xlsxRowsToProducts(csvPreview);
    if (productsToImport.length === 0) {
      showToast("error", "Tidak ada produk valid untuk diimport.");
      return;
    }
    if (productsToImport.length > 500) {
      showToast("error", "Maksimal 500 produk per import.");
      return;
    }
    setImportingCsv(true);
    try {
      const result = await bulkImportProducts(productsToImport);
      showToast("success", `Berhasil import ${result.created} produk.${result.errors?.length ? ` ${result.errors.length} gagal.` : ""}`);
      setImportCsvModal(false);
      setCsvPreview([]);
      if (csvFileRef.current) csvFileRef.current.value = "";
    } catch (err) {
      showToast("error", err.message || "Gagal import produk.");
    } finally {
      setImportingCsv(false);
    }
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
    let items;
    if (isAllocateMode) {
      // Allocate: send qty per variant
      items = Object.entries(selections)
        .filter(([_, qty]) => qty > 0)
        .map(([variantId, quantity]) => ({ variantId, quantity }));
    } else {
      // Manual: add products to catalog with qty=0 (user sets stock in Inventory later)
      items = Object.entries(selections)
        .filter(([_, selected]) => selected)
        .map(([variantId]) => ({ variantId, quantity: 0 }));
    }
    if (items.length === 0) return;

    setImporting(true);
    try {
      await allocateStockToEvent(activeWorkspaceId, items);
      showToast("success", isAllocateMode
        ? `Berhasil mengalokasikan ${items.length} variant ke event.`
        : `Berhasil menambahkan ${items.length} variant ke katalog event. Atur stok di halaman Inventori.`
      );
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
        <Link to="/catalog/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {" "}Tambah Produk
        </Link>
        <button className="btn btn-secondary" onClick={handleExportXlsx} title="Export katalog ke Excel">
          📥 Export
        </button>
        <button className="btn btn-secondary" onClick={() => { setImportCsvModal(true); setCsvPreview([]); }} title="Import produk dari CSV">
          📤 Import
        </button>
        {isEventWorkspace && (
          <button className="btn btn-secondary" onClick={() => setImportModal(true)}>
            🏪 Ambil dari Toko
          </button>
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
                overflow: "hidden",
              }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>{p.category || "produk"}</span>
                )}
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
                  {isAllocateMode
                    ? "Pilih produk dan jumlah stok yang ingin dialokasikan. Stok toko akan berkurang."
                    : "Pilih produk yang ingin ditambahkan ke katalog event. Atur stok nanti di halaman Inventori."
                  }
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
                                {isAllocateMode && <>Toko: <strong style={{ color: storeQty === 0 ? "var(--danger)" : "var(--text)" }}>{storeQty}</strong></>}
                                {alreadyInEvent && <span className="badge badge-blue" style={{ fontSize: 9, marginLeft: 6 }}>sudah di event</span>}
                              </div>
                              {!alreadyInEvent && (storeQty > 0 || !isAllocateMode) && (
                                isAllocateMode ? (
                                  /* Allocate mode: qty input */
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                                      onClick={() => setSelections(s => ({ ...s, [v.id]: Math.max(0, (s[v.id] || 0) - 1) }))}>−</div>
                                    <input type="number" min={0} max={storeQty} value={qty}
                                      onChange={e => setSelections(s => ({ ...s, [v.id]: Math.min(storeQty, Math.max(0, parseInt(e.target.value) || 0)) }))}
                                      style={{ width: 40, textAlign: "center", padding: "2px", border: "1px solid var(--line)", borderRadius: 4, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }} />
                                    <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                                      onClick={() => setSelections(s => ({ ...s, [v.id]: Math.min(storeQty, (s[v.id] || 0) + 1) }))}>+</div>
                                  </div>
                                ) : (
                                  /* Manual mode: checkbox only */
                                  <input type="checkbox" checked={!!selections[v.id]}
                                    onChange={e => setSelections(s => ({ ...s, [v.id]: e.target.checked }))}
                                    style={{ width: 18, height: 18, cursor: "pointer" }} />
                                )
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
              const selectedCount = isAllocateMode
                ? Object.values(selections).filter(q => q > 0).length
                : Object.values(selections).filter(Boolean).length;
              const totalQty = isAllocateMode
                ? Object.values(selections).reduce((a, b) => a + (Number(b) || 0), 0)
                : selectedCount;
              return selectedCount > 0 ? (
                <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-soft)", borderRadius: 8, padding: "10px 14px", marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-soft)" }}>{selectedCount} variant dipilih</span>
                  {isAllocateMode && <span style={{ fontWeight: 800, color: "var(--accent)" }}>{totalQty} unit</span>}
                </div>
              ) : null;
            })()}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setImportModal(false)} disabled={importing}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 42 }}
                disabled={(() => {
                  if (isAllocateMode) return Object.values(selections).reduce((a, b) => a + (Number(b) || 0), 0) === 0;
                  return !Object.values(selections).some(Boolean);
                })() || importing}
                onClick={handleImport}>
                {importing ? "Menambahkan..." : isAllocateMode ? "Alokasikan ke Event" : "Tambahkan ke Katalog Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import XLSX Modal */}
      {importCsvModal && (
        <div className="modal-overlay" onClick={() => setImportCsvModal(false)}>
          <div className="modal" style={{ width: 600 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div className="modal-title" style={{ marginBottom: 2 }}>Import Produk</div>
                <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  Upload file Excel (.xlsx) dengan format yang sesuai template.
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setImportCsvModal(false)}>✕</button>
            </div>

            {/* Template download */}
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Belum punya template?</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>Unduh template Excel lalu isi data produk Anda.</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>
                📄 Unduh Template
              </button>
            </div>

            {/* File picker */}
            <div style={{ marginBottom: 16 }}>
              <label className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                📁 Pilih File Excel
                <input
                  ref={csvFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFileChange}
                  style={{ display: "none" }}
                />
              </label>
              {csvFileRef.current?.files?.[0] && (
                <span style={{ marginLeft: 10, fontSize: 13, color: "var(--text-soft)" }}>
                  {csvFileRef.current.files[0].name}
                </span>
              )}
            </div>

            {/* Preview table */}
            {csvPreview.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Preview: {xlsxRowsToProducts(csvPreview).length} produk, {csvPreview.length} baris
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surface)", position: "sticky", top: 0 }}>
                        <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid var(--line)" }}>Nama</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid var(--line)" }}>Kategori</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: "1px solid var(--line)" }}>Harga</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid var(--line)" }}>SKU</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid var(--line)" }}>Atribut</th>
                        <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: "1px solid var(--line)" }}>Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 50).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "5px 8px", fontWeight: 600 }}>{row["Nama Produk"] || "-"}</td>
                          <td style={{ padding: "5px 8px", color: "var(--text-soft)" }}>{row["Kategori"] || "-"}</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(Number(row["Harga Dasar"]) || 0)}</td>
                          <td style={{ padding: "5px 8px", fontFamily: "monospace", fontSize: 11 }}>{row["SKU"] || "-"}</td>
                          <td style={{ padding: "5px 8px", color: "var(--text-soft)" }}>{[row["Atribut 1"], row["Atribut 2"]].filter(Boolean).join(" / ") || "-"}</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row["Stok"] || "0"}</td>
                        </tr>
                      ))}
                      {csvPreview.length > 50 && (
                        <tr>
                          <td colSpan={6} style={{ padding: "8px", textAlign: "center", color: "var(--text-soft)", fontSize: 11 }}>
                            ...dan {csvPreview.length - 50} baris lainnya
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setImportCsvModal(false); setCsvPreview([]); }} disabled={importingCsv}>Batal</button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, height: 42 }}
                disabled={csvPreview.length === 0 || importingCsv}
                onClick={handleImportConfirm}
              >
                {importingCsv ? "Mengimport..." : `Import ${xlsxRowsToProducts(csvPreview).length} Produk`}
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
