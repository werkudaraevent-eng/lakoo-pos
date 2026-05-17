import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { useAuth } from "../context/AuthContext";
import { useUpgradeConfig } from "../hooks/useUpgradeConfig";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

const STATUS_META = {
  draft: { label: "Draft", color: "gray" },
  active: { label: "Aktif", color: "green" },
  closed: { label: "Ditutup", color: "amber" },
  archived: { label: "Diarsipkan", color: "gray" },
};

function EventCard({ event, sales, dimmed }) {
  const navigate = useNavigate();

  const eventSales = (sales || []).filter((s) => s.workspaceId === event.id);
  const revenue = eventSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const transactions = eventSales.length;

  const meta = STATUS_META[event.status] || STATUS_META.draft;

  return (
    <div
      className="card card-sm"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        opacity: dimmed ? 0.6 : 1,
        transition: "all 0.15s",
      }}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Calendar icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--accent-soft, var(--accent-bg))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="22"
          height="22"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{event.name}</span>
          <span className={`badge badge-${meta.color}`}>{meta.label}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.4 }}>
          {event.locationLabel || "Lokasi belum diatur"}
          {event.startsAt &&
            ` · ${new Date(event.startsAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
          {event.endsAt &&
            ` – ${new Date(event.endsAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
        </div>
      </div>

      {/* Revenue & Transactions */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{formatCurrency(revenue)}</div>
        <div style={{ fontSize: 12, color: "var(--text-soft)" }}>{transactions} transaksi</div>
      </div>

      {/* Chevron */}
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        style={{ flexShrink: 0 }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

export function EventsPage() {
  const { workspaces, sales } = usePosData();
  const { user } = useAuth();
  const { config: upgradeConfig } = useUpgradeConfig();
  const workspaceLimit = user?.planLimits?.workspaces;
  const workspaceCount = (workspaces || []).length;
  const isWorkspaceFull = workspaceLimit > 0 && workspaceCount >= workspaceLimit;

  const events = useMemo(
    () => (workspaces || []).filter((ws) => ws.type === "event"),
    [workspaces]
  );

  const activeEvents = useMemo(
    () => events.filter((e) => e.status === "draft" || e.status === "active"),
    [events]
  );

  const archivedEvents = useMemo(
    () => events.filter((e) => e.status === "closed" || e.status === "archived"),
    [events]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Usage indicator */}
      {workspaceLimit && workspaceLimit > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: workspaceCount >= workspaceLimit ? "var(--danger-soft, #fef2f2)" : "var(--surface)", borderRadius: 8, border: workspaceCount >= workspaceLimit ? "1px solid var(--danger, #b54343)" : "1px solid var(--line)", fontSize: 12.5 }}>
          <span style={{ fontWeight: 700, color: workspaceCount >= workspaceLimit ? "var(--danger, #b54343)" : "var(--text)" }}>
            {workspaceCount} / {workspaceLimit}
          </span>
          <span style={{ color: "var(--text-soft)" }}>Lokasi</span>
          {workspaceCount >= workspaceLimit && (
            <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--danger, #b54343)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              Kuota penuh
              {upgradeConfig.upgrade_url && (
                <a href={upgradeConfig.upgrade_url} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", background: "var(--danger, #b54343)", padding: "2px 10px", borderRadius: 4, textDecoration: "none", fontSize: 11 }}>
                  Upgrade →
                </a>
              )}
            </span>
          )}
          {workspaceCount < workspaceLimit && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>Paket {user?.tenant?.plan || "trial"}</span>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-soft)" }}>
          {events.length} event terdaftar
        </span>
        {isWorkspaceFull ? (
          <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
            Buat Event Baru
          </button>
        ) : (
          <Link to="/events/new" className="btn btn-primary">
            Buat Event Baru
          </Link>
        )}
      </div>

      {/* Active Events Section */}
      {activeEvents.length > 0 && (
        <div>
          <div className="section-title">Event Aktif</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeEvents.map((event) => (
              <EventCard key={event.id} event={event} sales={sales} />
            ))}
          </div>
        </div>
      )}

      {/* Archived Events Section */}
      {archivedEvents.length > 0 && (
        <div>
          <div className="section-title" style={{ color: "var(--text-soft)" }}>
            Riwayat Event
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {archivedEvents.map((event) => (
              <EventCard key={event.id} event={event} sales={sales} dimmed />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 12 }}>
            Belum ada event. Buat event pertama untuk mulai berjualan di bazar.
          </div>
          {isWorkspaceFull ? (
            <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Buat Event Baru
            </button>
          ) : (
            <Link to="/events/new" className="btn btn-primary">
              Buat Event Baru
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
