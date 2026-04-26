import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { usePosData } from "../context/PosDataContext";
import { buildEventRowSummary, buildEventWorkspaceSummary } from "../features/events/eventWorkspace";
import { AppIcon } from "../features/ui/AppIcon";
import "../features/events/events.css";

function sortEventsByStart(left, right) {
  return new Date(right.startsAt || 0) - new Date(left.startsAt || 0);
}

function formatDateLabel(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateRange(startsAt, endsAt) {
  const startLabel = formatDateLabel(startsAt);
  const endLabel = formatDateLabel(endsAt);

  if (startLabel === "-" && endLabel === "-") {
    return "-";
  }

  return `${startLabel} - ${endLabel}`;
}

function formatStatusLabel(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusTone(status) {
  if (status === "active") {
    return "status-active";
  }

  if (status === "draft") {
    return "status-draft";
  }

  return "status-closed";
}

function getEventRevenueValue(event) {
  const candidates = [event?.revenueTotal, event?.totalRevenue, event?.revenue];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function formatCurrencyCell(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getEventStockSnapshot(event) {
  const candidates = [event?.allocatedStock, event?.allocatedItems, event?.stockAllocated];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return `${parsed} items`;
    }
  }

  return event?.stockMode === "allocate" ? "Allocated flow" : "Manual flow";
}

export function EventsPage() {
  const { loadError, loading, workspaces } = usePosData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const events = useMemo(
    () => workspaces.filter((workspace) => workspace.type === "event").sort(sortEventsByStart),
    [workspaces]
  );

  const filteredEvents = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = `${event.name} ${event.locationLabel} ${event.code} ${event.status}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [events, query, statusFilter]);

  const summary = useMemo(() => buildEventWorkspaceSummary({ events }), [events]);
  const ytdRevenue = useMemo(
    () => events.reduce((sum, event) => sum + (getEventRevenueValue(event) ?? 0), 0),
    [events]
  );

  return (
    <div className="events-banani-page">
      <div className="page-actions">
        <div className="events-banani-metrics">
          <div className="events-banani-metric">
            <span className="events-banani-metric-label">Active Events</span>
            <span className="events-banani-metric-value">{summary.activeEvents}</span>
          </div>
          <div className="events-banani-metric">
            <span className="events-banani-metric-label">Upcoming</span>
            <span className="events-banani-metric-value">{summary.draftEvents}</span>
          </div>
          <div className="events-banani-metric is-primary">
            <span className="events-banani-metric-label">YTD Event Revenue</span>
            <span className="events-banani-metric-value">{formatCurrencyCell(ytdRevenue)}</span>
          </div>
        </div>
      </div>

      {loading ? <p className="info-text">Loading events...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="events-banani-card">
        <div className="events-banani-toolbar">
          <label className="events-banani-search" htmlFor="events-search">
            <span className="events-banani-search-icon" aria-hidden="true">
              <AppIcon name="Search" size={16} strokeWidth={1.9} />
            </span>
            <Input
              className="events-banani-search-input"
              id="events-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search event name or location"
              value={query}
            />
          </label>

          <label className="events-banani-filter">
            <span className="events-banani-filter-icon" aria-hidden="true">
              <AppIcon name="Filter" size={16} strokeWidth={1.9} />
            </span>
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All status</option>
              <option value="draft">Upcoming</option>
              <option value="active">Active</option>
              <option value="closed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <span className="events-banani-filter-chevron" aria-hidden="true">
              <AppIcon name="ChevronDown" size={16} strokeWidth={1.9} />
            </span>
          </label>

          <div className="events-banani-toolbar-spacer" />

          <Button asChild className="events-banani-new" size="sm" variant="default">
            <Link to="/events/new">
              <AppIcon name="Plus" size={16} strokeWidth={2} />
              <span>New Event</span>
            </Link>
          </Button>
        </div>

        <div className="events-banani-table-wrap">
          <table className="events-banani-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Dates</th>
                <th>Location</th>
                <th>Status</th>
                <th>Stock Flow</th>
                <th>Total Revenue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const row = buildEventRowSummary(event);
                  return (
                    <tr key={event.id}>
                      <td>
                        <div className="events-banani-name">
                          <strong>{row.title}</strong>
                          <span className="events-banani-subtitle">{event.code || row.stockModeLabel}</span>
                        </div>
                      </td>
                      <td className="events-banani-muted">{formatDateRange(event.startsAt, event.endsAt)}</td>
                      <td className="events-banani-muted">{event.locationLabel || "-"}</td>
                      <td>
                        <Badge className={`events-banani-badge ${getStatusTone(event.status)}`} variant="secondary">
                          {formatStatusLabel(event.status)}
                        </Badge>
                      </td>
                      <td className="events-banani-muted">{getEventStockSnapshot(event)}</td>
                      <td className="events-banani-revenue">{formatCurrencyCell(getEventRevenueValue(event))}</td>
                      <td>
                        <Button asChild className="events-banani-open" size="sm" variant="outline">
                          <Link to={`/events/${event.id}`}>Open detail</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="events-banani-empty-row">
                  <td colSpan={7}>
                    <div className="events-banani-empty">No event matches this filter yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
