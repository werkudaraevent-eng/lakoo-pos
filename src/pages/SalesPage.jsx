import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { filterSales, paginateSales } from "../features/sales/salesHelpers";
import { buildSalesWorkspaceSummary } from "../features/sales/salesWorkspace";
import { formatCurrency, formatDate } from "../utils/formatters";

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
    <div className="page-stack sales-page sales-workspace">
      <section className="page-header-card sales-header-bar">
        <div className="sales-header-copy">
          <p className="eyebrow">Sales</p>
          <h1>Transaction workspace</h1>
          <p className="muted-text">
            Review finalized receipts in a split view with the receipt list on the left and the selected receipt detail on the right.
          </p>
        </div>

        <div className="sales-header-meta">
          {activeWorkspace ? <span className="badge-soft">{activeWorkspace.name}</span> : null}
          <span className="badge-soft">{summary.matchedCount} matched</span>
          <span className="badge-soft">{formatCurrency(summary.matchedRevenue)}</span>
          <span className="badge-soft">{summary.pageLabel}</span>
        </div>
      </section>

      {loading ? <p className="info-text">Loading sales...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="panel-card sales-toolbar sales-toolbar-flat">
        <div className="sales-toolbar-controls sales-toolbar-controls-flat">
          <label className="field sales-search-field">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Receipt, cashier, product, SKU"
            />
          </label>

          <label className="field sales-payment-field">
            <span>Payment method</span>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="all">All</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </label>
        </div>

        <div className="sales-toolbar-summary sales-toolbar-summary-flat">
          <div className="sales-kpi">
            <span className="stat-label">Receipts</span>
            <strong>{summary.matchedCount}</strong>
          </div>
          <div className="sales-kpi">
            <span className="stat-label">Matched revenue</span>
            <strong>{formatCurrency(summary.matchedRevenue)}</strong>
          </div>
          <div className="sales-kpi sales-kpi-actions">
            <span className="stat-label">Page</span>
            <div className="inline-actions sales-pagination-inline">
              <span className="badge-soft">{summary.pageLabel}</span>
              <button
                className="secondary-button small-button"
                disabled={paginated.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="secondary-button small-button"
                disabled={paginated.page >= paginated.totalPages}
                onClick={() => setPage((current) => Math.min(paginated.totalPages, current + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid sales-layout sales-layout-split">
        <article className="panel-card sales-list-panel sales-list-panel-split">
          <div className="panel-head sales-list-head sales-list-head-split">
            <div>
              <h2>Receipts</h2>
              <p className="muted-text">Newest finalized transactions in the active workspace.</p>
            </div>
            <span className="badge-soft">{sales.length} total</span>
          </div>

          <div className="sales-list-table">
            <div className="sales-list-table-head sales-list-table-head-split">
              <span>Receipt</span>
              <span>Cashier</span>
              <span>Payment</span>
              <span>Total</span>
            </div>
            {paginated.items.length === 0 ? <p className="stack-empty">No receipts match this filter.</p> : null}
            {paginated.items.map((sale) => (
              <button
                className={`sale-row-button sale-row-button-split${selectedSale?.id === sale.id ? " is-selected" : ""}`}
                key={sale.id}
                onClick={() => setSelectedId(sale.id)}
                type="button"
              >
                <div className="sale-row-primary">
                  <strong>{sale.receiptNumber}</strong>
                  <p className="muted-text">{formatDate(sale.createdAt)}</p>
                </div>
                <div className="sale-row-secondary">
                  <span>{sale.cashierUser}</span>
                </div>
                <span className={`sales-payment-pill sales-payment-pill-${sale.paymentMethod}`}>
                  {sale.paymentMethod}
                </span>
                <strong className="sale-row-total">{formatCurrency(sale.grandTotal)}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="panel-card receipt-panel receipt-panel-split">
          {selectedSale ? (
            <>
              <div className="receipt-head receipt-head-split">
                <div>
                  <p className="eyebrow">Receipt</p>
                  <h2>{selectedSale.receiptNumber}</h2>
                  <p className="muted-text">
                    {selectedSale.cashierUser} · {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <div className="inline-actions">
                  <span className={`sales-payment-pill sales-payment-pill-${selectedSale.paymentMethod}`}>
                    {selectedSale.paymentMethod}
                  </span>
                  <Link className="secondary-button small-button receipt-link-button" to={`/sales/${selectedSale.id}/receipt`}>
                    Print view
                  </Link>
                </div>
              </div>

              <div className="summary-box receipt-summary-box receipt-summary-box-flat">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(selectedSale.subtotal)}</strong>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <strong>{formatCurrency(selectedSale.discountTotal)}</strong>
                </div>
                {selectedSale.promotion ? (
                  <div className="summary-row">
                    <span>Promo</span>
                    <strong>{selectedSale.promotion.codeSnapshot}</strong>
                  </div>
                ) : null}
                <div className="summary-row total">
                  <span>Grand total</span>
                  <strong>{formatCurrency(selectedSale.grandTotal)}</strong>
                </div>
              </div>

              <div className="receipt-items receipt-items-split">
                {selectedSale.items.map((item) => (
                  <div className="receipt-item receipt-item-split" key={item.id ?? `${item.variantId}-${item.skuSnapshot}`}>
                    <div>
                      <strong>{item.productNameSnapshot}</strong>
                      <p className="muted-text">
                        {item.sizeSnapshot}/{item.colorSnapshot} · {item.skuSnapshot}
                      </p>
                    </div>
                    <div className="receipt-item-meta">
                      <span>
                        {item.qty} x {formatCurrency(item.unitPriceSnapshot)}
                      </span>
                      <strong>{formatCurrency(item.lineTotal)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="stack-empty">Belum ada transaksi.</p>
          )}
        </article>
      </section>
    </div>
  );
}
