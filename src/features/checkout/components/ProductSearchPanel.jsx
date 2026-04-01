export function ProductSearchPanel({ query, resultCount, totalCount, onQueryChange, children }) {
  return (
    <article className="checkout-products-card">
      <div className="checkout-search-head">
        <div>
          <p className="eyebrow">Sell</p>
          <h2>Find products fast</h2>
        </div>
        <span className="badge-soft">
          {resultCount} of {totalCount}
        </span>
      </div>

      <label className="field checkout-search-field">
        <span>Search product, variant, or SKU</span>
        <input
          className="checkout-search-input"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="AST-BLK-M atau Aster"
        />
      </label>

      <div className="checkout-search-support">
        <p className="muted-text">
          {query ? "Filtered results for the current workspace inventory." : "Tap a variant card to add it to cart."}
        </p>
      </div>

      {children}
    </article>
  );
}
