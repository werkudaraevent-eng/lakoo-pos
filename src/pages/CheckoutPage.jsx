import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { ProductSearchPanel } from "../features/checkout/components/ProductSearchPanel";
import { ProductGrid } from "../features/checkout/components/ProductGrid";
import { CartSummary } from "../features/checkout/components/CartSummary";
import { LatestReceipt } from "../features/checkout/components/LatestReceipt";
import "../features/checkout/checkout.css";

export function CheckoutPage() {
  const { user } = useAuth();
  const { variants, promotions, finalizeSale, loading, loadError } = usePosData();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [message, setMessage] = useState("");
  const [receiptSale, setReceiptSale] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const visibleProducts = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();

    if (!keyword) {
      return variants.filter((item) => item.productActive && item.isActive).slice(0, 8);
    }

    return variants.filter((item) => {
      const haystack = `${item.productName} ${item.sku} ${item.color} ${item.size}`.toLowerCase();
      return item.productActive && item.isActive && haystack.includes(keyword);
    });
  }, [deferredQuery, variants]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const matchedPromo = promotions.find((promo) => promo.code === promoCode.toUpperCase() && promo.isActive);
  const discount =
    matchedPromo == null
      ? 0
      : matchedPromo.type === "percentage"
        ? Math.round((subtotal * matchedPromo.value) / 100)
        : Math.min(subtotal, matchedPromo.value);
  const grandTotal = Math.max(0, subtotal - discount);

  function buildCartUpdate(current, variant) {
    const existing = current.find((item) => item.variantId === variant.id);

    if (existing) {
      if (existing.qty >= variant.quantityOnHand) {
        return { nextCart: current, atCapacity: true };
      }

      return {
        nextCart: current.map((item) =>
          item.variantId === variant.id ? { ...item, qty: item.qty + 1 } : item
        ),
        atCapacity: false,
      };
    }

    return {
      nextCart: [
        ...current,
        {
          variantId: variant.id,
          productName: variant.productName,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          qty: 1,
        },
      ],
      atCapacity: false,
    };
  }

  function addToCart(variant) {
    setMessage("");

    const preview = buildCartUpdate(cart, variant);
    if (preview.atCapacity) {
      setMessage("Jumlah di cart sudah mencapai stock tersedia.");
      return;
    }

    startTransition(() => {
      setCart((current) => buildCartUpdate(current, variant).nextCart);
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

  async function handleCheckout() {
    if (cart.length === 0) {
      setMessage("Tambahkan item ke cart sebelum finalisasi.");
      return;
    }

    setSubmitting(true);
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

    setSubmitting(false);
  }

  return (
    <div className="checkout-page">
      <section className="checkout-hero">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Fast variant-based transaction flow.</h1>
          <p className="muted-text">
            Cari produk atau SKU, tambah ke cart, validasi promo, lalu finalisasi pembayaran cash atau card.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading catalog and promotions...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="checkout-layout">
        <ProductSearchPanel query={query} onQueryChange={setQuery}>
          <ProductGrid variants={visibleProducts} onAdd={addToCart} />
        </ProductSearchPanel>

        <CartSummary
          cart={cart}
          promoCode={promoCode}
          paymentMethod={paymentMethod}
          subtotal={subtotal}
          discount={discount}
          grandTotal={grandTotal}
          message={message}
          submitting={submitting}
          finalizeDisabled={submitting || cart.length === 0}
          onPromoChange={setPromoCode}
          onPaymentMethodChange={setPaymentMethod}
          onUpdateQty={updateQty}
          onFinalize={handleCheckout}
        />
      </section>

      <LatestReceipt sale={receiptSale} />
    </div>
  );
}
