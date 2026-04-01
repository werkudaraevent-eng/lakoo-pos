import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { buildInventoryWorkspaceSummary, getInventoryStatusLabel } from "../features/inventory/inventoryWorkspace";
import { formatDate } from "../utils/formatters";

function matchesInventoryQuery(variant, query) {
  if (!query) {
    return true;
  }

  const haystack = `${variant.productName} ${variant.size} ${variant.color} ${variant.sku}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function InventoryPage() {
  const { user } = useAuth();
  const { variants, inventoryMovements, adjustInventory, loading, loadError, workspaces } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const [form, setForm] = useState({
    variantId: "",
    mode: "restock",
    quantity: 1,
    note: "",
  });
  const [query, setQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [message, setMessage] = useState("");
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const inventoryLocked =
    activeWorkspace?.type === "event" && !["draft", "active"].includes(activeWorkspace.status);

  const filteredVariants = useMemo(() => {
    return variants.filter((variant) => {
      const matchesQuery = matchesInventoryQuery(variant, query);
      const matchesLowStock = !showLowStockOnly || variant.quantityOnHand <= variant.lowStockThreshold;

      return matchesQuery && matchesLowStock;
    });
  }, [query, showLowStockOnly, variants]);

  const summary = useMemo(() => buildInventoryWorkspaceSummary({ variants: filteredVariants }), [filteredVariants]);

  const selectedVariant = useMemo(() => {
    return filteredVariants.find((variant) => variant.id === form.variantId) ?? filteredVariants[0] ?? null;
  }, [filteredVariants, form.variantId]);

  useEffect(() => {
    if (!form.variantId && filteredVariants[0]) {
      setForm((current) => ({ ...current, variantId: filteredVariants[0].id }));
      return;
    }

    if (filteredVariants.length === 0 && form.variantId) {
      setForm((current) => ({ ...current, variantId: "" }));
      return;
    }

    const visibleSelected = filteredVariants.some((variant) => variant.id === form.variantId);
    if (!visibleSelected && filteredVariants[0]?.id && form.variantId !== filteredVariants[0].id) {
      setForm((current) => ({ ...current, variantId: filteredVariants[0].id }));
    }
  }, [filteredVariants, form.variantId]);

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await adjustInventory({ ...form, actor: user });
    setMessage(result.ok ? "Stock updated." : result.message);

    if (result.ok) {
      setForm((current) => ({ ...current, quantity: 1, note: "" }));
    }
  }

  return (
    <div className="page-stack inventory-page inventory-workspace">
      <section className="page-header-card inventory-header-bar">
        <div className="inventory-header-copy">
          <p className="eyebrow">Inventory</p>
          <h1>Stock control workspace</h1>
          <p className="muted-text">
            Restock dan adjustment dicatat sebagai movement terpisah agar quantity on hand selalu bisa ditelusuri.
          </p>
        </div>

        <div className="inventory-header-meta">
          {activeWorkspace ? <span className="badge-soft">{activeWorkspace.name}</span> : null}
          {activeWorkspace?.stockMode ? <span className="badge-soft">{activeWorkspace.stockMode}</span> : null}
          {activeWorkspace?.status ? <span className="badge-soft">{activeWorkspace.status}</span> : null}
        </div>
      </section>

      {loading ? <p className="info-text">Loading inventory...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="panel-card inventory-toolbar inventory-toolbar-flat">
        <div className="inventory-toolbar-controls inventory-toolbar-controls-flat">
          <label className="field inventory-search-field">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Product, variant, SKU"
            />
          </label>

          <label className="field inventory-filter-field">
            <span>Stock scope</span>
            <button
              className={`secondary-button inventory-filter-button${showLowStockOnly ? " is-selected" : ""}`}
              onClick={() => setShowLowStockOnly((current) => !current)}
              type="button"
            >
              {showLowStockOnly ? "Low stock only" : "All variants"}
            </button>
          </label>
        </div>

        <div className="inventory-toolbar-summary">
          <div className="inventory-kpi">
            <span className="stat-label">Visible variants</span>
            <strong>{summary.totalVariants}</strong>
          </div>
          <div className="inventory-kpi">
            <span className="stat-label">Low stock</span>
            <strong>{summary.lowStockCount}</strong>
          </div>
          <div className="inventory-kpi">
            <span className="stat-label">Total on hand</span>
            <strong>{summary.totalOnHand}</strong>
          </div>
        </div>
      </section>

      <section className="content-grid inventory-layout inventory-layout-split">
        <article className="panel-card inventory-list-panel inventory-list-panel-split">
          <div className="panel-head inventory-list-head">
            <div>
              <h2>Stock list</h2>
              <p className="muted-text">Select a variant to inspect stock level and post a movement.</p>
            </div>
            <span className="badge-soft">{filteredVariants.length} visible</span>
          </div>

          <div className="inventory-table inventory-table-split">
            <div className="inventory-table-head">
              <span>Variant</span>
              <span>On hand</span>
              <span>Threshold</span>
              <span>Status</span>
            </div>
            {filteredVariants.length === 0 ? <p className="stack-empty">No variants match this filter.</p> : null}
            {filteredVariants.map((variant) => {
              const status = getInventoryStatusLabel(variant);
              const isSelected = variant.id === form.variantId;

              return (
                <button
                  className={`inventory-row-button${isSelected ? " is-selected" : ""}`}
                  key={variant.id}
                  onClick={() => setForm((current) => ({ ...current, variantId: variant.id }))}
                  type="button"
                >
                  <div className="inventory-row-primary">
                    <strong>{variant.productName}</strong>
                    <p className="muted-text">
                      {variant.size}/{variant.color} · {variant.sku}
                    </p>
                  </div>
                  <strong>{variant.quantityOnHand}</strong>
                  <span className="muted-text">{variant.lowStockThreshold}</span>
                  <span className={`inventory-status-pill inventory-status-pill-${status.tone}`}>{status.label}</span>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel-card inventory-action-panel inventory-action-panel-split">
          <div className="panel-head inventory-action-head">
            <div>
              <p className="eyebrow">Selected variant</p>
              <h2>{selectedVariant ? selectedVariant.productName : "No variant selected"}</h2>
              {selectedVariant ? (
                <p className="muted-text">
                  {selectedVariant.size}/{selectedVariant.color} · {selectedVariant.sku}
                </p>
              ) : (
                <p className="muted-text">Choose a variant from the stock list to post a movement.</p>
              )}
            </div>
            {selectedVariant ? <span className="badge-soft">{selectedVariant.quantityOnHand} on hand</span> : null}
          </div>

          <div className="inventory-selected-summary">
            <div className="summary-row">
              <span>Threshold</span>
              <strong>{selectedVariant ? selectedVariant.lowStockThreshold : "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Last checked</span>
              <strong>{selectedVariant ? formatDate(selectedVariant.updatedAt ?? selectedVariant.createdAt) : "-"}</strong>
            </div>
          </div>

          <form className="form-stack inventory-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Mode</span>
              <select
                value={form.mode}
                onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}
              >
                <option value="restock">Restock</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </label>

            <label className="field">
              <span>Quantity</span>
              <input
                min="1"
                type="number"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Note</span>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Weekend replenishment, damaged item, display sample..."
              />
            </label>

            {inventoryLocked ? <p className="error-text">Stock changes are locked for this event status.</p> : null}
            {message ? <p className="info-text">{message}</p> : null}

            <button className="primary-button" disabled={inventoryLocked || !selectedVariant} type="submit">
              Save movement
            </button>
          </form>

          <div className="inventory-history-panel">
            <div className="panel-head inventory-history-head">
              <h3>Movement history</h3>
              <span className="badge-soft">Recent 10</span>
            </div>

            <div className="table-list inventory-history-list">
              {inventoryMovements.slice(0, 10).map((movement) => (
                <div className="table-row inventory-history-row" key={movement.id}>
                  <div>
                    <strong>{movement.note}</strong>
                    <p className="muted-text">
                      {movement.type} · {movement.actorUser} · {formatDate(movement.createdAt)}
                    </p>
                  </div>
                  <span className={movement.qtyDelta < 0 ? "text-danger" : "text-success"}>
                    {movement.qtyDelta > 0 ? "+" : ""}
                    {movement.qtyDelta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
