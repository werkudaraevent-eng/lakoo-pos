import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { buildReceiptTitle } from "../features/sales/salesHelpers";
import { formatCurrency, formatDate } from "../utils/formatters";

export function ReceiptPage() {
  const { saleId } = useParams();
  const { sales, settings } = usePosData();

  const sale = useMemo(() => sales.find((item) => item.id === saleId) ?? null, [saleId, sales]);

  if (!sale) {
    return (
      <div className="page-stack">
        <section className="page-header-card">
          <div>
            <p className="eyebrow">Receipt</p>
            <h1>Receipt tidak ditemukan.</h1>
            <p className="muted-text">Transaksi yang dipilih tidak ada di histori saat ini.</p>
          </div>
        </section>
        <article className="panel-card">
          <Link className="secondary-button receipt-link-button" to="/sales">
            Kembali ke sales
          </Link>
        </article>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header-card no-print">
        <div>
          <p className="eyebrow">Receipt</p>
          <h1>{buildReceiptTitle(sale)}</h1>
          <p className="muted-text">Halaman ini siap diprint ke thermal printer browser atau disimpan ke PDF.</p>
        </div>
        <div className="inline-actions">
          <Link className="secondary-button receipt-link-button" to="/sales">
            Kembali ke sales
          </Link>
          <button className="primary-button" onClick={() => window.print()} type="button">
            Print receipt
          </button>
        </div>
      </section>

      <article className="panel-card receipt-print-card">
        <div className="receipt-print-head">
          <div>
            <strong>{settings.storeName || "Lakoo."}</strong>
            <p className="muted-text">{settings.storeCode}</p>
            <p className="muted-text">{settings.address}</p>
          </div>
          <div className="receipt-print-meta">
            <strong>{sale.receiptNumber}</strong>
            <span>{formatDate(sale.createdAt)}</span>
            <span>{sale.cashierUser}</span>
          </div>
        </div>

        <div className="receipt-print-items">
          {sale.items.map((item) => (
            <div className="receipt-print-row" key={item.id ?? `${item.variantId}-${item.skuSnapshot}`}>
              <div>
                <strong>{item.productNameSnapshot}</strong>
                <p className="muted-text">
                  {item.attribute1Snapshot}/{item.attribute2Snapshot} - {item.skuSnapshot}
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

        <div className="summary-box receipt-print-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(sale.subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Discount</span>
            <strong>{formatCurrency(sale.discountTotal)}</strong>
          </div>
          {sale.promotion ? (
            <div className="summary-row">
              <span>Promo</span>
              <strong>{sale.promotion.codeSnapshot}</strong>
            </div>
          ) : null}
          {sale.taxTotal > 0 ? (
            <div className="summary-row">
              <span>Tax</span>
              <strong>{formatCurrency(sale.taxTotal)}</strong>
            </div>
          ) : null}
          <div className="summary-row total">
            <span>Grand total</span>
            <strong>{formatCurrency(sale.grandTotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Payment</span>
            <strong>{sale.paymentMethod}</strong>
          </div>
        </div>
      </article>
    </div>
  );
}
