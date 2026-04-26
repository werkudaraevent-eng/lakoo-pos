import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { usePosData } from "../context/PosDataContext";
import {
  buildInventoryCsv,
  buildInventoryProductRows,
  filterInventoryProductRows,
  paginateInventoryRows,
} from "../features/inventory/inventoryWorkspace";
import { AppIcon } from "../features/ui/AppIcon";
import "../features/inventory/inventory.css";

const PAGE_SIZE = 8;

function downloadInventoryCsv(rows) {
  const csv = buildInventoryCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventory-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function getProductMark(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();
}

export function InventoryPage() {
  const { categories, loadError, loading, products, workspaces } = usePosData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const locationOptions = useMemo(
    () =>
      workspaces
        .filter((workspace) => workspace.type === "event" && workspace.isVisible !== false)
        .map((workspace) => workspace.name),
    [workspaces]
  );
  const selectedWorkspace =
    location === "all"
      ? null
      : workspaces.find((workspace) => workspace.name === location) ?? null;
  const inventoryRows = useMemo(
    () => buildInventoryProductRows(products, { activeWorkspace: selectedWorkspace }),
    [products, selectedWorkspace]
  );
  const filteredRows = useMemo(
    () => filterInventoryProductRows(inventoryRows, { query: deferredQuery, category, status }),
    [category, deferredQuery, inventoryRows, status]
  );
  const paginatedRows = useMemo(
    () => paginateInventoryRows(filteredRows, { page, pageSize: PAGE_SIZE }),
    [filteredRows, page]
  );

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, category, status, location]);

  return (
    <div className="inventory-banani-page">
      <div className="page-actions">
        <div className="inventory-banani-actions">
          <Button
            className="inventory-banani-button"
            onClick={() => downloadInventoryCsv(filteredRows)}
            size="lg"
            type="button"
            variant="outline"
          >
            <AppIcon name="Download" size={16} />
            <span>Export CSV</span>
          </Button>
          <Button className="inventory-banani-button" disabled size="lg" type="button" variant="outline">
            <AppIcon name="ArrowRightLeft" size={16} />
            <span>Transfer Stock</span>
          </Button>
          <Button asChild className="inventory-banani-button is-primary" size="lg">
            <Link to="/inventory/receive">
              <AppIcon name="PackagePlus" size={16} />
              <span>Receive Stock</span>
            </Link>
          </Button>
        </div>
      </div>

      {loading ? <p className="info-text">Loading inventory...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}
      {location !== "all" ? (
        <p className="info-text">
          Workspace split is shown for <strong>{location}</strong>. Warehouse values outside that context remain hidden
          because the current model does not expose full multi-location stock.
        </p>
      ) : null}

      <section className="inventory-banani-toolbar">
        <div className="inventory-banani-toolbar-group">
          <label className="inventory-banani-search" htmlFor="inventory-search">
            <AppIcon name="Search" size={16} />
            <Input
              className="inventory-banani-search-input"
              id="inventory-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU or tags"
              value={query}
            />
          </label>

          <label className="inventory-banani-select">
            <select onChange={(event) => setLocation(event.target.value)} value={location}>
              <option value="all">Location: All</option>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="inventory-banani-select-icon" aria-hidden="true">
              <AppIcon name="MapPin" size={16} />
            </span>
          </label>

          <label className="inventory-banani-select">
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="all">Category: All</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="inventory-banani-select-icon" aria-hidden="true">
              <AppIcon name="Tag" size={16} />
            </span>
          </label>

          <label className="inventory-banani-select">
            <select onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="all">Status: All</option>
              <option value="stable">In stock</option>
              <option value="warning">Low stock</option>
              <option value="none">Out of stock</option>
            </select>
            <span className="inventory-banani-select-icon" aria-hidden="true">
              <AppIcon name="Filter" size={16} />
            </span>
          </label>
        </div>

        <p className="inventory-banani-page-info">
          Showing {paginatedRows.items.length} of {filteredRows.length} products
        </p>
      </section>

      <section className="inventory-banani-table-card">
        {paginatedRows.items.length ? (
          <>
            <div className="inventory-banani-table-wrap">
              <table className="inventory-banani-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Total Stock</th>
                    <th>Warehouse</th>
                    <th>{selectedWorkspace?.name || "Active Workspace"}</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.items.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="inventory-banani-product">
                          <span className="inventory-banani-avatar">{getProductMark(row.name)}</span>
                          <div className="inventory-banani-product-copy">
                            <strong>{row.name}</strong>
                            <span className="inventory-banani-subtle">{row.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.category || "-"}</td>
                      <td className="inventory-banani-qty">{row.totalStock}</td>
                      <td className="inventory-banani-qty">{row.warehouseStock == null ? "-" : row.warehouseStock}</td>
                      <td className="inventory-banani-qty">{row.workspaceStock == null ? "-" : row.workspaceStock}</td>
                      <td>
                        <span className={`inventory-banani-status ${row.status.tone}`}>
                          <span className="dot" />
                          {row.status.label}
                        </span>
                      </td>
                      <td>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/catalog/${row.id}`}>Open detail</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="inventory-banani-table-footer">
              <p className="inventory-banani-page-info">
                Page {paginatedRows.page} of {paginatedRows.totalPages}
              </p>
              <div className="inventory-banani-page-controls">
                <Button
                  disabled={paginatedRows.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <AppIcon name="ChevronLeft" size={16} />
                </Button>
                <Button
                  disabled={paginatedRows.page >= paginatedRows.totalPages}
                  onClick={() => setPage((current) => Math.min(paginatedRows.totalPages, current + 1))}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <AppIcon name="ChevronRight" size={16} />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="inventory-banani-empty">
            No products match the current filter state. Broaden the filters or change location context.
          </div>
        )}
      </section>
    </div>
  );
}
