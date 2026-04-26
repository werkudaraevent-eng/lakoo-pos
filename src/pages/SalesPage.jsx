import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";


import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { filterSales, paginateSales } from "../features/sales/salesHelpers";
import { buildSalesWorkspaceSummary } from "../features/sales/salesWorkspace";
import { AppIcon } from "../features/ui/AppIcon";
import { formatCurrency, formatDate } from "../utils/formatters";
import "../features/sales/sales.css";

const PAGE_SIZE = 6;

export function SalesPage() {
  const { loadError, loading, sales, workspaces } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const [query, setQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(sales[0]?.id ?? null);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;

  const filteredSales = useMemo(
    () =>
      filterSales(sales, {
        query,
        paymentMethod,
      }),
    [paymentMethod, query, sales]
  );

  const paginated = useMemo(
    () =>
      paginateSales(filteredSales, {
        page,
        pageSize: PAGE_SIZE,
      }),
    [filteredSales, page]
  );

  const summary = useMemo(
    () =>
      buildSalesWorkspaceSummary({
        filteredSales,
        page: paginated.page,
        totalPages: paginated.totalPages,
      }),
    [filteredSales, paginated.page, paginated.totalPages]
  );

  const selectedSale = useMemo(
    () => paginated.items.find((sale) => sale.id === selectedId) ?? paginated.items[0] ?? null,
    [paginated.items, selectedId]
  );

  useEffect(() => {
    setPage(1);
  }, [paymentMethod, query]);

  useEffect(() => {
    if (paginated.items.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    const visibleSelected = paginated.items.some((sale) => sale.id === selectedId);
    if (!visibleSelected) {
      setSelectedId(paginated.items[0].id);
    }
  }, [paginated.items, selectedId]);

  return (
    <div className="sales-banani-page">
      <div className="page-actions">
        <div className="sales-banani-metrics">
          <div className="sales-banani-metric">
            <span className="sales-banani-metric-label">Matched receipts</span>
            <span className="sales-banani-metric-value">{summary.matchedCount}</span>
          </div>
          <div className="sales-banani-metric is-primary">
            <span className="sales-banani-metric-label">Matched revenue</span>
            <span className="sales-banani-metric-value">{formatCurrency(summary.matchedRevenue)}</span>
          </div>
        </div>
      </div>

      {loading ? <p className="info-text">Loading sales...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="sales-banani-card">
        <div className="sales-banani-toolbar">
          <label className="sales-banani-search" htmlFor="sales-search">
            <span className="sales-banani-search-icon" aria-hidden="true">
              <AppIcon name="Search" size={16} strokeWidth={1.9} />
            </span>
            <Input
              className="sales-banani-search-input"
              id="sales-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search receipt, cashier, product, SKU"
              value={query}
            />
          </label>

          <label className="sales-banani-filter">
            <span className="sales-banani-filter-icon" aria-hidden="true">
              <AppIcon name="Filter" size={16} strokeWidth={1.9} />
            </span>
            <select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
              <option value="all">All payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
            <span className="sales-banani-filter-chevron" aria-hidden="true">
              <AppIcon name="ChevronDown" size={16} strokeWidth={1.9} />
            </span>
          </label>

          <div className="sales-banani-toolbar-spacer" />

          <div className="sales-banani-pagination">
            <span className="sales-banani-page-info">{summary.pageLabel}</span>
            <div className="sales-banani-page-actions">
              <Button
                className="sales-banani-page-button"
                disabled={paginated.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                size="icon-xs"
                type="button"
                variant="outline"
              >
                <AppIcon name="ChevronLeft" size={16} strokeWidth={2} />
              </Button>
              <Button
                className="sales-banani-page-button"
                disabled={paginated.page >= paginated.totalPages}
                onClick={() => setPage((current) => Math.min(paginated.totalPages, current + 1))}
                size="icon-xs"
                type="button"
                variant="outline"
              >
                <AppIcon name="ChevronRight" size={16} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>

        <div className="sales-banani-body">
          <section className="sales-banani-list-pane">
            <div className="sales-banani-list-head">Matched receipts ({summary.matchedCount})</div>

            <div className="sales-banani-list">
              {paginated.items.length === 0 ? <p className="sales-banani-list-empty">No receipts match this filter.</p> : null}

              {paginated.items.map((sale) => (
                <button
                  className={`sales-banani-row${selectedSale?.id === sale.id ? " is-active" : ""}`}
                  key={sale.id}
                  onClick={() => setSelectedId(sale.id)}
                  type="button"
                >
                  <div className="sales-banani-row-top">
                    <span className="sales-banani-row-id">{sale.receiptNumber}</span>
                    <span className="sales-banani-row-total">{formatCurrency(sale.grandTotal)}</span>
                  </div>
                  <div className="sales-banani-row-bottom">
                    <span className="sales-banani-row-meta">{formatDate(sale.createdAt)}</span>
                    <span className="sales-banani-row-cashier">Cashier: {sale.cashierUser}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="sales-banani-detail-pane">
            {selectedSale ? (
              <div className="sales-banani-detail-card">
                <div className="sales-banani-detail-header">
                  <div className="sales-banani-detail-copy">
                    <div>
                      <Badge variant="outline">{activeWorkspace?.name ?? "Active workspace"}</Badge>
                    </div>
                    <h2 className="sales-banani-detail-title">{selectedSale.receiptNumber}</h2>
                    <p className="sales-banani-detail-meta">
                      {selectedSale.cashierUser} · {formatDate(selectedSale.createdAt)}
                    </p>
                  </div>

                  <div className="sales-banani-detail-actions">
                    <Badge className="sales-banani-payment" variant="secondary">
                      {selectedSale.paymentMethod}
                    </Badge>
                    <Button asChild className="sales-banani-print" size="sm" variant="outline">
                      <Link to={`/sales/${selectedSale.id}/receipt`}>Print view</Link>
                    </Button>
                  </div>
                </div>

                <div className="sales-banani-summary">
                  <div className="sales-banani-summary-row">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(selectedSale.subtotal)}</strong>
                  </div>
                  <div className="sales-banani-summary-row">
                    <span>Discount</span>
                    <strong>{formatCurrency(selectedSale.discountTotal)}</strong>
                  </div>
                  {selectedSale.promotion ? (
                    <div className="sales-banani-summary-row">
                      <span>Promo</span>
                      <strong>{selectedSale.promotion.codeSnapshot}</strong>
                    </div>
                  ) : null}
                  <Separator />
                  <div className="sales-banani-summary-row is-total">
                    <span>Grand total</span>
                    <strong>{formatCurrency(selectedSale.grandTotal)}</strong>
                  </div>
                </div>

                <div className="sales-banani-items">
                  {selectedSale.items.map((item) => (
                    <div className="sales-banani-item" key={item.id ?? `${item.variantId}-${item.skuSnapshot}`}>
                      <div className="sales-banani-item-copy">
                        <strong>{item.productNameSnapshot}</strong>
                        <span>
                          {item.attribute1Snapshot}/{item.attribute2Snapshot} · {item.skuSnapshot}
                        </span>
                      </div>
                      <div className="sales-banani-item-meta">
                        <span>
                          {item.qty} x {formatCurrency(item.unitPriceSnapshot)}
                        </span>
                        <strong>{formatCurrency(item.lineTotal)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="sales-banani-empty">
                <div className="sales-banani-empty-box">
                  <div className="sales-banani-empty-icon" aria-hidden="true">
                    <AppIcon name="Receipt" size={28} strokeWidth={1.8} />
                  </div>
                  <h3>Receipt details</h3>
                  <p>Select a receipt from the left to view payment flow, cart details, and printable format.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
