import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { buildEventRowSummary, buildEventWorkspaceSummary } from "../features/events/eventWorkspace";
import { getEventActionLabel } from "../features/events/eventHelpers";
import { formatDate } from "../utils/formatters";

function createEmptyEventDraft() {
  return {
    name: "",
    code: "",
    locationLabel: "",
    startsAt: "",
    endsAt: "",
    stockMode: "allocate",
    assignedUserIds: [],
  };
}

function normalizeEventPayload(draft) {
  return {
    name: draft.name.trim(),
    code: draft.code.trim().toUpperCase(),
    locationLabel: draft.locationLabel.trim(),
    startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : "",
    endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : "",
    stockMode: draft.stockMode,
    assignedUserIds: draft.assignedUserIds,
  };
}

function sortEventsByStart(left, right) {
  return new Date(right.startsAt || 0) - new Date(left.startsAt || 0);
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function EventsPage() {
  const navigate = useNavigate();
  const { createEvent, loadError, loading, users, workspaces } = usePosData();
  const [draft, setDraft] = useState(createEmptyEventDraft);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const eventUsers = useMemo(
    () => users.filter((user) => user.role === "admin" || user.role === "manager" || user.role === "cashier"),
    [users]
  );

  const events = useMemo(
    () => workspaces.filter((workspace) => workspace.type === "event").sort(sortEventsByStart),
    [workspaces]
  );

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return events;
    }

    return events.filter((event) => {
      const haystack = `${event.name} ${event.locationLabel} ${event.status} ${event.stockMode}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [events, query]);

  const summary = useMemo(() => buildEventWorkspaceSummary({ events: filteredEvents }), [filteredEvents]);

  const selectedEvent = useMemo(
    () => filteredEvents.find((event) => event.id === selectedId) ?? filteredEvents[0] ?? null,
    [filteredEvents, selectedId]
  );

  useEffect(() => {
    if (filteredEvents.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    const visibleSelected = filteredEvents.some((event) => event.id === selectedId);
    if (!visibleSelected) {
      setSelectedId(filteredEvents[0].id);
    }
  }, [filteredEvents, selectedId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const result = await createEvent(normalizeEventPayload(draft));

    if (!result.ok) {
      setMessage(result.message);
      setSubmitting(false);
      return;
    }

    setDraft(createEmptyEventDraft());
    setMessage("Event draft created.");
    setSubmitting(false);
    navigate(`/events/${result.eventId}`);
  }

  function toggleAssignedUser(userId) {
    setDraft((current) => {
      const nextAssignedUserIds = current.assignedUserIds.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...current.assignedUserIds, userId];

      return {
        ...current,
        assignedUserIds: nextAssignedUserIds,
      };
    });
  }

  return (
    <div className="page-stack events-page events-workspace">
      <section className="page-header-card events-header-bar">
        <div className="events-header-copy">
          <p className="eyebrow">Events</p>
          <h1>Event operations workspace</h1>
          <p className="muted-text">
            Draft, search, and govern bazaar workspaces in a denser list/detail layout built for operational use.
          </p>
        </div>

        <div className="events-header-meta">
          <span className="badge-soft">{summary.totalEvents} total</span>
          <span className="badge-soft">{summary.draftEvents} draft</span>
          <span className="badge-soft">{summary.activeEvents} active</span>
          <span className="badge-soft">{summary.closedEvents} closed</span>
        </div>
      </section>

      {loading ? <p className="info-text">Loading events...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="info-text">{message}</p> : null}

      <section className="panel-card events-toolbar events-toolbar-flat">
        <div className="events-toolbar-controls">
          <label className="field events-search-field">
            <span>Search event</span>
            <input
              value={query}
              onChange={(inputEvent) => setQuery(inputEvent.target.value)}
              placeholder="Bazar, Senayan, active, allocate"
            />
          </label>
        </div>

        <div className="events-toolbar-summary">
          <div className="events-kpi">
            <span className="stat-label">Visible</span>
            <strong>{filteredEvents.length}</strong>
          </div>
          <div className="events-kpi">
            <span className="stat-label">Active</span>
            <strong>{summary.activeEvents}</strong>
          </div>
          <div className="events-kpi">
            <span className="stat-label">Draft</span>
            <strong>{summary.draftEvents}</strong>
          </div>
        </div>
      </section>

      <section className="content-grid events-layout">
        <article className="panel-card events-list-panel">
          <div className="panel-head events-list-head">
            <div>
              <h2>Event list</h2>
              <p className="muted-text">Search, open, and govern workspace events from one table-style surface.</p>
            </div>
            <span className="badge-soft">{filteredEvents.length} visible</span>
          </div>

          <div className="events-table">
            <div className="events-table-head">
              <span>Event</span>
              <span>Stock mode</span>
              <span>Start</span>
              <span>Status</span>
            </div>

            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const row = buildEventRowSummary(event);
                const isSelected = event.id === selectedEvent?.id;

                return (
                  <button
                    className={`event-row-button${isSelected ? " is-selected" : ""}`}
                    key={event.id}
                    onClick={() => setSelectedId(event.id)}
                    type="button"
                  >
                    <div className="event-row-primary">
                      <strong>{row.title}</strong>
                      <p className="muted-text">{row.subtitle}</p>
                    </div>
                    <span>{row.stockModeLabel}</span>
                    <span className="muted-text">{event.startsAt ? formatDate(event.startsAt) : "-"}</span>
                    <span className={`badge-soft status-${event.status}`}>{row.statusLabel}</span>
                  </button>
                );
              })
            ) : (
              <p className="stack-empty">No event matches this filter yet.</p>
            )}
          </div>
        </article>

        <aside className="events-sidebar-stack">
          <article className="panel-card events-draft-panel">
            <div className="panel-head events-panel-head">
              <div>
                <p className="eyebrow">Create</p>
                <h2>Draft event</h2>
              </div>
              <span className="badge-soft">Draft first</span>
            </div>

            <form className="form-stack events-form" onSubmit={handleSubmit}>
              <div className="dual-fields">
                <label className="field">
                  <span>Event name</span>
                  <input
                    value={draft.name}
                    onChange={(inputEvent) => setDraft((current) => ({ ...current, name: inputEvent.target.value }))}
                    placeholder="Bazar PIK Avenue"
                  />
                </label>

                <label className="field">
                  <span>Event code</span>
                  <input
                    value={draft.code}
                    onChange={(inputEvent) => setDraft((current) => ({ ...current, code: inputEvent.target.value }))}
                    placeholder="PIK-APR"
                  />
                </label>
              </div>

              <label className="field">
                <span>Location</span>
                <input
                  value={draft.locationLabel}
                  onChange={(inputEvent) => setDraft((current) => ({ ...current, locationLabel: inputEvent.target.value }))}
                  placeholder="PIK Avenue, Jakarta"
                />
              </label>

              <div className="dual-fields">
                <label className="field">
                  <span>Starts at</span>
                  <input
                    type="datetime-local"
                    value={draft.startsAt}
                    onChange={(inputEvent) =>
                      setDraft((current) => ({ ...current, startsAt: inputEvent.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Ends at</span>
                  <input
                    type="datetime-local"
                    value={draft.endsAt}
                    onChange={(inputEvent) => setDraft((current) => ({ ...current, endsAt: inputEvent.target.value }))}
                  />
                </label>
              </div>

              <label className="field">
                <span>Stock mode</span>
                <select
                  value={draft.stockMode}
                  onChange={(inputEvent) => setDraft((current) => ({ ...current, stockMode: inputEvent.target.value }))}
                >
                  <option value="allocate">Allocate from main stock</option>
                  <option value="manual">Manual event stock</option>
                </select>
              </label>

              <div className="summary-box events-draft-summary">
                <div className="summary-row">
                  <span className="muted-text">Selected stock mode</span>
                  <strong>{getEventActionLabel(draft.stockMode)}</strong>
                </div>
                <p className="muted-text">
                  This mode will apply to the full event so the stock flow stays consistent for the team.
                </p>
              </div>

              <div className="field">
                <span>Assign team</span>
                <div className="event-user-grid">
                  {eventUsers.map((user) => (
                    <label className="checkbox-card" key={user.id}>
                      <input
                        checked={draft.assignedUserIds.includes(user.id)}
                        type="checkbox"
                        onChange={() => toggleAssignedUser(user.id)}
                      />
                      <span>
                        <strong>{user.name}</strong>
                        <small className="muted-text">
                          @{user.username} · {user.role}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? "Saving..." : "Create event draft"}
              </button>
            </form>
          </article>

          <article className="panel-card events-detail-panel">
            <div className="panel-head events-panel-head">
              <div>
                <p className="eyebrow">Selected</p>
                <h2>{selectedEvent ? selectedEvent.name : "No event selected"}</h2>
              </div>
              {selectedEvent ? <span className={`badge-soft status-${selectedEvent.status}`}>{formatStatus(selectedEvent.status)}</span> : null}
            </div>

            {selectedEvent ? (
              <>
                <div className="summary-box events-detail-summary">
                  <div className="summary-row">
                    <span className="muted-text">Location</span>
                    <strong>{selectedEvent.locationLabel || "-"}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="muted-text">Stock mode</span>
                    <strong>{buildEventRowSummary(selectedEvent).stockModeLabel}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="muted-text">Start</span>
                    <strong>{selectedEvent.startsAt ? formatDate(selectedEvent.startsAt) : "-"}</strong>
                  </div>
                  <div className="summary-row total">
                    <span className="muted-text">Team</span>
                    <strong>{selectedEvent.assignedUserIds.length} users</strong>
                  </div>
                </div>

                <div className="inline-actions events-detail-actions">
                  <Link className="primary-button receipt-link-button" to={`/events/${selectedEvent.id}`}>
                    Open detail
                  </Link>
                  <span className="badge-soft">{getEventActionLabel(selectedEvent.stockMode)}</span>
                </div>
              </>
            ) : (
              <p className="stack-empty">Select an event from the list to inspect its operational detail.</p>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
