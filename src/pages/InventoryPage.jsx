import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { formatDate } from "../utils/formatters";

export function InventoryPage() {
  const { user } = useAuth();
  const { variants, inventoryMovements, adjustInventory, loading, loadError } = usePosData();
  const [form, setForm] = useState({
    variantId: "",
    mode: "restock",
    quantity: 1,
    note: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!form.variantId && variants[0]) {
      setForm((current) => ({ ...current, variantId: variants[0].id }));
    }
  }, [form.variantId, variants]);

  const lowStockItems = useMemo(
    () => variants.filter((item) => item.quantityOnHand <= item.lowStockThreshold),
    [variants]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await adjustInventory({ ...form, actor: user });
    setMessage(result.ok ? "Stock updated." : result.message);

    if (result.ok) {
      setForm((current) => ({ ...current, quantity: 1, note: "" }));
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Stock control with auditable movements.</h1>
          <p className="muted-text">
            Restock dan adjustment dicatat sebagai movement terpisah agar quantity on hand selalu bisa ditelusuri.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading inventory...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Manual stock action</h2>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Variant</span>
              <select
                value={form.variantId}
                onChange={(event) => setForm((current) => ({ ...current, variantId: event.target.value }))}
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.productName} - {variant.size}/{variant.color} ({variant.sku})
                  </option>
                ))}
              </select>
            </label>

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

            {message ? <p className="info-text">{message}</p> : null}

            <button className="primary-button" type="submit">
              Save movement
            </button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Low-stock variants</h2>
          </div>
          <div className="table-list">
            {lowStockItems.map((item) => (
              <div className="table-row" key={item.id}>
                <div>
                  <strong>{item.productName}</strong>
                  <p className="muted-text">
                    {item.size}/{item.color} - {item.sku}
                  </p>
                </div>
                <span className="pill-warning">{item.quantityOnHand} pcs</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="panel-card">
        <div className="panel-head">
          <h2>Movement history</h2>
        </div>
        <div className="table-list">
          {inventoryMovements.slice(0, 10).map((movement) => (
            <div className="table-row" key={movement.id}>
              <div>
                <strong>{movement.note}</strong>
                <p className="muted-text">
                  {movement.type} - {movement.actorUser} - {formatDate(movement.createdAt)}
                </p>
              </div>
              <span className={movement.qtyDelta < 0 ? "text-danger" : "text-success"}>
                {movement.qtyDelta > 0 ? "+" : ""}
                {movement.qtyDelta}
              </span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
