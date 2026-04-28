import { useDeferredValue, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import { ConfirmModal } from "../components/ConfirmModal";
import "../features/checkout/checkout.css";
import "../features/dashboard/dashboard.css";

export function CheckoutPage() {
  const { user } = useAuth();
  const { variants, settings, finalizeSale, loading, loadError } = usePosData();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [cart, setCart] = useState([]);
  const [modal, setModal] = useState(null); // selected product for size picker
  const [selVariant, setSelVariant] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [alertModal, setAlertModal] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const attr1Label = settings?.attribute1Label || "Size";
  const attr2Label = settings?.attribute2Label || "Warna";

  // Get enabled methods from settings (supports both old string[] and new object[] format)
  const enabledMethods = useMemo(() => {
    const methods = settings?.paymentMethods;
    if (!Array.isArray(methods) || methods.length === 0) {
      return [
        { id: "cash", label: "Cash", desc: "Uang tunai" },
        { id: "qris", label: "QRIS", desc: "Scan QR Code" },
      ];
    }
    // Old format: string array
    if (typeof methods[0] === "string") {
      return methods.map(id => ({ id, label: id.toUpperCase(), desc: "" }));
    }
    // New format: object array — only show enabled
    return methods.filter(m => m.enabled);
  }, [settings?.paymentMethods]);

  // Group variants by product
  const productMap = useMemo(() => {
    const map = new Map();
    (variants || []).forEach((v) => {
      if (!v.productActive || !v.isActive) return;
      if (!map.has(v.productId)) {
        map.set(v.productId, {
          id: v.productId,
          name: v.productName,
          category: v.category,
          price: v.basePrice,
          variants: [],
        });
      }
      map.get(v.productId).variants.push(v);
    });
    return map;
  }, [variants]);

  const products = useMemo(() => [...productMap.values()], [productMap]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    return ["Semua", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return products.filter((p) => {
      const matchCat = cat === "Semua" || p.category === cat;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.variants.some((v) => (v.sku || "").toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, cat, deferredSearch]);

  function getTotalStock(product) {
    return product.variants.reduce((sum, v) => sum + (v.quantityOnHand || 0), 0);
  }

  // Cart logic
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxRate = settings?.taxRate || 0;
  const tax = taxRate > 0 ? Math.round((subtotal * taxRate) / 100) : 0;
  const total = subtotal + tax;
  const cartItemCount = cart.reduce((s, i) => s + i.qty, 0);

  const paidAmount = total;

  function openProduct(product) {
    if (getTotalStock(product) === 0) return;
    setModal(product);
    // Auto-select first available variant
    const first = product.variants.find((v) => (v.quantityOnHand || 0) > 0);
    setSelVariant(first || null);
  }

  function addToCart() {
    if (!selVariant) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === selVariant.id);
      if (existing) {
        return prev.map((i) => i.variantId === selVariant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        variantId: selVariant.id,
        productName: modal.name,
        sku: selVariant.sku,
        attribute1Value: selVariant.attribute1Value || "",
        attribute2Value: selVariant.attribute2Value || "",
        price: selVariant.priceOverride ?? selVariant.price ?? modal.price,
        qty: 1,
      }];
    });
    setModal(null);
    setSelVariant(null);
  }

  function changeQty(variantId, delta) {
    setCart((prev) => prev.map((i) => i.variantId === variantId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));
  }

  async function handlePay() {
    setSubmitting(true);
    try {
      const result = await finalizeSale({
        cart,
        promoCode: "",
        paymentMethod: payMethod,
        paidAmount,
        actor: user,
      });
      if (result.ok) {
        setLastSale(result.sale);
        setPaid(true);
      } else {
        setAlertModal({ title: "Pembayaran Gagal", message: result.message || "Terjadi kesalahan saat memproses pembayaran." });
      }
    } catch (err) {
      setAlertModal({ title: "Pembayaran Gagal", message: err.message || "Terjadi kesalahan." });
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewTrx() {
    setCart([]);
    setPayModal(false);
    setPaid(false);
    setPayMethod(enabledMethods[0]?.id || "cash");
    setLastSale(null);
  }

  return (
    <div className="pos-layout">
      {/* ── Catalog ── */}
      <div className="pos-catalog">
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div className="input-wrap" style={{ flex: 1 }}>
            <span className="input-icon">
              <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
            <input className="input has-icon" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="cat-filter">
          {categories.map((c) => (
            <div key={c} className={`cat-chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</div>
          ))}
        </div>

        {loading ? <div className="text-sm text-muted" style={{ padding: 16 }}>Memuat katalog...</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {filtered.map((p) => {
            const stock = getTotalStock(p);
            return (
              <div key={p.id} className={`product-card${stock === 0 ? " out-of-stock" : ""}`} onClick={() => openProduct(p)}>
                <div className="product-thumb">
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-muted)" }}>{p.name.charAt(0)}</span>
                </div>
                <div className="product-name">{p.name}</div>
                <div className="product-price">{formatCurrency(p.price)}</div>
                <div className="product-stock">{stock > 0 ? `Stok: ${stock}` : "Habis"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cart ── */}
      <div className="pos-cart">
        <div className="pos-cart-header">
          <div className="row-between">
            <span style={{ fontWeight: 800, fontSize: 15 }}>Keranjang</span>
            {cart.length > 0 ? (
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setCart([])}>Kosongkan</button>
            ) : null}
          </div>
          <div className="text-sm text-muted mt-4">{cartItemCount} item</div>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 16px" }}>
              <svg width={32} height={32} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              <div style={{ marginTop: 10, fontSize: 13 }}>Pilih produk untuk ditambah</div>
            </div>
          ) : cart.map((item) => (
            <div key={item.variantId} className="cart-item">
              <div style={{ flex: 1 }}>
                <div className="cart-item-name">{item.productName}</div>
                <div className="cart-item-size">
                  {item.attribute1Value && <span>{attr1Label}: {item.attribute1Value}</span>}
                  {item.attribute2Value && <span> · {attr2Label}: {item.attribute2Value}</span>}
                  {!item.attribute1Value && !item.attribute2Value && <span>-</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div className="qty-ctrl">
                  <div className="qty-btn" onClick={() => changeQty(item.variantId, -1)}>−</div>
                  <span className="qty-val">{item.qty}</span>
                  <div className="qty-btn" onClick={() => changeQty(item.variantId, 1)}>+</div>
                </div>
                <div className="cart-item-price">{formatCurrency(item.price * item.qty)}</div>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 ? (
          <div className="pos-cart-footer">
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              <div className="row-between text-sm"><span className="text-muted">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {taxRate > 0 ? (
                <div className="row-between text-sm"><span className="text-muted">Pajak ({taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
              ) : null}
              <div className="divider" style={{ margin: "4px 0" }} />
              <div className="row-between">
                <span style={{ fontWeight: 800, fontSize: 15 }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 17, color: "var(--accent)" }}>{formatCurrency(total)}</span>
              </div>
            </div>
            <button className="btn btn-primary w-full" style={{ height: 44, fontSize: 14 }} onClick={() => setPayModal(true)}>
              Proses Pembayaran
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Size Picker Modal ── */}
      {modal ? (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{modal.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", marginBottom: 16 }}>{formatCurrency(modal.price)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>PILIH {(attr1Label || "UKURAN").toUpperCase()}</div>
            <div className="size-grid">
              {modal.variants.map((v) => {
                const stock = v.quantityOnHand || 0;
                const label = v.attribute1Value || v.sku;
                const isSelected = selVariant?.id === v.id;
                return (
                  <div
                    key={v.id}
                    className={`size-chip${isSelected ? " selected" : ""}${stock === 0 ? " unavail" : ""}`}
                    onClick={() => stock > 0 && setSelVariant(v)}
                  >
                    {label}<br /><span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{stock} stok</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={addToCart} disabled={!selVariant}>+ Tambah ke Keranjang</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Payment Modal ── */}
      {payModal && !paid ? (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 440 }}>
            <div className="modal-title">Pembayaran</div>
            <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 4 }}>Total yang harus dibayar</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", marginBottom: 20 }}>{formatCurrency(total)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-soft)", marginBottom: 10 }}>METODE PEMBAYARAN</div>
            {enabledMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => setPayMethod(m.id)}
                style={{
                  padding: "12px 14px",
                  border: `1.5px solid ${payMethod === m.id ? "var(--accent)" : "var(--line)"}`,
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: "pointer",
                  background: payMethod === m.id ? "var(--accent-light)" : "#fff",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{m.desc}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPayModal(false)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 44 }} onClick={handlePay} disabled={submitting}>
                {submitting ? "Memproses..." : "Konfirmasi Bayar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Success Modal ── */}
      {paid ? (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--success-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width={28} height={28} fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Pembayaran Berhasil!</div>
            <div style={{ fontSize: 14, color: "var(--text-soft)", marginBottom: 4 }}>Total dibayar</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", marginBottom: 20 }}>{formatCurrency(total)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                {" "}Cetak Struk
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleNewTrx}>Transaksi Baru</button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={!!alertModal}
        icon="danger"
        title={alertModal?.title}
        message={alertModal?.message}
        confirmLabel="OK"
        confirmVariant="primary"
        onConfirm={() => setAlertModal(null)}
      />
    </div>
  );
}
