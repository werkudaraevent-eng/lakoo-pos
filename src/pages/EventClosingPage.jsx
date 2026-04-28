import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { canCompleteClosingReview } from "../features/events/eventHelpers";
import { formatCurrency, formatDate } from "../utils/formatters";

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function EventClosingPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { activeWorkspaceId, selectWorkspace } = useWorkspace();
  const { closeEvent, inventoryMovements, loadError, loading, sales, variants, workspaces } = usePosData();
  const [reviewState, setReviewState] = useState({
    salesReviewed: false,
    stockReviewed: false,
    paymentReviewed: false,
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const event = workspaces.find((workspace) => workspace.id === eventId && workspace.type === "event") ?? null;
  const isScopedToEvent = activeWorkspaceId === eventId;
  const paymentSummary = useMemo(() => {
    const summary = {};
    for (const sale of sales) {
      const method = sale.paymentMethod || "other";
      summary[method] = (summary[method] || 0) + sale.grandTotal;
    }
    return summary;
  }, [sales]);
  const paymentGrandTotal = useMemo(
    () => Object.values(paymentSummary).reduce((sum, v) => sum + v, 0),
    [paymentSummary]
  );
  const remainingUnits = useMemo(
    () => variants.reduce((sum, variant) => sum + Number(variant.quantityOnHand || 0), 0),
    [variants]
  );
  const closingReady = canCompleteClosingReview(reviewState);

  async function handleCloseEvent() {
    if (!event) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    const result = await closeEvent(event.id, reviewState);

    if (!result.ok) {
      setMessage(result.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    navigate(`/events/${event.id}`, { replace: true });
  }

  if (loading && !event) {
    return <p className="info-text">Loading event closing review...</p>;
  }

  if (loadError && !event) {
    return <p className="error-text">{loadError}</p>;
  }

  if (!event) {
    return (
      <div className="page-stack">
        <section className="page-header-card narrow-card">
          <p className="eyebrow">Event closing</p>
          <h1>Event not found.</h1>
          <div className="inline-actions">
            <Link className="primary-button receipt-link-button" to="/events">
              Back to events
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack event-closing-workspace">
      <section className="page-header-card event-closing-header">
        <div className="event-closing-copy">
          <p className="eyebrow">Closing review</p>
          <h1>{event.name}</h1>
          <p className="muted-text">
            Review sales, remaining stock, and payment reconciliation before the event moves from{" "}
            {formatStatus(event.status)} to Closed.
          </p>
        </div>

        <div className="event-closing-meta">
          <span className="badge-soft">{formatStatus(event.status)}</span>
          <span className="badge-soft">{event.locationLabel || "Event workspace"}</span>
        </div>
      </section>

      {!isScopedToEvent ? (
        <article className="panel-card event-closing-gate">
          <div className="panel-head">
            <div>
              <h2>Switch to this event workspace first</h2>
              <p className="muted-text">
                Closing review uses the active workspace data. Switch the shell to this event so the sales and stock
                figures below match the event you are closing.
              </p>
            </div>
            <span className="badge-soft">Required</span>
          </div>
          <div className="inline-actions">
            <button className="primary-button" onClick={() => selectWorkspace(event.id)} type="button">
              Use this workspace
            </button>
            <Link className="secondary-button receipt-link-button" to={`/events/${event.id}`}>
              Back to detail
            </Link>
          </div>
        </article>
      ) : null}

      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="error-text">{message}</p> : null}

      <section className="event-closing-layout">
        <article className="panel-card event-closing-review-panel">
          <div className="panel-head">
            <div>
              <h2>Review steps</h2>
              <p className="muted-text">Confirm each step before the event can be closed.</p>
            </div>
            <span className={`badge-soft${closingReady ? "" : " warning"}`}>
              {closingReady ? "Ready" : "Review pending"}
            </span>
          </div>

          <div className={`closing-step-card${reviewState.salesReviewed ? " is-complete" : ""}`}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Step 1</p>
                <h3>Sales summary</h3>
              </div>
              <span className="badge-soft">{formatCurrency(sales.reduce((sum, sale) => sum + sale.grandTotal, 0))}</span>
            </div>
            <div className="summary-box closing-summary-box">
              <div className="summary-row">
                <span className="muted-text">Gross</span>
                <strong>{formatCurrency(sales.reduce((sum, sale) => sum + sale.subtotal, 0))}</strong>
              </div>
              <div className="summary-row">
                <span className="muted-text">Discount</span>
                <strong>{formatCurrency(sales.reduce((sum, sale) => sum + sale.discountTotal, 0))}</strong>
              </div>
              <div className="summary-row total">
                <span className="muted-text">Last receipt</span>
                <strong>{sales[0]?.createdAt ? formatDate(sales[0].createdAt) : "No sales yet"}</strong>
              </div>
            </div>
            <button
              className={reviewState.salesReviewed ? "secondary-button" : "primary-button"}
              disabled={!isScopedToEvent}
              onClick={() => setReviewState((current) => ({ ...current, salesReviewed: !current.salesReviewed }))}
              type="button"
            >
              {reviewState.salesReviewed ? "Sales review confirmed" : "Confirm sales summary"}
            </button>
          </div>

          <div className={`closing-step-card${reviewState.stockReviewed ? " is-complete" : ""}`}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Step 2</p>
                <h3>Remaining stock</h3>
              </div>
              <span className="badge-soft">{remainingUnits} units</span>
            </div>
            <div className="summary-box closing-summary-box">
              <div className="summary-row">
                <span className="muted-text">Variants in event</span>
                <strong>{variants.length}</strong>
              </div>
              <div className="summary-row">
                <span className="muted-text">Inventory movements</span>
                <strong>{inventoryMovements.length}</strong>
              </div>
              <div className="summary-row total">
                <span className="muted-text">Stock mode</span>
                <strong>{event.stockMode === "allocate" ? "Allocate from main stock" : "Manual event stock"}</strong>
              </div>
            </div>
            <button
              className={reviewState.stockReviewed ? "secondary-button" : "primary-button"}
              disabled={!isScopedToEvent}
              onClick={() => setReviewState((current) => ({ ...current, stockReviewed: !current.stockReviewed }))}
              type="button"
            >
              {reviewState.stockReviewed ? "Stock review confirmed" : "Confirm remaining stock"}
            </button>
          </div>

          <div className={`closing-step-card${reviewState.paymentReviewed ? " is-complete" : ""}`}>
            <div className="panel-head">
              <div>
                <p className="eyebrow">Step 3</p>
                <h3>Rekonsiliasi pembayaran</h3>
              </div>
              <span className="badge-soft">Finance check</span>
            </div>
            <div className="summary-box closing-summary-box">
              {Object.entries(paymentSummary).map(([method, total]) => (
                <div key={method} className="summary-row">
                  <span className="muted-text">{method.toUpperCase()}</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              ))}
              <div className="summary-row">
                <span className="muted-text">Total Semua Metode</span>
                <strong>{formatCurrency(paymentGrandTotal)}</strong>
              </div>
              <div className="summary-row total">
                <span className="muted-text">Transaksi</span>
                <strong>{sales.length}</strong>
              </div>
            </div>
            <button
              className={reviewState.paymentReviewed ? "secondary-button" : "primary-button"}
              disabled={!isScopedToEvent}
              onClick={() => setReviewState((current) => ({ ...current, paymentReviewed: !current.paymentReviewed }))}
              type="button"
            >
              {reviewState.paymentReviewed ? "Payment review confirmed" : "Confirm payment reconciliation"}
            </button>
          </div>
        </article>

        <aside className="event-closing-sidebar">
          <article className="panel-card event-closing-summary-panel">
            <div className="panel-head">
              <div>
                <h2>Closing summary</h2>
                <p className="muted-text">A compact operational snapshot for the event close.</p>
              </div>
              <span className="badge-soft">{formatStatus(event.status)}</span>
            </div>

            <div className="summary-box closing-summary-box">
              <div className="summary-row">
                <span className="muted-text">Sales reviewed</span>
                <strong>{sales.length}</strong>
              </div>
              <div className="summary-row">
                <span className="muted-text">Remaining units</span>
                <strong>{remainingUnits}</strong>
              </div>
              <div className="summary-row total">
                <span className="muted-text">Payment total</span>
                <strong>{formatCurrency(paymentGrandTotal)}</strong>
              </div>
            </div>
          </article>

          <article className="panel-card event-closing-summary-panel">
            <div className="panel-head">
              <div>
                <h2>Complete closing</h2>
                <p className="muted-text">
                  The event can only be closed after all three reviews are confirmed while this event is the active
                  workspace.
                </p>
              </div>
            </div>
            <div className="inline-actions event-closing-actions">
              <button
                className="primary-button"
                disabled={!closingReady || !isScopedToEvent || submitting}
                onClick={handleCloseEvent}
                type="button"
              >
                {submitting ? "Closing..." : "Close event"}
              </button>
              <Link className="secondary-button receipt-link-button" to={`/events/${event.id}`}>
                Back to detail
              </Link>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
