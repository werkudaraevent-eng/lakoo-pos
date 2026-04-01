import { formatCurrency } from "../../../utils/formatters";

export function ProductGrid({ variants, onAdd }) {
  if (variants.length === 0) {
    return <p className="stack-empty checkout-grid-empty">No matching variants in this workspace.</p>;
  }

  return (
    <div className="checkout-product-grid">
      {variants.map((variant) => (
        <button
          className={`checkout-product-card${variant.quantityOnHand <= 0 ? " is-unavailable" : ""}`}
          disabled={variant.quantityOnHand <= 0}
          key={variant.id}
          onClick={() => onAdd(variant)}
          type="button"
        >
          <div className="checkout-product-card-head">
            <span className="checkout-product-price">{formatCurrency(variant.price)}</span>
            <span className={variant.quantityOnHand <= variant.lowStockThreshold ? "pill-warning" : "pill-strong"}>
              {variant.quantityOnHand} pcs
            </span>
          </div>

          <div className="checkout-product-copy">
            <strong>{variant.productName}</strong>
            <p className="muted-text">
              {variant.size} / {variant.color}
            </p>
            <p className="muted-text">{variant.sku}</p>
          </div>

          <div className="checkout-product-card-foot">
            <span className="muted-text">
              {variant.quantityOnHand <= 0
                ? "Out of stock"
                : variant.quantityOnHand <= variant.lowStockThreshold
                  ? "Low stock"
                  : "Ready to add"}
            </span>
            <span className="checkout-product-action">Add</span>
          </div>
        </button>
      ))}
    </div>
  );
}
