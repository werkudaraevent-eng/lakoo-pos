import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { LatestReceipt } from "../features/checkout/components/LatestReceipt";
import { buildCheckoutCategories, filterCheckoutVariants } from "../features/checkout/checkoutData";
import {
  CHECKOUT_CART_COUNT_STORAGE_KEY,
  canFinalizeSale,
  createFinalizeSaleLock,
  evaluateCartAddition,
} from "../features/checkout/checkoutGuards";
import { AppIcon } from "../features/ui/AppIcon";
import { getCheckoutActionIconName } from "../features/ui/iconMaps";
import { formatCurrency } from "../utils/formatters";
import "../features/checkout/checkout.css";

function getStockLabel(variant) {
  if (variant.quantityOnHand <= 0) {
    return "Out of stock";
  }

  return `${variant.quantityOnHand} in stock`;
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { variants, promotions, finalizeSale, loading, loadError } = usePosData();
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
    () =>
      filterCheckoutVariants({
        variants: browseableVariants,
        category: selectedCategory,
        query: deferredQuery,
      }),
    [browseableVariants, selectedCategory, deferredQuery]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const matchedPromo = promotions.find((promo) => promo.code === promoCode.toUpperCase() && promo.isActive);
  const discount =
    matchedPromo == null
      ? 0
      : matchedPromo.type === "percentage"
        ? Math.round((subtotal * matchedPromo.value) / 100)
        : Math.min(subtotal, matchedPromo.value);
  const tax = 0;
  const grandTotal = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(CHECKOUT_CART_COUNT_STORAGE_KEY, String(cartCount));
  }, [cartCount]);

  useEffect(
    () => () => {
      if (typeof window === "undefined") {
        return;
      }

      window.sessionStorage.removeItem(CHECKOUT_CART_COUNT_STORAGE_KEY);
    },
    []
  );

  function addToCart(variant) {
    setMessage("");

    const preview = evaluateCartAddition(cart, variant);
    if (preview.blocked) {
      setMessage(
        preview.reason === "out-of-stock"
          ? "Variant ini sedang habis stock."
          : "Jumlah di cart sudah mencapai stock tersedia."
      );
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
    if (!variant || nextQty > variant.quantityOnHand) {
      return;
    }

    setCart((current) =>
      current.map((item) => (item.variantId === variantId ? { ...item, qty: nextQty } : item))
    );
  }

  function clearCart() {
    setCart([]);
    setPromoCode("");
    setMessage("");
  }

  async function handleCheckout() {
    const status = canFinalizeSale({
      cartLength: cart.length,
    });

    if (!status.allowed) {
      if (status.reason === "empty-cart") {
        setMessage("Tambahkan item ke cart sebelum finalisasi.");
      }
      return;
    }

    const finalizeLock = finalizeLockRef.current;
    if (!finalizeLock.tryBegin()) {
      setMessage("Finalisasi sedang diproses.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await finalizeSale({
        cart,
        promoCode,
        paymentMethod,
        actor: user,
      });

      setMessage(result.message || (result.ok ? "Transaksi berhasil disimpan." : ""));

      if (result.ok) {
        setReceiptSale(result.sale);
        setCart([]);
        setPromoCode("");
        setPaymentMethod("cash");
      }
    } finally {
      finalizeLock.release();
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-banani-page">
      <div className="checkout-container">
        <section className="catalog-section">
          <div className="catalog-header">
            <h1 className="page-title">Checkout</h1>

            <div className="catalog-toolbar">
              <div className="search-box">
                <span className="search-icon" aria-hidden="true">
                  <AppIcon name={getCheckoutActionIconName("search")} size={16} strokeWidth={1.9} />
                </span>
                <input
                  className="search-input"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, SKU or barcode"
                  value={query}
                />
              </div>

              <div className="category-tabs">
                {categories.map((category) => (
                  <button
                    className={`category-pill${selectedCategory === category ? " active" : ""}`}
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? <p className="info-text">Loading catalog and promotions...</p> : null}
          {loadError ? <p className="error-text">{loadError}</p> : null}

          <div className="product-grid">
            {visibleProducts.length > 0 ? (
              visibleProducts.map((variant) => (
                <button
                  className={`product-card${variant.quantityOnHand <= 0 ? " is-unavailable" : ""}`}
                  disabled={variant.quantityOnHand <= 0}
                  key={variant.id}
                  onClick={() => addToCart(variant)}
                  type="button"
                >
                  <div className="product-image">
                    <span className="product-image-mark">{variant.productName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="product-info">
                    <span className="product-name">{variant.productName}</span>
                    <span className="product-price">{formatCurrency(variant.price)}</span>
                    <span className="product-stock">{getStockLabel(variant)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="checkout-empty-state">
                <strong>No matching items</strong>
                <span>Try another keyword or switch category.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="cart-section">
          <div className="cart-header">
            <span className="cart-title">Current Order</span>
            <div className="cart-actions">
              <button className="btn-icon-sm" title="Add note" type="button">
                <AppIcon name={getCheckoutActionIconName("note")} size={14} strokeWidth={1.9} />
              </button>
              <button className="btn-icon-sm" title="Add customer" type="button">
                <AppIcon name={getCheckoutActionIconName("customer")} size={14} strokeWidth={1.9} />
              </button>
              <button className="btn-icon-sm is-danger" onClick={clearCart} title="Clear cart" type="button">
                <AppIcon name={getCheckoutActionIconName("clear")} size={14} strokeWidth={1.9} />
              </button>
            </div>
          </div>

          <div className="cart-customer">
            <span className="cart-customer-icon" aria-hidden="true">
              <AppIcon name={getCheckoutActionIconName("walkIn")} size={16} strokeWidth={1.9} />
            </span>
            <span className="customer-name">Walk-in Customer</span>
            <button className="btn-text" type="button">
              Edit
            </button>
          </div>

          <div className="cart-items">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div className="cart-item" key={item.variantId}>
                  <div className="cart-item-img">
                    <span>{item.productName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.productName}</span>
                    <span className="cart-item-price">{formatCurrency(item.price)}</span>
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => updateQty(item.variantId, item.qty - 1)} type="button">
                        <AppIcon name={getCheckoutActionIconName("minus")} size={12} strokeWidth={2.2} />
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.variantId, item.qty + 1)} type="button">
                        <AppIcon name={getCheckoutActionIconName("plus")} size={12} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">{formatCurrency(item.price * item.qty)}</div>
                </div>
              ))
            ) : (
              <div className="cart-empty-state">No items in cart yet.</div>
            )}
          </div>

          <div className="cart-summary">
            <label className="checkout-field">
              <span>Promo code</span>
              <input onChange={(event) => setPromoCode(event.target.value.toUpperCase())} value={promoCode} />
            </label>

            <div className="checkout-payment-group">
              <span className="checkout-field-label">Payment method</span>
              <div className="payment-toggle">
                {["cash", "card"].map((method) => (
                  <button
                    className={`payment-chip${paymentMethod === method ? " active" : ""}`}
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    type="button"
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span>{discount > 0 ? `- ${formatCurrency(discount)}` : "-"}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            {message ? <p className="checkout-message">{message}</p> : null}

            <button className="btn-charge" disabled={submitting || cart.length === 0} onClick={handleCheckout} type="button">
              <span className="charge-label">
                <AppIcon name={getCheckoutActionIconName("charge")} size={18} strokeWidth={1.9} />
                <span>{submitting ? "Saving..." : "Charge"}</span>
              </span>
              <span>{formatCurrency(grandTotal)}</span>
            </button>
          </div>
        </aside>
      </div>

      <LatestReceipt sale={receiptSale} />
    </div>
  );
}
