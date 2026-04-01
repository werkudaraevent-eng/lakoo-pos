import { formatCurrency } from "../../../utils/formatters";

export function CartSummary({
  cart,
  cartCount,
  promoCode,
  paymentMethod,
  subtotal,
  discount,
  grandTotal,
  message,
  submitting,
  finalizeDisabled,
  onPromoChange,
  onPaymentMethodChange,
  onUpdateQty,
  onFinalize,
}) {
  return (
    <aside className="checkout-summary-card checkout-summary-sticky">
      <div className="checkout-panel-head">
        <div>
          <p className="eyebrow">Cart</p>
          <h2>Ready to finalize</h2>
        </div>
        <span className="badge-soft">{cartCount} items</span>
      </div>

      <div className="checkout-stack-list">
        {cart.length === 0 ? <p className="stack-empty">No items in cart yet.</p> : null}
        {cart.map((item) => (
          <div className="checkout-cart-item" key={item.variantId}>
            <div className="checkout-cart-item-head">
              <div>
                <strong>{item.productName}</strong>
                <p className="muted-text">
                  {item.size} / {item.color} - {item.sku}
                </p>
              </div>
              <strong>{formatCurrency(item.price * item.qty)}</strong>
            </div>
            <div className="checkout-qty-control">
              <button type="button" onClick={() => onUpdateQty(item.variantId, item.qty - 1)}>
                -
              </button>
              <span>{item.qty}</span>
              <button type="button" onClick={() => onUpdateQty(item.variantId, item.qty + 1)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="checkout-summary-controls">
        <label className="field">
          <span>Promo code</span>
          <input value={promoCode} onChange={(event) => onPromoChange(event.target.value.toUpperCase())} />
        </label>

        <div className="checkout-payment-block">
          <span className="checkout-block-label">Payment method</span>
          <div className="checkout-payment-toggle">
            {["cash", "card"].map((method) => (
              <button
                className={`checkout-toggle-chip${paymentMethod === method ? " is-selected" : ""}`}
                key={method}
                onClick={() => onPaymentMethodChange(method)}
                type="button"
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="checkout-summary-box">
        <div className="checkout-summary-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="checkout-summary-row">
          <span>Discount</span>
          <strong>{formatCurrency(discount)}</strong>
        </div>
        <div className="checkout-summary-row total">
          <span>Grand total</span>
          <strong>{formatCurrency(grandTotal)}</strong>
        </div>
      </div>

      <div className="checkout-total-block">
        <span className="muted-text">Grand total</span>
        <strong>{formatCurrency(grandTotal)}</strong>
      </div>

      {message ? <p className="info-text">{message}</p> : null}

      <button
        className="primary-button checkout-finalize-button"
        disabled={finalizeDisabled}
        onClick={onFinalize}
        type="button"
      >
        {submitting ? "Saving..." : "Finalize sale"}
      </button>
    </aside>
  );
}
