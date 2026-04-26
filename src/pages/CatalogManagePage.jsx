import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../components/ui/button";
import { usePosData } from "../context/PosDataContext";
import {
  buildCatalogStockSummary,
  createEmptyProductDraft,
  createEmptyVariantDraft,
  normalizeProductPayload,
  normalizeVariantPayload,
} from "../features/catalog/catalogHelpers";
import { formatCurrency } from "../utils/formatters";
import "../features/catalog/catalog.css";

export function CatalogManagePage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const {
    categories,
    createProduct,
    createVariant,
    loadError,
    products,
    settings,
    updateProduct,
    updateVariant,
  } = usePosData();
  const attr1Label = settings.attribute1Label || "Attribute 1";
  const attr2Label = settings.attribute2Label || "Attribute 2";
  const [productDraft, setProductDraft] = useState(createEmptyProductDraft);
  const [variantDraft, setVariantDraft] = useState(createEmptyVariantDraft);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCreateMode = !productId;
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products]
  );

  useEffect(() => {
    if (!selectedProduct) {
      setProductDraft(createEmptyProductDraft());
      return;
    }

    setProductDraft({
      name: selectedProduct.name,
      category: selectedProduct.category,
      description: selectedProduct.description,
      basePrice: String(selectedProduct.basePrice),
      isActive: selectedProduct.isActive,
    });
  }, [selectedProduct]);

  useEffect(() => {
    if (!editingVariantId || !selectedProduct) {
      setVariantDraft(createEmptyVariantDraft());
      return;
    }

    const target = selectedProduct.variants.find((variant) => variant.id === editingVariantId);
    if (!target) {
      setVariantDraft(createEmptyVariantDraft());
      return;
    }

    setVariantDraft({
      sku: target.sku,
      attribute1Value: target.attribute1Value,
      attribute2Value: target.attribute2Value,
      priceOverride: target.priceOverride == null ? "" : String(target.priceOverride),
      quantityOnHand: String(target.quantityOnHand),
      lowStockThreshold: String(target.lowStockThreshold),
      isActive: target.isActive,
    });
  }, [editingVariantId, selectedProduct]);

  async function handleProductSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const payload = normalizeProductPayload(productDraft);

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload);
        setMessage("Product updated.");
      } else {
        await createProduct({ ...payload, variants: [] });
        navigate("/catalog");
        return;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVariantSubmit(event) {
    event.preventDefault();

    if (!selectedProduct) {
      setMessage("Create the product first, then add variants.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const payload = normalizeVariantPayload(variantDraft);

      if (editingVariantId) {
        await updateVariant(editingVariantId, payload);
        setMessage("Variant updated.");
      } else {
        await createVariant(selectedProduct.id, payload);
        setMessage("Variant created.");
      }

      setEditingVariantId(null);
      setVariantDraft(createEmptyVariantDraft());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="catalog-manage-page">
      <section className="page-header-card">
        <p className="eyebrow">Catalog</p>
        <h1>{isCreateMode ? "Add product" : "Manage product"}</h1>
        <p className="muted-text">
          {isCreateMode
            ? "Create a product first. Variants come after the product exists."
            : "Edit the product, maintain variants, and control stock without polluting the browse page."}
        </p>
        <div className="catalog-manage-actions">
          <Button asChild size="sm" variant="outline">
            <Link to="/catalog">Back to catalog</Link>
          </Button>
        </div>
      </section>

      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="info-text">{message}</p> : null}
      {!isCreateMode && !selectedProduct ? <p className="error-text">Product not found.</p> : null}

      <section className="catalog-manage-grid">
        <article className="panel-card">
          <div className="panel-head">
            <h2>{isCreateMode ? "Create product" : "Edit product"}</h2>
          </div>

          <form className="form-stack" onSubmit={handleProductSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))}
                value={productDraft.name}
              />
            </label>

            <label className="field">
              <span>Category</span>
              <input
                list="catalog-manage-categories"
                onChange={(event) => setProductDraft((current) => ({ ...current, category: event.target.value }))}
                placeholder="Shirts"
                value={productDraft.category}
              />
              <datalist id="catalog-manage-categories">
                {categories.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, description: event.target.value }))
                }
                value={productDraft.description}
              />
            </label>

            <label className="field">
              <span>Base price</span>
              <input
                inputMode="numeric"
                onChange={(event) => setProductDraft((current) => ({ ...current, basePrice: event.target.value }))}
                value={productDraft.basePrice}
              />
            </label>

            <label className="checkbox-inline">
              <input
                checked={productDraft.isActive}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
                type="checkbox"
              />
              Product active
            </label>

            <div className="inline-actions">
              <Button disabled={submitting} type="submit">
                {isCreateMode ? "Create product" : "Save product"}
              </Button>
            </div>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>{editingVariantId ? "Edit variant" : "Create variant"}</h2>
            <span className="badge-soft">{selectedProduct ? selectedProduct.name : "Save product first"}</span>
          </div>

          <form className="form-stack" onSubmit={handleVariantSubmit}>
            <div className="dual-fields">
              <label className="field">
                <span>SKU</span>
                <input
                  onChange={(event) => setVariantDraft((current) => ({ ...current, sku: event.target.value }))}
                  value={variantDraft.sku}
                />
              </label>

              <label className="field">
                <span>Price override</span>
                <input
                  inputMode="numeric"
                  onChange={(event) =>
                    setVariantDraft((current) => ({ ...current, priceOverride: event.target.value }))
                  }
                  placeholder="Leave empty to use base price"
                  value={variantDraft.priceOverride}
                />
              </label>
            </div>

            <div className="dual-fields">
              <label className="field">
                <span>{attr1Label}</span>
                <input
                  onChange={(event) => setVariantDraft((current) => ({ ...current, attribute1Value: event.target.value }))}
                  value={variantDraft.attribute1Value}
                />
              </label>

              <label className="field">
                <span>{attr2Label}</span>
                <input
                  onChange={(event) => setVariantDraft((current) => ({ ...current, attribute2Value: event.target.value }))}
                  value={variantDraft.attribute2Value}
                />
              </label>
            </div>

            <div className="dual-fields">
              <label className="field">
                <span>Quantity on hand</span>
                <input
                  inputMode="numeric"
                  onChange={(event) =>
                    setVariantDraft((current) => ({ ...current, quantityOnHand: event.target.value }))
                  }
                  value={variantDraft.quantityOnHand}
                />
              </label>

              <label className="field">
                <span>Low stock threshold</span>
                <input
                  inputMode="numeric"
                  onChange={(event) =>
                    setVariantDraft((current) => ({ ...current, lowStockThreshold: event.target.value }))
                  }
                  value={variantDraft.lowStockThreshold}
                />
              </label>
            </div>

            <label className="checkbox-inline">
              <input
                checked={variantDraft.isActive}
                onChange={(event) =>
                  setVariantDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
                type="checkbox"
              />
              Variant active
            </label>

            <div className="inline-actions">
              <Button disabled={submitting || !selectedProduct} type="submit">
                {editingVariantId ? "Save variant" : "Create variant"}
              </Button>
              {editingVariantId ? (
                <Button
                  onClick={() => {
                    setEditingVariantId(null);
                    setVariantDraft(createEmptyVariantDraft());
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </article>
      </section>

      {selectedProduct ? (
        <article className="panel-card">
          <div className="panel-head">
            <h2>Variants</h2>
            <span className="badge-soft">
              {buildCatalogStockSummary(selectedProduct).label} · {selectedProduct.variants.length} variants
            </span>
          </div>

          <div className="catalog-manage-variant-list">
            {selectedProduct.variants.map((variant) => {
              const quantityOnHand = Number(variant.quantityOnHand) || 0;
              const threshold = Number(variant.lowStockThreshold) || 0;
              const tone = quantityOnHand <= 0 ? "none" : quantityOnHand <= threshold ? "low" : "high";

              return (
                <div className="catalog-manage-variant-row" key={variant.id}>
                  <div className="catalog-manage-variant-meta">
                    <strong>
                      {variant.attribute1Value} / {variant.attribute2Value}
                    </strong>
                    <span className="muted-text">{variant.sku}</span>
                    <span className="muted-text">
                      {formatCurrency(variant.priceOverride ?? selectedProduct.basePrice)}
                    </span>
                  </div>

                  <div className="catalog-manage-variant-actions">
                    <span className={`catalog-manage-stock-pill ${tone}`}>{quantityOnHand} pcs</span>
                    <Button onClick={() => setEditingVariantId(variant.id)} size="sm" type="button" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      ) : null}
    </div>
  );
}
