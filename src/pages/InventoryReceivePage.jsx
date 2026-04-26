import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import "../features/inventory/inventory.css";

export function InventoryReceivePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { adjustInventory, inventoryMovements, loadError, products, workspaces } = usePosData();
  const [form, setForm] = useState({
    variantId: "",
    mode: "restock",
    quantity: 1,
    note: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const variants = useMemo(
    () =>
      products.flatMap((product) =>
        (Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
          ...variant,
          productName: product.name,
        }))
      ),
    [products]
  );
  const selectedVariant = variants.find((variant) => variant.id === form.variantId) ?? variants[0] ?? null;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const inventoryLocked =
    activeWorkspace?.type === "event" && !["draft", "active"].includes(activeWorkspace.status);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const result = await adjustInventory(
      {
        ...form,
        variantId: form.variantId || selectedVariant?.id || "",
        actor: user,
      }
    );

    if (!result.ok) {
      setMessage(result.message);
      setSubmitting(false);
      return;
    }

    navigate("/inventory");
  }

  return (
    <div className="inventory-manage-page">
      <section className="page-header-card">
        <p className="eyebrow">Inventory</p>
        <h1>Receive stock</h1>
        <p className="muted-text">
          Post a stock movement in a dedicated flow. The main inventory page stays clean because this action belongs
          here, not in the table surface.
        </p>
        <div className="inventory-manage-actions">
          <Button asChild size="sm" variant="outline">
            <Link to="/inventory">Back to inventory</Link>
          </Button>
        </div>
      </section>

      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="error-text">{message}</p> : null}

      {selectedVariant ? (
        <section className="inventory-manage-summary">
          <div className="summary-row">
            <span>Selected default variant</span>
            <strong>
              {selectedVariant.productName} · {selectedVariant.sku}
            </strong>
          </div>
          <div className="summary-row">
            <span>On hand</span>
            <strong>{selectedVariant.quantityOnHand}</strong>
          </div>
        </section>
      ) : null}

      <section className="panel-card">
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Variant</span>
            <select
              onChange={(event) => setForm((current) => ({ ...current, variantId: event.target.value }))}
              value={form.variantId || selectedVariant?.id || ""}
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.productName} · {variant.attribute1Value}/{variant.attribute2Value} · {variant.sku}
                </option>
              ))}
            </select>
          </label>

          <div className="dual-fields">
            <label className="field">
              <span>Mode</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}
                value={form.mode}
              >
                <option value="restock">Restock</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </label>

            <label className="field">
              <span>Quantity</span>
              <input
                min="1"
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                type="number"
                value={form.quantity}
              />
            </label>
          </div>

          <label className="field">
            <span>Note</span>
            <textarea
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Weekend replenishment, damaged item, display sample..."
              value={form.note}
            />
          </label>

          {inventoryLocked ? <p className="error-text">Stock changes are locked for this workspace status.</p> : null}

          <div className="inline-actions">
            <Button disabled={inventoryLocked || !selectedVariant || submitting} type="submit">
              {submitting ? "Saving..." : "Save movement"}
            </Button>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-head">
          <h2>Recent movements</h2>
        </div>
        <div className="inventory-manage-list">
          {inventoryMovements.slice(0, 8).map((movement) => (
            <div className="inventory-manage-row" key={movement.id}>
              <div>
                <strong>{movement.note || movement.type}</strong>
                <p className="muted-text">
                  {movement.productName} · {movement.sku} · {movement.actorUser}
                </p>
              </div>
              <span className={movement.qtyDelta < 0 ? "text-danger" : "text-success"}>
                {movement.qtyDelta > 0 ? "+" : ""}
                {movement.qtyDelta}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
