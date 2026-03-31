import { formatCurrency } from "../../../utils/formatters";

export function CartSummary({
  cart,
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
    <aside className="checkout-summary-card">
      <div className="checkout-panel-head">
        <h2>Cart summary</h2>
        <span className="badge-soft">{cart.length} items</span>
      </div>

      <div className="checkout-stack-list">
        {cart.length === 0 ? <p className="muted-text">Belum ada item di cart.</p> : null}
        {cart.map((item) => (
          <div className="checkout-cart-item" key={item.variantId}>
            <div>
              <strong>{item.productName}</strong>
              <p className="muted-text">
                {item.size} / {item.color} - {item.sku}
              </p>
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
            <strong>{formatCurrency(item.price * item.qty)}</strong>
          </div>
        ))}
      </div>

      <label className="field">
        <span>Promo code</span>
        <input value={promoCode} onChange={(event) => onPromoChange(event.target.value.toUpperCase())} />
      </label>

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

      {message ? <p className="info-text">{message}</p> : null}

      <button className="primary-button" disabled={finalizeDisabled} onClick={onFinalize} type="button">
        {submitting ? "Saving..." : "Finalize sale"}
      </button>
    </aside>
  );
}
