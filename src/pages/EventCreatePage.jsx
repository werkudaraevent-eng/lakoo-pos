import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { usePosData } from "../context/PosDataContext";
import { getEventActionLabel } from "../features/events/eventHelpers";
import "../features/events/events.css";

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

export function EventCreatePage() {
  const navigate = useNavigate();
  const { createEvent, loadError, users } = usePosData();
  const [draft, setDraft] = useState(createEmptyEventDraft);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const eventUsers = useMemo(
    () => users.filter((user) => user.role === "admin" || user.role === "manager" || user.role === "cashier"),
    [users]
  );

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

    navigate(`/events/${result.eventId}`);
  }

  return (
    <div className="event-create-page">
      <section className="page-header-card">
        <p className="eyebrow">Events</p>
        <h1>Create event</h1>
        <p className="muted-text">
          Draft a new event workspace, assign the team, and decide how stock should flow before the event goes live.
        </p>
        <div className="event-create-actions">
          <Button asChild size="sm" variant="outline">
            <Link to="/events">Back to events</Link>
          </Button>
        </div>
      </section>

      {loadError ? <p className="error-text">{loadError}</p> : null}
      {message ? <p className="error-text">{message}</p> : null}

      <section className="panel-card">
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="dual-fields">
            <label className="field">
              <span>Event name</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Bazar PIK Avenue"
                value={draft.name}
              />
            </label>

            <label className="field">
              <span>Event code</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))}
                placeholder="PIK-APR"
                value={draft.code}
              />
            </label>
          </div>

          <label className="field">
            <span>Location</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, locationLabel: event.target.value }))}
              placeholder="PIK Avenue, Jakarta"
              value={draft.locationLabel}
            />
          </label>

          <div className="dual-fields">
            <label className="field">
              <span>Starts at</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))}
                type="datetime-local"
                value={draft.startsAt}
              />
            </label>

            <label className="field">
              <span>Ends at</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))}
                type="datetime-local"
                value={draft.endsAt}
              />
            </label>
          </div>

          <label className="field">
            <span>Stock mode</span>
            <select
              onChange={(event) => setDraft((current) => ({ ...current, stockMode: event.target.value }))}
              value={draft.stockMode}
            >
              <option value="allocate">Allocate from main stock</option>
              <option value="manual">Manual event stock</option>
            </select>
          </label>

          <div className="event-create-summary">
            <div className="summary-row">
              <span className="muted-text">Selected stock mode</span>
              <strong>{getEventActionLabel(draft.stockMode)}</strong>
            </div>
            <p className="muted-text">This mode applies to the full event so stock flow stays consistent across the team.</p>
          </div>

          <div className="event-create-users">
            <span className="field">
              <span>Assign team</span>
            </span>
            <div className="event-create-user-grid">
              {eventUsers.map((user) => (
                <label className="event-create-user-card" key={user.id}>
                  <input
                    checked={draft.assignedUserIds.includes(user.id)}
                    onChange={() => toggleAssignedUser(user.id)}
                    type="checkbox"
                  />
                  <span className="event-create-user-copy">
                    <strong>{user.name}</strong>
                    <small className="muted-text">
                      @{user.username} · {user.role}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button disabled={submitting} type="submit">
            {submitting ? "Saving..." : "Create event draft"}
          </Button>
        </form>
      </section>
    </div>
  );
}
