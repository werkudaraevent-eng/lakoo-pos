import { Link } from "react-router-dom";

import { formatCurrency } from "../../../utils/formatters";

export function LatestReceipt({ sale }) {
  const items = Array.isArray(sale?.items) ? sale.items : [];

  if (!sale) {
    return null;
  }

  return (
    <section className="checkout-receipt-card checkout-receipt-compact">
      <div className="checkout-panel-head">
        <div>
          <p className="eyebrow">Saved</p>
          <h2>Latest receipt</h2>
        </div>
        <div className="checkout-inline-actions">
          <span className="pill-strong">{sale.receiptNumber}</span>
          <Link className="secondary-button small-button checkout-receipt-link-button" to={`/sales/${sale.id}/receipt`}>
            Print view
          </Link>
        </div>
      </div>

      <div className="checkout-receipt-summary">
        <div className="checkout-summary-row">
          <span className="muted-text">Items</span>
          <strong>{items.length}</strong>
        </div>
        <div className="checkout-summary-row">
          <span className="muted-text">Grand total</span>
          <strong>{formatCurrency(sale.grandTotal || 0)}</strong>
        </div>
      </div>

      <div className="checkout-receipt-items">
        {items.map((item) => (
          <div className="checkout-receipt-item" key={`${item.variantId}-${item.skuSnapshot}`}>
            <div>
              <strong>{item.productNameSnapshot}</strong>
              <p className="muted-text">
                {item.attribute1Snapshot}/{item.attribute2Snapshot} - {item.skuSnapshot}
              </p>
            </div>
            <div className="checkout-receipt-item-meta">
              <span>
                {item.qty} x {formatCurrency(item.unitPriceSnapshot)}
              </span>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
