export function ProductSearchPanel({ query, onQueryChange, children }) {
  return (
    <article className="checkout-products-card">
      <div className="checkout-panel-head">
        <h2>Product lookup</h2>
      </div>

      <label className="field">
        <span>Search product or SKU</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="AST-BLK-M atau Aster"
        />
      </label>

      {children}
    </article>
  );
}
