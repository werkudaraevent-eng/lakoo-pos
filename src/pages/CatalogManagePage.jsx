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

  // Toggle-based variant state
  const [hasVariants, setHasVariants] = useState(false);
  const [singleSku, setSingleSku] = useState("");
  const [singleQty, setSingleQty] = useState(0);
  const [option1Label, setOption1Label] = useState("");
  const [option1Values, setOption1Values] = useState([]);
  const [option2Label, setOption2Label] = useState("");
  const [option2Values, setOption2Values] = useState([]);
  const [newOpt1, setNewOpt1] = useState("");
  const [newOpt2, setNewOpt2] = useState("");
  const [variantData, setVariantData] = useState({});
  const [showOption2, setShowOption2] = useState(false);

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
        setHasVariants(false);
        setSingleSku("");
        setSingleQty(0);
        setOption1Label(attr1Label || "");
        setOption1Values([]);
        setOption2Label(attr2Label || "");
        setOption2Values([]);
        setVariantData({});
        setShowOption2(false);
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

    // Detect variant mode from existing variants
    const existingVariants = product.variants || [];
    const hasMultipleOrAttributed = existingVariants.length > 1 ||
      existingVariants.some(v => v.attribute1Value || v.attribute2Value);

    if (hasMultipleOrAttributed) {
      setHasVariants(true);
      // Extract option labels from settings
      setOption1Label(attr1Label || "");
      setOption2Label(attr2Label || "");
      // Extract unique values
      const a1Set = new Set();
      const a2Set = new Set();
      const data = {};
      for (const v of existingVariants) {
        if (v.attribute1Value) a1Set.add(v.attribute1Value);
        if (v.attribute2Value) a2Set.add(v.attribute2Value);
        data[`${v.attribute1Value || ""}|${v.attribute2Value || ""}`] = {
          id: v.id,
          qty: v.quantityOnHand || 0,
          sku: v.sku || "",
          priceOverride: v.priceOverride != null ? v.priceOverride : null,
          lowStockThreshold: v.lowStockThreshold || 3,
        };
      }
      setOption1Values([...a1Set]);
      setOption2Values([...a2Set]);
      if (a2Set.size > 0) setShowOption2(true);
      setVariantData(data);
    } else {
      setHasVariants(false);
      setSingleSku(existingVariants[0]?.sku || "");
      setSingleQty(existingVariants[0]?.quantityOnHand || 0);
    }
  }, [product, isNew, catList]);

  // Auto-generate variants when options change (only in variant mode)
  useEffect(() => {
    if (!hasVariants) return;
    if (option1Values.length === 0 && option2Values.length === 0) return;

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
  }, [option1Values, option2Values, hasVariants]);

  const totalStock = hasVariants
    ? Object.values(variantData).reduce((s, v) => s + (parseInt(v.qty) || 0), 0)
    : singleQty;

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
        id: data.id,
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

  function handleToggleVariants() {
    if (hasVariants) {
      // Turning OFF — warn if variants exist
      if (Object.keys(variantData).length > 0) {
        const confirmed = window.confirm("Varian akan dihapus dan produk akan menjadi 1 SKU saja. Lanjutkan?");
        if (!confirmed) return;
      }
      setHasVariants(false);
      // Optionally preserve first variant's data as single
      const firstEntry = Object.values(variantData)[0];
      if (firstEntry) {
        setSingleSku(firstEntry.sku || "");
        setSingleQty(firstEntry.qty || 0);
      }
    } else {
      // Turning ON
      setHasVariants(true);
      if (!option1Label) setOption1Label(attr1Label || "");
      if (!option2Label) setOption2Label(attr2Label || "");
    }
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
      let variantsPayload;
      if (hasVariants) {
        variantsPayload = getVariantsForSave();
      } else {
        // Single variant (no options)
        variantsPayload = [{
          sku: singleSku || `${(form.name || "PRD").substring(0, 3).toUpperCase()}-001`,
          attribute1Value: "",
          attribute2Value: "",
          quantityOnHand: singleQty,
          lowStockThreshold: 3,
          isActive: true,
        }];
      }

      if (isNew) {
        await createProduct({
          ...form,
          basePrice: parseInt(String(form.basePrice).replace(/\D/g, "")) || 0,
          imageUrl: imageUrl || null,
          isActive: true,
          variants: variantsPayload,
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
        for (const v of variantsPayload) {
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
            } else if (v.attribute1Value || v.attribute2Value || !hasVariants) {
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
    <div className="content" style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/catalog")}>← Kembali</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{isNew ? "Tambah Produk Baru" : `Edit: ${product?.name || ""}`}</div>
          {!isNew && product ? <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>SKU {(product.variants || [])[0]?.sku || "-"}</div> : null}
        </div>
        <button className="btn btn-primary" style={{ minWidth: 140, height: 40 }} onClick={handleSave} disabled={submitting}>
          {saved ? "✓ Tersimpan!" : submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {saveError ? (
        <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>
          {saveError}
        </div>
      ) : null}

      {/* Image Upload — compact */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        {/* Thumbnail preview */}
        <div style={{
          width: 80, height: 80, borderRadius: 12, flexShrink: 0,
          background: "var(--surface)", border: "1px dashed var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {imagePreview ? (
            <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg width={24} height={24} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          )}
        </div>
        {/* Upload controls */}
        <div>
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
            {uploading ? "Mengupload..." : imagePreview ? "Ganti Foto" : "Upload Foto"}
            <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} disabled={uploading} />
          </label>
          {imagePreview && (
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, color: "var(--danger)" }}
              onClick={() => { setImageFile(null); setImagePreview(null); }}>Hapus</button>
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>JPG, PNG · Maks 5 MB</div>
        </div>
      </div>

      {/* Product Info Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>INFORMASI PRODUK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Nama */}
          <div>
            <label style={labelStyle}>Nama Produk *</label>
            <input className="input" placeholder="mis: T-Shirt Basic White" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ fontSize: 14, fontWeight: 600 }} />
          </div>

          {/* Harga + Kategori side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Harga Jual (Rp) *</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13.5, fontWeight: 600, color: "var(--text-soft)" }}>Rp</span>
                <input className="input" placeholder="85.000" value={form.basePrice ? Number(form.basePrice).toLocaleString("id-ID") : ""} onChange={(e) => setForm({ ...form, basePrice: e.target.value.replace(/\D/g, "") })} style={{ paddingLeft: 36, fontSize: 14, fontWeight: 700 }} />
              </div>
            </div>
            <div style={{ position: "relative" }} ref={catRef}>
              <label style={labelStyle}>Kategori</label>
              <div
                className="input"
                onClick={() => setCatOpen(!catOpen)}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 38 }}
              >
                <span style={{ color: form.category ? "var(--text)" : "var(--text-muted)", fontWeight: form.category ? 600 : 400 }}>
                  {form.category || "Pilih atau buat kategori"}
                </span>
                <svg width={14} height={14} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ flexShrink: 0, transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {/* Custom dropdown */}
              {catOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setCatOpen(false)} />
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                    marginTop: 4, background: "#fff", border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm, 8px)", boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.06))",
                    maxHeight: 240, overflowY: "auto",
                  }}>
                    {/* Search input inside dropdown */}
                    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                      <input
                        className="input"
                        placeholder="Cari atau ketik kategori baru..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{ fontSize: 13, padding: "6px 10px" }}
                      />
                    </div>

                    {/* Existing categories */}
                    {catList
                      .filter(c => !catSearch || c.toLowerCase().includes(catSearch.toLowerCase()))
                      .map(c => (
                        <div
                          key={c}
                          onClick={() => { setForm({ ...form, category: c }); setCatOpen(false); setCatSearch(""); }}
                          style={{
                            padding: "9px 12px", fontSize: 13, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 8,
                            background: form.category === c ? "var(--accent-soft)" : "transparent",
                            fontWeight: form.category === c ? 700 : 500,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = form.category === c ? "var(--accent-soft)" : "transparent"}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                          {c}
                        </div>
                      ))
                    }

                    {/* Create new category option — always visible when typing */}
                    {catSearch && !catList.some(c => c.toLowerCase() === catSearch.toLowerCase()) && (
                      <div
                        onClick={() => { setForm({ ...form, category: catSearch }); setCatOpen(false); setCatSearch(""); }}
                        style={{
                          padding: "9px 12px", fontSize: 13, cursor: "pointer",
                          borderTop: "1px solid var(--line)",
                          color: "var(--accent)", fontWeight: 600,
                          display: "flex", alignItems: "center", gap: 8,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-light)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>+</span>
                        Buat kategori "<strong>{catSearch}</strong>"
                      </div>
                    )}

                    {/* Empty state */}
                    {catList.length === 0 && !catSearch && (
                      <div style={{ padding: "14px 12px", fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                        Belum ada kategori.<br />Ketik di kolom pencarian untuk membuat baru.
                      </div>
                    )}

                    {/* No match */}
                    {catSearch && catList.filter(c => c.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && catList.length > 0 && (
                      <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-muted)" }}>
                        Tidak ditemukan kategori "{catSearch}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Deskripsi — smaller */}
          <div>
            <label style={labelStyle}>Deskripsi <span style={{ fontWeight: 400, textTransform: "none" }}>(opsional)</span></label>
            <textarea className="input" rows={2} placeholder="Deskripsi singkat produk..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>
      </div>

      {/* Varian Produk Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        {/* Toggle header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasVariants ? 20 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Varian Produk</div>
            <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
              {hasVariants ? "Produk ini memiliki beberapa varian" : "Produk tanpa varian (1 SKU)"}
            </div>
          </div>
          <button
            onClick={handleToggleVariants}
            style={{
              width: 44, height: 24, borderRadius: 12, border: "none",
              background: hasVariants ? "var(--accent)" : "var(--surface-2)",
              position: "relative", cursor: "pointer", transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: hasVariants ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
            }} />
          </button>
        </div>

        {/* Simple mode — no variants */}
        {!hasVariants && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>SKU</label>
              <input className="input" placeholder="TSH-001" value={singleSku}
                onChange={e => setSingleSku(e.target.value)} style={{ fontFamily: "monospace", fontSize: 13 }} />
            </div>
            <div>
              <label style={labelStyle}>Stok</label>
              <input className="input" type="number" min={0} value={singleQty}
                onChange={e => setSingleQty(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ fontWeight: 700, fontSize: 14 }} />
            </div>
          </div>
        )}

        {/* Variant mode */}
        {hasVariants && (
          <div>
            {/* Option 1 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tipe Varian 1</label>
                  <input className="input" placeholder="mis: Size, Berat, Rasa" value={option1Label}
                    onChange={e => setOption1Label(e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
              {option1Label && (
                <>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {option1Values.map(v => (
                      <span key={v} style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "5px 12px", background: "var(--accent-soft)", color: "var(--accent)",
                        borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                      }}>
                        {v}
                        <button onClick={() => setOption1Values(prev => prev.filter(x => x !== v))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 15, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input className="input" placeholder={`Tambah nilai ${option1Label}...`} value={newOpt1}
                      onChange={e => setNewOpt1(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption1(); } }}
                      style={{ flex: 1, fontSize: 13 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addOption1}>Tambah</button>
                  </div>
                </>
              )}
            </div>

            {/* Add Option 2 button / Option 2 */}
            {!showOption2 && option1Values.length > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}
                onClick={() => setShowOption2(true)}>
                + Tambah Tipe Varian 2 (opsional)
              </button>
            )}

            {showOption2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Tipe Varian 2 (opsional)</label>
                    <input className="input" placeholder="mis: Warna, Ukuran Cup" value={option2Label}
                      onChange={e => setOption2Label(e.target.value)} style={{ fontSize: 13 }} />
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", marginBottom: 1 }}
                    onClick={() => { setShowOption2(false); setOption2Label(""); setOption2Values([]); setNewOpt2(""); }}>
                    Hapus
                  </button>
                </div>
                {option2Label && (
                  <>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {option2Values.map(v => (
                        <span key={v} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "5px 12px", background: "#e8f0f8", color: "var(--blue)",
                          borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                        }}>
                          {v}
                          <button onClick={() => setOption2Values(prev => prev.filter(x => x !== v))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", fontSize: 15, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="input" placeholder={`Tambah nilai ${option2Label}...`} value={newOpt2}
                        onChange={e => setNewOpt2(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption2(); } }}
                        style={{ flex: 1, fontSize: 13 }} />
                      <button className="btn btn-secondary btn-sm" onClick={addOption2}>Tambah</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Generated Variants Table */}
            {Object.keys(variantData).length > 0 && (
              <>
                <div className="divider" />
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginBottom: 10 }}>
                  DAFTAR VARIAN ({Object.keys(variantData).length} kombinasi · {totalStock} unit)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(variantData).map(([key, data]) => {
                    const [a1, a2] = key.split("|");
                    return (
                      <div key={key} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", background: "var(--surface)", borderRadius: 8, fontSize: 13,
                      }}>
                        {a1 && <span style={{ padding: "2px 8px", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{a1}</span>}
                        {a2 && <span style={{ padding: "2px 8px", background: "#e8f0f8", color: "var(--blue)", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{a2}</span>}
                        <input className="input" value={data.sku} placeholder="SKU"
                          onChange={e => setVariantData(prev => ({ ...prev, [key]: { ...prev[key], sku: e.target.value } }))}
                          style={{ width: 100, fontSize: 11, padding: "4px 8px", fontFamily: "monospace" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                          <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                            onClick={() => setVariantData(prev => ({ ...prev, [key]: { ...prev[key], qty: Math.max(0, (prev[key]?.qty || 0) - 1) } }))}>−</div>
                          <input type="number" min={0} value={data.qty}
                            onChange={e => setVariantData(prev => ({ ...prev, [key]: { ...prev[key], qty: Math.max(0, parseInt(e.target.value) || 0) } }))}
                            style={{ width: 50, textAlign: "center", padding: "2px 4px", border: "1px solid var(--line)", borderRadius: 4, fontWeight: 700, fontSize: 12, fontFamily: "inherit" }} />
                          <div className="qty-btn" style={{ width: 22, height: 22, fontSize: 12 }}
                            onClick={() => setVariantData(prev => ({ ...prev, [key]: { ...prev[key], qty: (prev[key]?.qty || 0) + 1 } }))}>+</div>
                        </div>
                        <span className={`badge ${data.qty === 0 ? "badge-red" : data.qty <= 3 ? "badge-amber" : "badge-green"}`} style={{ fontSize: 10 }}>
                          {data.qty === 0 ? "Habis" : data.qty <= 3 ? "Hampir" : "OK"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>STATUS PRODUK</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tampilkan di Katalog</div>
              <div style={{ fontSize: 11, color: "var(--text-soft)" }}>Produk terlihat di halaman kasir</div>
            </div>
            <StatusToggle defaultOn />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tersedia di Bazar</div>
              <div style={{ fontSize: 11, color: "var(--text-soft)" }}>Bisa dialokasikan ke event</div>
            </div>
            <StatusToggle defaultOn />
          </div>
        </div>
      </div>

      {/* Danger Zone — Delete (edit mode only) */}
      {!isNew && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ color: "var(--danger)", width: "100%", justifyContent: "center", gap: 8 }} onClick={() => setDeleteConfirm(true)}>
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            Hapus Produk
          </button>
        </div>
      )}

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
function StatusToggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div onClick={() => setOn(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? "var(--accent)" : "var(--surface-2)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
    </div>
  );
}
