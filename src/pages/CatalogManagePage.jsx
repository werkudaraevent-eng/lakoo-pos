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
    uploadImage,
  } = usePosData();

  const isNew = !productId;
  const product = products.find((p) => p.id === productId) || null;
  const attr1Label = settings?.attribute1Label || "Size";
  const attr2Label = settings?.attribute2Label || "";

  const catList = useMemo(() => [...new Set((categories || []).map((c) => c.name))].sort(), [categories]);

  const [form, setForm] = useState({ name: "", category: "", description: "", basePrice: "" });

  // Option groups — user defines these
  const [option1Values, setOption1Values] = useState([]); // e.g., ["S", "M", "L"]
  const [option2Values, setOption2Values] = useState([]); // e.g., ["Hitam", "Putih"]
  const [newOpt1, setNewOpt1] = useState("");
  const [newOpt2, setNewOpt2] = useState("");

  // Generated variants — auto-computed from option combinations
  const [variantData, setVariantData] = useState({}); // { "S|Hitam": { qty: 10, sku: "PRD-S-BLK", priceOverride: null }, ... }

  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const catRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const loadedProductIdRef = useRef(null);

  // Load product data — only when product actually changes (by id)
  useEffect(() => {
    if (isNew) {
      if (loadedProductIdRef.current !== "new") {
        setForm({ name: "", category: "", description: "", basePrice: "" });
        setOption1Values([]);
        setOption2Values([]);
        setVariantData({});
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
    setImagePreview(product.imageUrl || null);
    setImageFile(null);

    // Extract option values from existing variants
    const attr1Set = new Set();
    const attr2Set = new Set();
    const data = {};

    for (const v of product.variants || []) {
      const a1 = v.attribute1Value || "";
      const a2 = v.attribute2Value || "";
      if (a1) attr1Set.add(a1);
      if (a2) attr2Set.add(a2);
      const key = `${a1}|${a2}`;
      data[key] = {
        id: v.id,
        qty: v.quantityOnHand || 0,
        sku: v.sku || "",
        priceOverride: v.priceOverride != null ? v.priceOverride : null,
        lowStockThreshold: v.lowStockThreshold || 3,
      };
    }

    setOption1Values([...attr1Set]);
    setOption2Values([...attr2Set]);
    setVariantData(data);
  }, [product, isNew, catList]);

  // Auto-generate variants when options change
  useEffect(() => {
    // Generate all combinations
    if (option1Values.length === 0 && option2Values.length === 0) {
      // No options — no variants to generate
      return;
    }

    const list1 = option1Values.length > 0 ? option1Values : [""];
    const list2 = option2Values.length > 0 ? option2Values : [""];

    const combos = [];
    for (const v1 of list1) {
      for (const v2 of list2) {
        const key = `${v1}|${v2}`;
        combos.push(key);
      }
    }

    // Preserve existing data for combos that still exist
    setVariantData((prev) => {
      const next = {};
      for (const key of combos) {
        if (prev[key]) {
          next[key] = prev[key];
        } else {
          const [a1, a2] = key.split("|");
          const skuPrefix = (form.name || "PRD").substring(0, 3).toUpperCase().replace(/\s/g, "");
          next[key] = {
            qty: 0,
            sku: `${skuPrefix}-${a1}${a2 ? "-" + a2 : ""}`.replace(/\s/g, ""),
            priceOverride: null,
            lowStockThreshold: 3,
          };
        }
      }
      return next;
    });
  }, [option1Values, option2Values]);

  const totalStock = Object.values(variantData).reduce((s, v) => s + (parseInt(v.qty) || 0), 0);

  const labelStyle = { fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };

  function addOption1() {
    const val = newOpt1.trim();
    if (!val || option1Values.includes(val)) return;
    setOption1Values((prev) => [...prev, val]);
    setNewOpt1("");
  }

  function addOption2() {
    const val = newOpt2.trim();
    if (!val || option2Values.includes(val)) return;
    setOption2Values((prev) => [...prev, val]);
    setNewOpt2("");
  }

  function getVariantsForSave() {
    return Object.entries(variantData).map(([key, data]) => {
      const [a1, a2] = key.split("|");
      return {
        id: data.id, // existing variant ID (for update)
        sku: data.sku,
        attribute1Value: a1,
        attribute2Value: a2,
        quantityOnHand: parseInt(data.qty) || 0,
        priceOverride: data.priceOverride != null ? Number(data.priceOverride) : null,
        lowStockThreshold: parseInt(data.lowStockThreshold) || 3,
        isActive: true,
      };
    });
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("File harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Ukuran file maksimal 5 MB.");
      return;
    }

    setImageFile(file);
    setSaveError("");

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name || !form.basePrice) return;
    setSubmitting(true);
    setSaveError("");

    // Upload image if a new file was selected
    let imageUrl = imagePreview && !imageFile ? imagePreview : null;
    if (imageFile) {
      setUploading(true);
      try {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imageFile);
        });
        imageUrl = await uploadImage(base64);
      } catch (err) {
        setSaveError("Gagal upload gambar: " + (err.message || "Coba lagi."));
        setUploading(false);
        setSubmitting(false);
        return;
      }
      setUploading(false);
    }

    try {
      const variantsToSave = getVariantsForSave();

      if (isNew) {
        await createProduct({
          ...form,
          basePrice: parseInt(String(form.basePrice).replace(/\D/g, "")) || 0,
          imageUrl: imageUrl || null,
          isActive: true,
          variants: variantsToSave,
        });
      } else {
        // Update product info first
        await updateProduct(productId, {
          ...form,
          basePrice: parseInt(String(form.basePrice).replace(/\D/g, "")) || 0,
          imageUrl: imageUrl || null,
          isActive: true,
        });
        // Update variants one by one
        // Note: each call triggers bootstrap reload, but we block form reset with `initialized` flag
        for (const v of variantsToSave) {
          const variantPayload = {
            sku: v.sku,
            attribute1Value: v.attribute1Value || "",
            attribute2Value: v.attribute2Value || "",
            quantityOnHand: parseInt(v.quantityOnHand) || 0,
            lowStockThreshold: parseInt(v.lowStockThreshold) || 3,
            isActive: true,
            priceOverride: v.priceOverride != null ? Number(v.priceOverride) : null,
          };

          try {
            if (v.id) {
              await updateVariant(v.id, variantPayload);
            } else if (v.attribute1Value || v.attribute2Value) {
              await createVariant(productId, variantPayload);
            }
          } catch (err) {
            console.error("Variant save error:", v.attribute1Value, v.attribute2Value, err);
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
                <div style={{ position: "relative" }} ref={catRef}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kategori</label>
                  <input
                    className="input"
                    placeholder="Ketik atau pilih kategori"
                    value={form.category}
                    onChange={(e) => { setForm({ ...form, category: e.target.value }); setCatOpen(true); }}
                    onFocus={() => setCatOpen(true)}
                  />
                  {/* Custom dropdown */}
                  {catOpen && (
                    <>
                      {/* Invisible overlay to close on click outside */}
                      <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setCatOpen(false)} />
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                        marginTop: 4, background: "#fff", border: "1px solid var(--line)",
                        borderRadius: "var(--radius-sm, 8px)", boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.06))",
                        maxHeight: 200, overflowY: "auto",
                      }}>
                        {catList
                          .filter(c => !form.category || c.toLowerCase().includes(form.category.toLowerCase()))
                          .map(c => (
                            <div
                              key={c}
                              onClick={() => { setForm({ ...form, category: c }); setCatOpen(false); }}
                              style={{
                                padding: "8px 12px", fontSize: 13, cursor: "pointer",
                                background: form.category === c ? "var(--accent-soft)" : "transparent",
                                fontWeight: form.category === c ? 700 : 500,
                                transition: "background-color 0.1s ease",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = form.category === c ? "var(--accent-soft)" : "transparent"}
                            >
                              {c}
                            </div>
                          ))
                        }
                        {form.category && !catList.includes(form.category) && (
                          <div
                            onClick={() => setCatOpen(false)}
                            style={{
                              padding: "8px 12px", fontSize: 13, cursor: "pointer",
                              borderTop: catList.length > 0 ? "1px solid var(--line)" : "none",
                              color: "var(--accent)", fontWeight: 600,
                            }}
                          >
                            + Buat kategori "{form.category}"
                          </div>
                        )}
                        {!form.category && catList.length === 0 && (
                          <div style={{ padding: "12px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                            Belum ada kategori. Ketik untuk membuat baru.
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

          {/* Opsi & Varian */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
              OPSI & VARIAN
            </div>

            {/* Option 1 (e.g., Size) */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{attr1Label || "Opsi 1"} (mis: S, M, L)</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {option1Values.map((v) => (
                  <span key={v} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", background: "var(--accent-soft)", color: "var(--accent)",
                    borderRadius: 20, fontSize: 12, fontWeight: 700,
                  }}>
                    {v}
                    <button onClick={() => setOption1Values((prev) => prev.filter((x) => x !== v))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input" placeholder={`Tambah ${attr1Label || "opsi"}...`} value={newOpt1}
                  onChange={(e) => setNewOpt1(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { addOption1(); } }}
                  style={{ flex: 1, fontSize: 13 }} />
                <button className="btn btn-secondary btn-sm" onClick={addOption1}>+ Tambah</button>
              </div>
            </div>

            {/* Option 2 (e.g., Color) — only show if attr2Label exists */}
            {attr2Label && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{attr2Label} (mis: Hitam, Putih)</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {option2Values.map((v) => (
                    <span key={v} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", background: "#e8f0f8", color: "var(--blue)",
                      borderRadius: 20, fontSize: 12, fontWeight: 700,
                    }}>
                      {v}
                      <button onClick={() => setOption2Values((prev) => prev.filter((x) => x !== v))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="input" placeholder={`Tambah ${attr2Label}...`} value={newOpt2}
                    onChange={(e) => setNewOpt2(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addOption2(); } }}
                    style={{ flex: 1, fontSize: 13 }} />
                  <button className="btn btn-secondary btn-sm" onClick={addOption2}>+ Tambah</button>
                </div>
              </div>
            )}

            {/* Divider */}
            {Object.keys(variantData).length > 0 && <div className="divider" />}

            {/* Variant Matrix Table */}
            {Object.keys(variantData).length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>
                    {Object.keys(variantData).length} varian · Total: <strong style={{ color: "var(--text)" }}>{totalStock} unit</strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(variantData).map(([key, data]) => {
                    const [a1, a2] = key.split("|");
                    return (
                      <div key={key} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", background: "var(--surface)", borderRadius: 8, fontSize: 13,
                      }}>
                        {/* Attribute badges */}
                        {a1 && <span style={{ padding: "2px 8px", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{a1}</span>}
                        {a2 && <span style={{ padding: "2px 8px", background: "#e8f0f8", color: "var(--blue)", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{a2}</span>}

                        {/* SKU */}
                        <input className="input" value={data.sku} placeholder="SKU"
                          onChange={(e) => setVariantData((prev) => ({ ...prev, [key]: { ...prev[key], sku: e.target.value } }))}
                          style={{ width: 100, fontSize: 11, padding: "4px 8px", fontFamily: "monospace" }} />

                        {/* Stock */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                          <span style={{ fontSize: 11, color: "var(--text-soft)" }}>Stok:</span>
                          <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                            onClick={() => setVariantData((prev) => ({ ...prev, [key]: { ...prev[key], qty: Math.max(0, (prev[key]?.qty || 0) - 1) } }))}>−</div>
                          <input type="number" min={0} value={data.qty}
                            onChange={(e) => setVariantData((prev) => ({ ...prev, [key]: { ...prev[key], qty: Math.max(0, parseInt(e.target.value) || 0) } }))}
                            style={{ width: 50, textAlign: "center", padding: "2px 4px", border: "1px solid var(--line)", borderRadius: 4, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }} />
                          <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                            onClick={() => setVariantData((prev) => ({ ...prev, [key]: { ...prev[key], qty: (prev[key]?.qty || 0) + 1 } }))}>+</div>
                        </div>

                        {/* Status badge */}
                        <span className={`badge ${data.qty === 0 ? "badge-red" : data.qty <= 3 ? "badge-amber" : "badge-green"}`} style={{ fontSize: 10 }}>
                          {data.qty === 0 ? "Habis" : data.qty <= 3 ? "Hampir" : "OK"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {Object.keys(variantData).length === 0 && option1Values.length === 0 && (
              <div style={{ textAlign: "center", padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>
                Tambahkan opsi di atas untuk membuat varian produk.
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Image upload */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Foto Produk
            </div>

            <div style={{
              aspectRatio: "1",
              background: "var(--surface)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: 10,
              border: "1px dashed var(--line)",
            }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 16 }}>
                  <svg width={32} height={32} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  <div style={{ fontSize: 12, marginTop: 8 }}>JPG, PNG — maks 5 MB</div>
                </div>
              )}
            </div>

            <label className="btn btn-secondary btn-sm w-full" style={{ cursor: "pointer", textAlign: "center" }}>
              {uploading ? "Mengupload..." : imagePreview ? "Ganti Foto" : "Pilih Foto"}
              <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} disabled={uploading} />
            </label>

            {imagePreview && (
              <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 6, color: "var(--danger)" }}
                onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Hapus Foto
              </button>
            )}
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
                { label: attr1Label || "Ukuran", value: option1Values.length > 0 ? option1Values.join(", ") : "—" },
                ...(attr2Label && option2Values.length > 0 ? [{ label: attr2Label, value: option2Values.join(", ") }] : []),
                { label: "Varian", value: Object.keys(variantData).length > 0 ? `${Object.keys(variantData).length} kombinasi` : "—" },
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
