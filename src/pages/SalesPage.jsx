import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { filterSales, paginateSales } from "../features/sales/salesHelpers";
import { formatCurrency, formatDate } from "../utils/formatters";

const PAGE_SIZE = 6;

export function SalesPage() {
  const { loadError, loading, sales } = usePosData();
  const [query, setQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(sales[0]?.id ?? null);

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

  const selectedSale = useMemo(
    () => filteredSales.find((sale) => sale.id === selectedId) ?? paginated.items[0] ?? null,
    [filteredSales, paginated.items, selectedId]
  );

  useEffect(() => {
    setPage(1);
  }, [paymentMethod, query]);

  useEffect(() => {
    if (!selectedSale && paginated.items[0]) {
      setSelectedId(paginated.items[0].id);
    }
  }, [paginated.items, selectedSale]);

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <p className="eyebrow">Sales History</p>
          <h1>Finalized transactions, filters, and printable receipts.</h1>
          <p className="muted-text">
            Histori penjualan sekarang bisa dicari lewat receipt, kasir, SKU, difilter per metode pembayaran, lalu dibuka ke view receipt siap print.
          </p>
        </div>
      </section>

      {loading ? <p className="info-text">Loading sales...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="content-grid two-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Sales filters</h2>
            <span className="badge-soft">{filteredSales.length} matched</span>
          </div>

          <div className="dual-fields">
            <label className="field">
              <span>Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Receipt, cashier, product, SKU"
              />
            </label>

            <label className="field">
              <span>Payment method</span>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </label>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Pagination</h2>
            <span className="badge-soft">
              Page {paginated.page} / {paginated.totalPages}
            </span>
          </div>
          <div className="inline-actions">
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
        </article>
      </section>

      <section className="content-grid sales-layout">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Finalized sales</h2>
            <span className="badge-soft">{sales.length} total</span>
          </div>
          <div className="table-list">
            {paginated.items.length === 0 ? <p className="muted-text">Tidak ada transaksi yang cocok.</p> : null}
            {paginated.items.map((sale) => (
              <button
                className={`sale-row-button${selectedSale?.id === sale.id ? " is-selected" : ""}`}
                key={sale.id}
                onClick={() => setSelectedId(sale.id)}
                type="button"
              >
                <div>
                  <strong>{sale.receiptNumber}</strong>
                  <p className="muted-text">
                    {sale.cashierUser} - {formatDate(sale.createdAt)}
                  </p>
                  <p className="muted-text">{sale.paymentMethod}</p>
                </div>
                <span>{formatCurrency(sale.grandTotal)}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel-card receipt-panel">
          {selectedSale ? (
            <>
              <div className="receipt-head">
                <div>
                  <p className="eyebrow">Receipt</p>
                  <h2>{selectedSale.receiptNumber}</h2>
                  <p className="muted-text">
                    {selectedSale.cashierUser} - {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <div className="inline-actions">
                  <span className="pill-strong">{selectedSale.paymentMethod}</span>
                  <Link className="secondary-button small-button receipt-link-button" to={`/sales/${selectedSale.id}/receipt`}>
                    Print view
                  </Link>
                </div>
              </div>

              <div className="receipt-items">
                {selectedSale.items.map((item) => (
                  <div className="receipt-item" key={item.id ?? `${item.variantId}-${item.skuSnapshot}`}>
                    <div>
                      <strong>{item.productNameSnapshot}</strong>
                      <p className="muted-text">
                        {item.sizeSnapshot}/{item.colorSnapshot} - {item.skuSnapshot}
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

              <div className="summary-box">
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
            </>
          ) : (
            <p className="muted-text">Belum ada transaksi.</p>
          )}
        </article>
      </section>
    </div>
  );
}
