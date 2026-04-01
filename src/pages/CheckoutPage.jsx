import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { ProductSearchPanel } from "../features/checkout/components/ProductSearchPanel";
import { ProductGrid } from "../features/checkout/components/ProductGrid";
import { CartSummary } from "../features/checkout/components/CartSummary";
import { LatestReceipt } from "../features/checkout/components/LatestReceipt";
import {
  CHECKOUT_CART_COUNT_STORAGE_KEY,
  canFinalizeSale,
  createFinalizeSaleLock,
  evaluateCartAddition,
} from "../features/checkout/checkoutGuards";
import { shouldConfirmWorkspaceSwitch } from "../features/workspaces/workspaceGuards";
import "../features/checkout/checkout.css";

function formatWorkspaceType(type) {
  if (type === "event") {
    return "Event";
  }

  if (type === "store") {
    return "Store";
  }

  return "Workspace";
}

function formatStatus(status) {
  if (!status) {
    return "";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatStockMode(stockMode) {
  if (stockMode === "allocate") {
    return "Allocated stock";
  }

  if (stockMode === "manual") {
    return "Manual stock";
  }

  return "";
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { variants, promotions, finalizeSale, loading, loadError, workspaces } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const [query, setQuery] = useState("");
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

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const workspaceStatus = formatStatus(activeWorkspace?.eventStatus ?? activeWorkspace?.status);
  const stockModeLabel = formatStockMode(activeWorkspace?.stockMode);
  const browseableVariants = useMemo(
    () => variants.filter((item) => item.productActive && item.isActive),
    [variants]
  );
  const visibleProducts = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();

    if (!keyword) {
      return browseableVariants.slice(0, 12);
    }

    return browseableVariants.filter((item) => {
      const haystack = `${item.productName} ${item.sku} ${item.color} ${item.size}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [browseableVariants, deferredQuery]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const matchedPromo = promotions.find((promo) => promo.code === promoCode.toUpperCase() && promo.isActive);
  const discount =
    matchedPromo == null
      ? 0
      : matchedPromo.type === "percentage"
        ? Math.round((subtotal * matchedPromo.value) / 100)
        : Math.min(subtotal, matchedPromo.value);
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

  function handleWorkspaceSwitch() {
    const requiresConfirm = shouldConfirmWorkspaceSwitch({
      currentPath: "/checkout",
      cartCount,
    });

    if (
      requiresConfirm &&
      typeof window !== "undefined" &&
      !window.confirm("The current checkout cart still has items. Switch workspace anyway?")
    ) {
      return;
    }

    navigate("/workspace/select", {
      state: { from: "/checkout" },
    });
  }

  return (
    <div className="checkout-page">
      <section className="checkout-context-strip">
        <div className="checkout-context-copy">
          <p className="eyebrow">Checkout</p>
          <h1>{activeWorkspace?.name || "Workspace checkout"}</h1>
          <p className="muted-text">
            Search products fast, keep the cart in view, and finalize each sale without leaving the workspace flow.
          </p>
        </div>
        <div className="checkout-context-actions">
          <div className="checkout-context-meta">
            {activeWorkspace?.type ? (
              <span className="badge-soft">{formatWorkspaceType(activeWorkspace.type)}</span>
            ) : null}
            {workspaceStatus ? <span className="badge-soft">{workspaceStatus}</span> : null}
            {stockModeLabel ? <span className="badge-soft">{stockModeLabel}</span> : null}
          </div>
          <button className="secondary-button small-button" onClick={handleWorkspaceSwitch} type="button">
            Switch workspace
          </button>
        </div>
      </section>

      {loading ? <p className="info-text">Loading catalog and promotions...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="checkout-layout">
        <ProductSearchPanel
          query={query}
          resultCount={visibleProducts.length}
          totalCount={browseableVariants.length}
          onQueryChange={setQuery}
        >
          <ProductGrid variants={visibleProducts} onAdd={addToCart} />
        </ProductSearchPanel>

        <CartSummary
          cart={cart}
          cartCount={cartCount}
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
