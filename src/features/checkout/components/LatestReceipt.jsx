import { Link } from "react-router-dom";

import { formatCurrency } from "../../../utils/formatters";

export function LatestReceipt({ sale }) {
  if (!sale) {
    return null;
  }

  return (
    <section className="checkout-receipt-card">
      <div className="checkout-panel-head">
        <h2>Latest receipt</h2>
        <div className="checkout-inline-actions">
          <span className="pill-strong">{sale.receiptNumber}</span>
          <Link className="secondary-button small-button checkout-receipt-link-button" to={`/sales/${sale.id}/receipt`}>
            Print view
          </Link>
        </div>
      </div>

      <div className="checkout-receipt-items">
        {sale.items.map((item) => (
          <div className="checkout-receipt-item" key={`${item.variantId}-${item.skuSnapshot}`}>
            <div>
              <strong>{item.productNameSnapshot}</strong>
              <p className="muted-text">
                {item.sizeSnapshot}/{item.colorSnapshot} - {item.skuSnapshot}
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
