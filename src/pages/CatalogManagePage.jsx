import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

export function CatalogManagePage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const {
    categories,
    createProduct,
    createVariant,
    products,
    settings,
    updateProduct,
    updateVariant,
  } = usePosData();

  const isNew = !productId;
  const product = products.find((p) => p.id === productId) || null;
  const attr1Label = settings?.attribute1Label || "Size";
  const attr2Label = settings?.attribute2Label || "";

  const catList = useMemo(() => [...new Set((categories || []).map((c) => c.name))].sort(), [categories]);

  const [form, setForm] = useState({ name: "", category: catList[0] || "", description: "", basePrice: "" });
  const [variants, setVariants] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saveError, setSaveError] = useState("");
  const loadedProductIdRef = useRef(null);

  // Load product data — only when product actually changes (by id)
  useEffect(() => {
    if (isNew) {
      if (loadedProductIdRef.current !== "new") {
        setForm({ name: "", category: catList[0] || "", description: "", basePrice: "" });
        setVariants([{ label: "", qty: 0, sku: "" }]);
        loadedProductIdRef.current = "new";
      }
      return;
    }
    if (!product || loadedProductIdRef.current === product.id) return;
    loadedProductIdRef.current = product.id;
    setForm({
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      basePrice: String(product.basePrice || ""),
    });
    setVariants(
      (product.variants || []).map((v) => ({
        id: v.id,
        label: v.attribute1Value || v.sku,
        qty: v.quantityOnHand || 0,
        sku: v.sku || "",
        attribute1Value: v.attribute1Value || "",
        attribute2Value: v.attribute2Value || "",
        priceOverride: v.priceOverride != null ? v.priceOverride : null,
        lowStockThreshold: v.lowStockThreshold || 0,
      }))
    );
  }, [product, isNew, catList]);

  const totalStock = variants.reduce((s, v) => s + (parseInt(v.qty) || 0), 0);

  function addSize() {
    const label = newSize.trim().toUpperCase();
    if (!label || variants.find((v) => v.label === label)) return;
    const skuPrefix = (form.name || "PRD").substring(0, 3).toUpperCase().replace(/\s/g, "");
    setVariants((prev) => [...prev, {
      label,
      qty: 0,
      sku: `${skuPrefix}-${label}`,
      attribute1Value: label,
      attribute2Value: "",
      lowStockThreshold: 3,
    }]);
    setNewSize("");
  }

  function removeSize(label) {
    setVariants((prev) => prev.filter((v) => v.label !== label));
  }

  function setQty(label, val) {
    setVariants((prev) => prev.map((v) => v.label === label ? { ...v, qty: Math.max(0, parseInt(val) || 0) } : v));
  }

  function updateVariantField(label, field, val) {
    setVariants((prev) => prev.map((v) => v.label === label ? { ...v, [field]: val } : v));
  }

  async function handleSave() {
    if (!form.name || !form.basePrice) return;
    setSubmitting(true);
    try {
      if (isNew) {
        await createProduct({
          ...form,
          basePrice: parseInt(String(form.basePrice).replace(/\D/g, "")) || 0,
          isActive: true,
          variants: variants.map((v) => ({
            sku: v.sku || `${form.name.substring(0, 3).toUpperCase()}-${v.label}`,
            attribute1Value: v.label,
            attribute2Value: v.attribute2Value || "",
            quantityOnHand: parseInt(v.qty) || 0,
            lowStockThreshold: 3,
            isActive: true,
          })),
        });
      } else {
        // Update product info first
        await updateProduct(productId, {
          ...form,
          basePrice: parseInt(String(form.basePrice).replace(/\D/g, "")) || 0,
          isActive: true,
        });
        // Update variants one by one
        // Note: each call triggers bootstrap reload, but we block form reset with `initialized` flag
        for (const v of variants) {
          const variantPayload = {
            sku: v.sku || `${(form.name || "PRD").substring(0, 3).toUpperCase().replace(/\s/g, "")}-${v.label}`,
            attribute1Value: v.label || "",
            attribute2Value: v.attribute2Value || "",
            quantityOnHand: parseInt(v.qty) || 0,
            lowStockThreshold: parseInt(v.lowStockThreshold) || 3,
            isActive: true,
            priceOverride: v.priceOverride != null ? Number(v.priceOverride) : null,
          };

          try {
            if (v.id) {
              await updateVariant(v.id, variantPayload);
            } else if (v.label) {
              await createVariant(productId, variantPayload);
            }
          } catch (err) {
            console.error("Variant save error:", v.label, err);
          }
        }
      }
      setSaved(true);
      setSaveError("");
      setTimeout(() => { setSaved(false); navigate("/catalog"); }, 1200);
    } catch (err) {
      setSaveError(err.message || "Gagal menyimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content" style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/catalog")}>← Kembali</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{isNew ? "Tambah Produk Baru" : `Edit: ${product?.name || ""}`}</div>
          {!isNew && product ? <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>SKU {(product.variants || [])[0]?.sku || "-"}</div> : null}
        </div>
        {!isNew ? (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setDeleteConfirm(true)}>
            <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            {" "}Hapus Produk
          </button>
        ) : null}
        <button className="btn btn-primary" style={{ minWidth: 140, height: 40 }} onClick={handleSave} disabled={submitting}>
          {saved ? "✓ Tersimpan!" : submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {saveError ? (
        <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>
          {saveError}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Info Produk */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>INFORMASI PRODUK</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Nama Produk *</label>
                <input className="input" placeholder="mis: T-Shirt Basic White" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ fontSize: 14, fontWeight: 600 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kategori</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ appearance: "auto" }}>
                    {catList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Harga Jual (Rp) *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13.5, fontWeight: 600, color: "var(--text-soft)" }}>Rp</span>
                    <input className="input" placeholder="85.000" value={form.basePrice ? Number(form.basePrice).toLocaleString("id-ID") : ""} onChange={(e) => setForm({ ...form, basePrice: e.target.value.replace(/\D/g, "") })} style={{ paddingLeft: 36, fontSize: 14, fontWeight: 700 }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deskripsi</label>
                <textarea className="input" rows={3} placeholder="Deskripsi singkat produk..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical", lineHeight: 1.5 }} />
              </div>
            </div>
          </div>

          {/* Ukuran & Stok */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{(attr1Label || "UKURAN").toUpperCase()} & STOK</div>
              <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>Total: <strong style={{ color: "var(--text)" }}>{totalStock} unit</strong></span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {variants.map((sz) => (
                <div key={sz.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", borderRadius: 8 }}>
                  <div style={{ width: 44, height: 32, borderRadius: 6, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{sz.label || "—"}</div>
                  {attr2Label ? (
                    <input className="input" placeholder={attr2Label} value={sz.attribute2Value || ""} onChange={(e) => updateVariantField(sz.label, "attribute2Value", e.target.value)} style={{ width: 90, fontSize: 12, padding: "4px 8px" }} />
                  ) : null}
                  <div style={{ flex: 1, fontSize: 13, color: "var(--text-soft)", fontWeight: 500 }}>Stok tersedia</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="qty-btn" style={{ width: 28, height: 28 }} onClick={() => setQty(sz.label, sz.qty - 1)}>−</div>
                    <input type="number" min={0} value={sz.qty} onChange={(e) => setQty(sz.label, e.target.value)} style={{ width: 60, textAlign: "center", padding: "4px 6px", border: "1px solid var(--line)", borderRadius: 6, fontFamily: "inherit", fontWeight: 700, fontSize: 14 }} />
                    <div className="qty-btn" style={{ width: 28, height: 28 }} onClick={() => setQty(sz.label, sz.qty + 1)}>+</div>
                  </div>
                  <div style={{ width: 48, textAlign: "right" }}>
                    <span className={`badge ${sz.qty === 0 ? "badge-red" : sz.qty <= 3 ? "badge-amber" : "badge-green"}`} style={{ fontSize: 10.5 }}>
                      {sz.qty === 0 ? "Habis" : sz.qty <= 3 ? "Hampir" : "OK"}
                    </span>
                  </div>
                  <button onClick={() => removeSize(sz.label)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center" }}>
                    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="input" placeholder={`Tambah ${(attr1Label || "ukuran").toLowerCase()} (mis: XS, XXL, 30...)`} value={newSize} onChange={(e) => setNewSize(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSize()} style={{ flex: 1, fontSize: 13 }} />
              <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={addSize}>
                <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {" "}Tambah
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Image upload */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ aspectRatio: "1", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
              <svg width={48} height={48} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <div style={{ fontSize: 13, color: "var(--text-soft)", fontWeight: 600 }}>Upload Foto Produk</div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>JPG, PNG — maks 5 MB</div>
            </div>
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)" }}>
              <button className="btn btn-secondary btn-sm w-full">Pilih Foto</button>
            </div>
          </div>

          {/* Status */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>STATUS PRODUK</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <StatusToggle label="Tampilkan di Katalog" desc="Produk bisa dilihat & dijual" defaultOn />
              <StatusToggle label="Tersedia di Bazar" desc="Bisa dialokasikan ke event" defaultOn />
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{ background: "var(--accent-light)", border: "1px solid var(--accent-soft)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>RINGKASAN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Harga", value: form.basePrice ? formatCurrency(Number(form.basePrice)) : "—" },
                { label: "Total Stok", value: `${totalStock} unit` },
                { label: attr1Label || "Ukuran", value: variants.length > 0 ? variants.map((v) => v.label).filter(Boolean).join(", ") || "—" : "—" },
                { label: "Kategori", value: form.category || "—" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-soft)", fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm ? (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" style={{ width: 380, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width={22} height={22} fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Hapus Produk?</div>
            <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 20 }}>
              <strong>{product?.name}</strong> akan dihapus permanen dari katalog dan tidak bisa dikembalikan.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(false)}>Batal</button>
              <button className="btn" style={{ flex: 1, background: "var(--danger)", color: "#fff" }} onClick={async () => { await updateProduct(productId, { isActive: false }); navigate("/catalog"); }}>Hapus</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Toggle component
function StatusToggle({ label, desc, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-soft)" }}>{desc}</div>
      </div>
      <div onClick={() => setOn(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? "var(--accent)" : "var(--surface-2)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
      </div>
    </div>
  );
}
