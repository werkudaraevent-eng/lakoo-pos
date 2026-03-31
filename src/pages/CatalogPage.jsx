import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { usePosData } from "../context/PosDataContext";
import {
  createEmptyProductDraft,
  createEmptyVariantDraft,
  normalizeProductPayload,
  normalizeVariantPayload,
} from "../features/catalog/catalogHelpers";
import { formatCurrency } from "../utils/formatters";

export function CatalogPage() {
  const {
    categories,
    createProduct,
    createVariant,
    loadError,
    loading,
    products,
    updateProduct,
    updateVariant,
  } = usePosData();
  const [query, setQuery] = useState("");
  const [productDraft, setProductDraft] = useState(createEmptyProductDraft);
  const [variantDraft, setVariantDraft] = useState(createEmptyVariantDraft);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? products[0] ?? null,
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description} ${product.variants
        .map((variant) => variant.sku)
        .join(" ")}`.toLowerCase();

      return haystack.includes(keyword);
    });
  }, [deferredQuery, products]);

  useEffect(() => {
    if (!selectedProductId && products[0]) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!editingProductId) {
      setProductDraft(createEmptyProductDraft());
      return;
    }

    const target = products.find((product) => product.id === editingProductId);
    if (!target) {
      return;
    }

    setProductDraft({
      name: target.name,
      category: target.category,
      description: target.description,
      basePrice: String(target.basePrice),
      isActive: target.isActive,
    });
    setSelectedProductId(target.id);
  }, [editingProductId, products]);

  useEffect(() => {
    if (!editingVariantId || !selectedProduct) {
      setVariantDraft(createEmptyVariantDraft());
      return;
    }

    const target = selectedProduct.variants.find((variant) => variant.id === editingVariantId);
    if (!target) {
      return;
    }

    setVariantDraft({
      sku: target.sku,
      size: target.size,
      color: target.color,
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

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        setMessage("Product updated.");
      } else {
        await createProduct({
          ...payload,
          variants: [],
        });
        setMessage("Product created.");
      }

      setEditingProductId(null);
      setProductDraft(createEmptyProductDraft());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVariantSubmit(event) {
    event.preventDefault();

    if (!selectedProduct) {
      setMessage("Pilih product dulu sebelum menambah variant.");
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
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Operational catalog with live product and variant control.</h1>
          <p className="muted-text">
            Admin dan manager bisa membuat product, menambah variant SKU, mengubah harga, dan menonaktifkan item dari satu workspace.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading catalog...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="info-text">{message}</p> : null}

      <section className="content-grid catalog-admin-layout">
        <article className="panel-card">
          <div className="panel-head">
            <h2>{editingProductId ? "Edit product" : "Create product"}</h2>
          </div>

          <form className="form-stack" onSubmit={handleProductSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                value={productDraft.name}
                onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Category</span>
              <input
                list="catalog-categories"
                value={productDraft.category}
                onChange={(event) => setProductDraft((current) => ({ ...current, category: event.target.value }))}
                placeholder="Shirts"
              />
              <datalist id="catalog-categories">
                {categories.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={productDraft.description}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Base price</span>
              <input
                inputMode="numeric"
                value={productDraft.basePrice}
                onChange={(event) => setProductDraft((current) => ({ ...current, basePrice: event.target.value }))}
              />
            </label>

            <label className="checkbox-inline">
              <input
                checked={productDraft.isActive}
                type="checkbox"
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Product active
            </label>

            <div className="inline-actions">
              <button className="primary-button" disabled={submitting} type="submit">
                {editingProductId ? "Update product" : "Create product"}
              </button>
              {editingProductId ? (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductDraft(createEmptyProductDraft());
                  }}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>{editingVariantId ? "Edit variant" : "Create variant"}</h2>
            <span className="badge-soft">{selectedProduct ? selectedProduct.name : "No product selected"}</span>
          </div>

          <form className="form-stack" onSubmit={handleVariantSubmit}>
            <div className="dual-fields">
              <label className="field">
                <span>SKU</span>
                <input
                  value={variantDraft.sku}
                  onChange={(event) => setVariantDraft((current) => ({ ...current, sku: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Price override</span>
                <input
                  inputMode="numeric"
                  value={variantDraft.priceOverride}
                  onChange={(event) =>
                    setVariantDraft((current) => ({ ...current, priceOverride: event.target.value }))
                  }
                  placeholder="Kosong = ikut base price"
                />
              </label>
            </div>

            <div className="dual-fields">
              <label className="field">
                <span>Size</span>
                <input
                  value={variantDraft.size}
                  onChange={(event) => setVariantDraft((current) => ({ ...current, size: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Color</span>
                <input
                  value={variantDraft.color}
                  onChange={(event) => setVariantDraft((current) => ({ ...current, color: event.target.value }))}
                />
              </label>
            </div>

            <div className="dual-fields">
              <label className="field">
                <span>Quantity on hand</span>
                <input
                  inputMode="numeric"
                  value={variantDraft.quantityOnHand}
                  onChange={(event) =>
                    setVariantDraft((current) => ({ ...current, quantityOnHand: event.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Low stock threshold</span>
                <input
                  inputMode="numeric"
                  value={variantDraft.lowStockThreshold}
                  onChange={(event) =>
                    setVariantDraft((current) => ({ ...current, lowStockThreshold: event.target.value }))
                  }
                />
              </label>
            </div>

            <label className="checkbox-inline">
              <input
                checked={variantDraft.isActive}
                type="checkbox"
                onChange={(event) =>
                  setVariantDraft((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Variant active
            </label>

            <div className="inline-actions">
              <button className="primary-button" disabled={submitting || !selectedProduct} type="submit">
                {editingVariantId ? "Update variant" : "Create variant"}
              </button>
              {editingVariantId ? (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setEditingVariantId(null);
                    setVariantDraft(createEmptyVariantDraft());
                  }}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>

      <article className="panel-card">
        <div className="panel-head">
          <h2>Catalog browser</h2>
          <span className="badge-soft">{filteredProducts.length} products</span>
        </div>
        <label className="field">
          <span>Search catalog or SKU</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Dress, AST-BLK-M, Shirts"
          />
        </label>
      </article>

      <section className="catalog-page-grid">
        {filteredProducts.map((product) => (
          <article
            className={`panel-card selectable-card${selectedProduct?.id === product.id ? " is-selected" : ""}`}
            key={product.id}
          >
            <div className="product-card-head">
              <button
                className="card-link-button"
                onClick={() => {
                  setSelectedProductId(product.id);
                  setEditingVariantId(null);
                }}
                type="button"
              >
                <h2>{product.name}</h2>
              </button>
              <span className="badge-soft">{product.isActive ? "Active" : "Inactive"}</span>
            </div>
            <p className="muted-text">
              {product.category} - {formatCurrency(product.basePrice)}
            </p>
            <p className="muted-text">{product.description}</p>
            <div className="inline-actions">
              <button className="secondary-button small-button" onClick={() => setEditingProductId(product.id)} type="button">
                Edit product
              </button>
              <button
                className="secondary-button small-button"
                onClick={() => {
                  setSelectedProductId(product.id);
                  setEditingVariantId(null);
                  setVariantDraft(createEmptyVariantDraft());
                }}
                type="button"
              >
                Add variant
              </button>
            </div>
            <div className="variant-list">
              {product.variants.map((variant) => (
                <div className="variant-row" key={variant.id}>
                  <div>
                    <strong>
                      {variant.size} / {variant.color}
                    </strong>
                    <p className="muted-text">{variant.sku}</p>
                  </div>
                  <div className="variant-meta">
                    <span>{formatCurrency(variant.priceOverride ?? product.basePrice)}</span>
                    <span className={variant.quantityOnHand <= variant.lowStockThreshold ? "pill-warning" : "pill-strong"}>
                      {variant.quantityOnHand} pcs
                    </span>
                    <button
                      className="secondary-button small-button"
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setEditingVariantId(variant.id);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
