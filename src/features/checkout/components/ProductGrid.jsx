import { formatCurrency } from "../../../utils/formatters";

export function ProductGrid({ variants, onAdd }) {
  return (
    <div className="checkout-product-grid">
      {variants.map((variant) => (
        <button
          className="checkout-product-card"
          key={variant.id}
          onClick={() => onAdd(variant)}
          type="button"
        >
          <div className="checkout-product-card-head">
            <strong>{variant.productName}</strong>
            <span className={variant.quantityOnHand <= variant.lowStockThreshold ? "pill-warning" : "pill-strong"}>
              {variant.quantityOnHand} pcs
            </span>
          </div>
          <p className="muted-text">
            {variant.size} / {variant.color} - {variant.sku}
          </p>
          <strong>{formatCurrency(variant.price)}</strong>
        </button>
      ))}
    </div>
  );
}
