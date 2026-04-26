import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { LatestReceipt } from "../features/checkout/components/LatestReceipt";
import {
  buildCheckoutCategories,
  filterCheckoutVariants,
  formatCheckoutVariantMeta,
  getCheckoutStockState,
} from "../features/checkout/checkoutData";
import {
  CHECKOUT_CART_COUNT_STORAGE_KEY,
  canFinalizeSale,
  createFinalizeSaleLock,
  evaluateCartAddition,
} from "../features/checkout/checkoutGuards";
import { formatCurrency } from "../utils/formatters";
import "../features/checkout/checkout.css";

function getMonogram(name) {
  const tokens = String(name || "").split(/\s+/).filter(Boolean).slice(0, 2);
  return tokens.length === 0 ? "P" : tokens.map((t) => t.charAt(0).toUpperCase()).join("");
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { variants, promotions, settings, finalizeSale, loading, loadError } = usePosData();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [cart, setCart] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [message, setMessage] = useState("");
  const [receiptSale, setReceiptSale] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const finalizeLockRef = useRef(null);
  const deferredQuery = useDeferredValue(query);

  if (finalizeLockRef.current === null) {
    finalizeLockRef.current = createFinalizeSaleLock();
  }

  const browseableVariants = useMemo(
    () => variants.filter((item) => item.productActive && item.isActive),
    [variants]
  );
  const categories = useMemo(() => buildCheckoutCategories(browseableVariants), [browseableVariants]);
  const visibleProducts = useMemo(
    () => filterCheckoutVariants({ variants: browseableVariants, category: selectedCategory, query: deferredQuery }),
    [browseableVariants, selectedCategory, deferredQuery]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const matchedPromo = promotions.find((p) => p.code === promoCode.toUpperCase() && p.isActive);
  const discount = matchedPromo == null ? 0
    : matchedPromo.type === "percentage" ? Math.round((subtotal * matchedPromo.value) / 100)
    : Math.min(subtotal, matchedPromo.value);
  const taxRate = settings?.taxRate ?? 0;
  const afterDiscount = subtotal - discount;
  const tax = taxRate > 0 ? Math.round((afterDiscount * taxRate) / 100) : 0;
  const grandTotal = Math.max(0, afterDiscount + tax);

  useEffect(() => {
    window.sessionStorage?.setItem(CHECKOUT_CART_COUNT_STORAGE_KEY, String(cartCount));
  }, [cartCount]);

  useEffect(() => () => {
    window.sessionStorage?.removeItem(CHECKOUT_CART_COUNT_STORAGE_KEY);
  }, []);

  function addToCart(variant) {
    setMessage("");
    const preview = evaluateCartAddition(cart, variant);
    if (preview.blocked) {
      setMessage(preview.reason === "out-of-stock" ? "Stok habis." : "Sudah mencapai batas stok.");
      return;
    }
    startTransition(() => {
      setCart((current) => {
        const result = evaluateCartAddition(current, variant);
        return result.blocked ? current : result.nextCart;
      });
    });
  }

  function updateQty(variantId, nextQty) {
    if (nextQty <= 0) {
      setCart((current) => current.filter((item) => item.variantId !== variantId));
      return;
    }
    const variant = variants.find((item) => item.id === variantId);
    if (!variant || nextQty > variant.quantityOnHand) return;
    setCart((current) => current.map((item) => (item.variantId === variantId ? { ...item, qty: nextQty } : item)));
  }

  function clearCart() {
    setCart([]);
    setPromoCode("");
    setMessage("");
  }

  async function handleCheckout() {
    const status = canFinalizeSale({ cartLength: cart.length });
    if (!status.allowed) {
      if (status.reason === "empty-cart") setMessage("Tambahkan item ke cart.");
      return;
    }
    const lock = finalizeLockRef.current;
    if (!lock.tryBegin()) { setMessage("Sedang diproses."); return; }
    setSubmitting(true);
    try {
      const result = await finalizeSale({ cart, promoCode, paymentMethod, actor: user });
      setMessage(result.message || (result.ok ? "Transaksi berhasil!" : ""));
      if (result.ok) {
        setReceiptSale(result.sale);
        setCart([]);
        setPromoCode("");
        setPaymentMethod("cash");
      }
    } finally {
      lock.release();
      setSubmitting(false);
    }
  }

  const paymentMethods = [
    { key: "cash", label: "Cash", icon: "💵" },
    { key: "card", label: "Card", icon: "💳" },
    { key: "qris", label: "QRIS", icon: "📱" },
    { key: "transfer", label: "Transfer", icon: "🏦" },
    { key: "ewallet", label: "E-Wallet", icon: "📲" },
  ];

  return (
    <div className="pos-terminal">
      {/* ── Left: Product catalog ── */}
      <div className="pos-catalog">
        {/* Search + category bar */}
        <div className="pos-catalog-header">
          <div className="pos-search-row">
            <div className="pos-search">
              <svg className="pos-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                className="pos-search-input"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk, SKU, atau barcode..."
                value={query}
              />
              {query ? (
                <button className="pos-search-clear" onClick={() => setQuery("")} type="button">✕</button>
              ) : null}
            </div>
            <div className="pos-result-count">
              <strong>{visibleProducts.length}</strong> item
            </div>
          </div>

          <div className="pos-categories">
            {categories.map((cat) => (
              <button
                className={`pos-cat-pill${selectedCategory === cat ? " active" : ""}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="pos-loading">Memuat katalog...</div> : null}
        {loadError ? <div className="pos-error">{loadError}</div> : null}

        {/* Product grid */}
        <div className="pos-grid">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((variant) => {
              const stock = getCheckoutStockState(variant.quantityOnHand);
              const inCart = cart.find((c) => c.variantId === variant.id);
              return (
                <button
                  className={`pos-product${variant.quantityOnHand <= 0 ? " out" : ""}${inCart ? " in-cart" : ""}`}
                  disabled={variant.quantityOnHand <= 0}
                  key={variant.id}
                  onClick={() => addToCart(variant)}
                  type="button"
                >
                  <div className="pos-product-mono">{getMonogram(variant.productName)}</div>
                  <div className="pos-product-info">
                    <span className="pos-product-name">{variant.productName}</span>
                    <span className="pos-product-meta">{formatCheckoutVariantMeta(variant)}</span>
                  </div>
                  <div className="pos-product-bottom">
                    <span className="pos-product-price">{formatCurrency(variant.price)}</span>
                    <span className={`pos-product-stock ${stock.tone}`}>{stock.label}</span>
                  </div>
                  {inCart ? (
                    <div className="pos-product-cart-badge">{inCart.qty}</div>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="pos-empty">
              <p>Tidak ada produk ditemukan</p>
              <span>Coba kata kunci lain atau ganti kategori.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart panel ── */}
      <div className="pos-cart">
        <div className="pos-cart-header">
          <div>
            <h2 className="pos-cart-title">Pesanan</h2>
            <span className="pos-cart-count">{cartCount} item</span>
          </div>
          {cart.length > 0 ? (
            <button className="pos-cart-clear" onClick={clearCart} type="button">
              Hapus Semua
            </button>
          ) : null}
        </div>

        {/* Cart items */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <span className="pos-cart-empty-icon">🛒</span>
              <p>Belum ada item</p>
              <span>Tap produk untuk menambahkan</span>
            </div>
          ) : (
            cart.map((item) => (
              <div className="pos-cart-item" key={item.variantId}>
                <div className="pos-cart-item-mono">{getMonogram(item.productName)}</div>
                <div className="pos-cart-item-info">
                  <span className="pos-cart-item-name">{item.productName}</span>
                  <span className="pos-cart-item-meta">
                    {item.attribute1Value} / {item.attribute2Value} · {formatCurrency(item.price)}
                  </span>
                </div>
                <div className="pos-cart-item-qty">
                  <button className="pos-qty-btn" onClick={() => updateQty(item.variantId, item.qty - 1)} type="button">−</button>
                  <span className="pos-qty-val">{item.qty}</span>
                  <button className="pos-qty-btn" onClick={() => updateQty(item.variantId, item.qty + 1)} type="button">+</button>
                </div>
                <span className="pos-cart-item-total">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))
          )}
        </div>

        {/* Summary + payment */}
        <div className="pos-cart-footer">
          {/* Promo */}
          <div className="pos-promo-row">
            <input
              className="pos-promo-input"
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Kode promo"
              value={promoCode}
            />
          </div>

          {/* Payment methods */}
          <div className="pos-payment-row">
            {paymentMethods.map((m) => (
              <button
                className={`pos-pay-btn${paymentMethod === m.key ? " active" : ""}`}
                key={m.key}
                onClick={() => setPaymentMethod(m.key)}
                type="button"
              >
                <span className="pos-pay-icon">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Totals */}
          <div className="pos-totals">
            <div className="pos-total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="pos-total-row discount">
                <span>Diskon</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            ) : null}
            {tax > 0 ? (
              <div className="pos-total-row">
                <span>Pajak ({taxRate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            ) : null}
            <div className="pos-total-row grand">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {message ? <p className="pos-message">{message}</p> : null}

          {/* Charge button */}
          <button
            className="pos-charge-btn"
            disabled={submitting || cart.length === 0}
            onClick={handleCheckout}
            type="button"
          >
            <span>{submitting ? "Memproses..." : "Bayar"}</span>
            <span className="pos-charge-amount">{formatCurrency(grandTotal)}</span>
          </button>
        </div>
      </div>

      <LatestReceipt sale={receiptSale} />
    </div>
  );
}
