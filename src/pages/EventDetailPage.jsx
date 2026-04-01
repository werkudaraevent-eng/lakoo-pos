import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { buildEventRowSummary } from "../features/events/eventWorkspace";
import { canTransitionEvent, getEventActionLabel } from "../features/events/eventHelpers";
import { formatDate } from "../utils/formatters";

const EVENT_STATUSES = ["draft", "active", "closed", "archived"];

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function EventDetailPage() {
  const { eventId } = useParams();
  const { loadError, loading, updateEventStatus, users, workspaces } = usePosData();
  const [message, setMessage] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState("");
  const event = workspaces.find((workspace) => workspace.id === eventId && workspace.type === "event") ?? null;

  const assignedUsers = useMemo(() => {
    if (!event) {
      return [];
    }

    return users.filter((user) => event.assignedUserIds.includes(user.id));
  }, [event, users]);

  const availableTransitions = useMemo(() => {
    if (!event) {
      return [];
    }

    return EVENT_STATUSES.filter((status) => status !== "closed" && canTransitionEvent(event.status, status));
  }, [event]);

  async function handleStatusUpdate(nextStatus) {
    if (!event) {
      return;
    }

    setSubmittingStatus(nextStatus);
    setMessage("");

    const result = await updateEventStatus(event.id, nextStatus);

    if (!result.ok) {
      setMessage(result.message);
      setSubmittingStatus("");
      return;
    }

    setMessage(`Event moved to ${formatStatus(nextStatus)}.`);
    setSubmittingStatus("");
  }

  if (loading && !event) {
    return <p className="info-text">Loading event...</p>;
  }

  if (loadError && !event) {
    return <p className="error-text">{loadError}</p>;
  }

  if (!event) {
    return (
      <div className="page-stack">
        <section className="page-header-card narrow-card">
          <p className="eyebrow">Events</p>
          <h1>Event not found.</h1>
          <p className="muted-text">The requested workspace event is missing or not available for this account.</p>
          <div className="inline-actions">
            <Link className="primary-button receipt-link-button" to="/events">
              Back to events
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const rowSummary = buildEventRowSummary(event);

  return (
    <div className="page-stack event-detail-workspace">
      <section className="page-header-card event-detail-header event-detail-header-flat">
        <div className="event-detail-copy">
          <p className="eyebrow">Event detail</p>
          <h1>{event.name}</h1>
          <p className="muted-text">
            {event.locationLabel || "Location pending"} · {formatDate(event.startsAt)} until {formatDate(event.endsAt)}
          </p>
        </div>

        <div className="event-detail-meta">
          <span className={`badge-soft status-${event.status}`}>{formatStatus(event.status)}</span>
          <span className="badge-soft">{rowSummary.stockModeLabel}</span>
        </div>
      </section>

      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="info-text">{message}</p> : null}

      <section className="content-grid event-detail-layout">
        <article className="panel-card event-detail-panel">
          <div className="panel-head event-panel-head">
            <div>
              <h2>Workspace setup</h2>
              <p className="muted-text">Lifecycle, location, and stock mode information for this event.</p>
            </div>
            <span className="badge-soft">{event.id}</span>
          </div>

          <div className="summary-box event-detail-summary">
            <div className="summary-row">
              <span className="muted-text">Location</span>
              <strong>{event.locationLabel || "-"}</strong>
            </div>
            <div className="summary-row">
              <span className="muted-text">Starts</span>
              <strong>{formatDate(event.startsAt)}</strong>
            </div>
            <div className="summary-row">
              <span className="muted-text">Ends</span>
              <strong>{formatDate(event.endsAt)}</strong>
            </div>
            <div className="summary-row total">
              <span className="muted-text">Team</span>
              <strong>{assignedUsers.length} users</strong>
            </div>
          </div>

          <div className="event-stock-panel event-stock-panel-flat">
            <p className="eyebrow">Stock setup</p>
            <h3>{rowSummary.stockModeLabel}</h3>
            <p className="muted-text">
              {event.stockMode === "allocate"
                ? "This event will pull stock from the main store allocation flow before it goes live."
                : "This event will manage an isolated event stock count without automatic deduction from the main store."}
            </p>
          </div>

          <div className="summary-box event-lifecycle-summary">
            <div className="summary-row">
              <span className="muted-text">Draft</span>
              <strong>Setup event data and assigned team</strong>
            </div>
            <div className="summary-row">
              <span className="muted-text">Active</span>
              <strong>Checkout and stock activity are live</strong>
            </div>
            <div className="summary-row">
              <span className="muted-text">Closed</span>
              <strong>Await closing review and reconciliation</strong>
            </div>
            <div className="summary-row total">
              <span className="muted-text">Archived</span>
              <strong>Read-only event history</strong>
            </div>
          </div>
        </article>

        <aside className="event-detail-sidebar">
          <article className="panel-card event-actions-panel">
            <div className="panel-head event-panel-head">
              <div>
                <h2>Status actions</h2>
                <p className="muted-text">Lifecycle changes are intentionally dense and tool-like.</p>
              </div>
              <span className="badge-soft">{availableTransitions.length + (event.status === "active" ? 1 : 0)} next steps</span>
            </div>

            {availableTransitions.length > 0 || event.status === "active" ? (
              <div className="event-action-stack">
                {event.status === "active" ? (
                  <Link className="primary-button receipt-link-button event-action-button" to={`/events/${event.id}/close`}>
                    Open closing review
                  </Link>
                ) : null}
                {availableTransitions.map((status) => (
                  <button
                    className="secondary-button event-action-button"
                    disabled={submittingStatus === status}
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    type="button"
                  >
                    {submittingStatus === status ? "Saving..." : `Move to ${formatStatus(status)}`}
                  </button>
                ))}
              </div>
            ) : (
              <p className="stack-empty">No direct lifecycle action is available from the current status.</p>
            )}
          </article>

          <article className="panel-card event-actions-panel">
            <div className="panel-head event-panel-head">
              <div>
                <h2>Assigned users</h2>
                <p className="muted-text">Current team attached to this event workspace.</p>
              </div>
              <span className="badge-soft">{assignedUsers.length} people</span>
            </div>

            <div className="stack-list event-assigned-list">
              {assignedUsers.length > 0 ? (
                assignedUsers.map((user) => (
                  <div className="list-row event-assigned-row" key={user.id}>
                    <div>
                      <strong>{user.name}</strong>
                      <p className="muted-text">@{user.username}</p>
                    </div>
                    <span className="role-pill">{user.role}</span>
                  </div>
                ))
              ) : (
                <p className="stack-empty">No users are assigned to this event yet.</p>
              )}
            </div>
          </article>

          <article className="panel-card event-actions-panel">
            <div className="panel-head event-panel-head">
              <div>
                <h2>Current row summary</h2>
                <p className="muted-text">Compact labels reused by the event table.</p>
              </div>
            </div>

            <div className="summary-box event-row-summary">
              <div className="summary-row">
                <span className="muted-text">Title</span>
                <strong>{rowSummary.title}</strong>
              </div>
              <div className="summary-row">
                <span className="muted-text">Subtitle</span>
                <strong>{rowSummary.subtitle}</strong>
              </div>
              <div className="summary-row total">
                <span className="muted-text">Status</span>
                <strong>{rowSummary.statusLabel}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
