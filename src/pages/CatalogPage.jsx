import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { usePosData } from "../context/PosDataContext";
import {
  buildCatalogCsv,
  buildCatalogStockSummary,
  filterCatalogProducts,
  paginateCatalogProducts,
  sortCatalogProducts,
} from "../features/catalog/catalogHelpers";
import { AppIcon } from "../features/ui/AppIcon";
import { formatCurrency } from "../utils/formatters";
import "../features/catalog/catalog.css";

const PAGE_SIZE = 8;

function getProductMark(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();
}

function downloadCatalogCsv(products) {
  const csv = buildCatalogCsv(products);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "catalog-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function CatalogPage() {
  const { loadError, loading, products } = usePosData();
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, { query: deferredQuery, stockFilter }),
    [deferredQuery, products, stockFilter]
  );
  const sortedProducts = useMemo(
    () => sortCatalogProducts(filteredProducts, sortBy),
    [filteredProducts, sortBy]
  );
  const paginatedProducts = useMemo(
    () => paginateCatalogProducts(sortedProducts, { page, pageSize: PAGE_SIZE }),
    [page, sortedProducts]
  );

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, stockFilter, sortBy]);

  return (
    <div className="catalog-banani-page">
      <div className="page-actions">
        <div className="catalog-banani-header-actions">
          <Button
            className="catalog-banani-button is-outline"
            onClick={() => downloadCatalogCsv(sortedProducts)}
            size="lg"
            type="button"
            variant="outline"
          >
            <AppIcon name="Download" size={16} />
            <span>Export CSV</span>
          </Button>
          <Button asChild className="catalog-banani-button is-primary" size="lg">
            <Link to="/catalog/new">
              <AppIcon name="Plus" size={16} />
              <span>Add Product</span>
            </Link>
          </Button>
        </div>
      </div>

      {loading ? <p className="info-text">Loading catalog...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="catalog-banani-toolbar">
        <div className="catalog-banani-toolbar-group">
          <label className="catalog-banani-search" htmlFor="catalog-search">
            <span className="catalog-banani-search-icon" aria-hidden="true">
              <AppIcon name="Search" size={16} />
            </span>
            <Input
              className="catalog-banani-search-input"
              id="catalog-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, category, SKU"
              value={query}
            />
          </label>

          <label className="catalog-banani-select">
            <select onChange={(event) => setStockFilter(event.target.value)} value={stockFilter}>
              <option value="all">All stock</option>
              <option value="high">Healthy stock</option>
              <option value="low">Low stock</option>
              <option value="none">Out of stock</option>
            </select>
            <span className="catalog-banani-select-icon" aria-hidden="true">
              <AppIcon name="Filter" size={16} />
            </span>
          </label>

          <label className="catalog-banani-select">
            <select onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
              <option value="name-asc">Sort: Name</option>
              <option value="price-low">Sort: Price low</option>
              <option value="price-high">Sort: Price high</option>
              <option value="stock-high">Sort: Stock high</option>
            </select>
            <span className="catalog-banani-select-icon" aria-hidden="true">
              <AppIcon name="ArrowUpDown" size={16} />
            </span>
          </label>
        </div>

        <p className="catalog-banani-page-info">
          Showing {paginatedProducts.items.length} of {filteredProducts.length} products
        </p>
      </section>

      {paginatedProducts.items.length ? (
        <section className="catalog-banani-grid">
          {paginatedProducts.items.map((product) => {
            const stock = buildCatalogStockSummary(product);

            return (
              <article className="catalog-banani-card" key={product.id}>
                <div className="catalog-banani-media">
                  <span className="catalog-banani-media-mark">{getProductMark(product.name)}</span>
                  <div className="catalog-banani-overlay">
                    <Badge className="catalog-banani-status" variant={product.isActive ? "secondary" : "outline"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="catalog-banani-card-body">
                  <div className="catalog-banani-meta">
                    <span className="catalog-banani-category">{product.category || "Uncategorized"}</span>
                    <h2 className="catalog-banani-name">{product.name}</h2>
                    <p className="catalog-banani-price">{formatCurrency(product.basePrice)}</p>
                  </div>

                  <div className="catalog-banani-footer">
                    <span className="catalog-banani-stock">
                      <span className={`catalog-banani-stock-dot ${stock.tone}`} />
                      {stock.label}
                    </span>
                    <Button asChild className="catalog-banani-card-link" size="sm" variant="outline">
                      <Link to={`/catalog/${product.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="catalog-banani-empty">
          No products match the current search and filter state. Broaden the filter or add a new product.
        </section>
      )}

      <footer className="catalog-banani-pagination">
        <p className="catalog-banani-page-info">
          Page {paginatedProducts.page} of {paginatedProducts.totalPages}
        </p>

        <div className="catalog-banani-page-controls">
          <Button
            className="catalog-banani-page-button"
            disabled={paginatedProducts.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <AppIcon name="ChevronLeft" size={16} />
          </Button>
          <Button
            className="catalog-banani-page-button"
            disabled={paginatedProducts.page >= paginatedProducts.totalPages}
            onClick={() => setPage((current) => Math.min(paginatedProducts.totalPages, current + 1))}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <AppIcon name="ChevronRight" size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
