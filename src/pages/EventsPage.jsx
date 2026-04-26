import { useMemo } from "react";
import { Link } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

const statusMeta = {
  draft: { label: "Draft", cls: "badge-gray" },
  active: { label: "Aktif", cls: "badge-green" },
  closed: { label: "Selesai", cls: "badge-gray" },
  archived: { label: "Arsip", cls: "badge-gray" },
};

export function EventsPage() {
  const { workspaces, sales, loading, loadError } = usePosData();

  const events = useMemo(() => {
    return (workspaces || [])
      .filter((w) => w.type === "event")
      .map((ev) => {
        const evSales = (sales || []).filter((s) => s.workspaceId === ev.id);
        const revenue = evSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
        return { ...ev, revenue, transactions: evSales.length };
      });
  }, [workspaces, sales]);

  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      {/* Header */}
      <div className="row-between mb-16">
        <div>
          <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{events.length} event terdaftar</div>
        </div>
        <Link to="/events/new" className="btn btn-primary" style={{ textDecoration: "none" }}>
          + Buat Event Baru
        </Link>
      </div>

      {/* Event list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {events.map((ev) => {
          const meta = statusMeta[ev.status] || statusMeta.draft;
          return (
            <Link
              to={`/events/${ev.id}`}
              key={ev.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 20px", cursor: "pointer", textDecoration: "none", color: "inherit", transition: "box-shadow 0.15s" }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{ev.name}</span>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  {ev.locationLabel || "Lokasi belum ditentukan"}
                  {ev.startsAt ? ` · ${new Date(ev.startsAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  {ev.endsAt ? ` – ${new Date(ev.endsAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{formatCurrency(ev.revenue)}</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>{ev.transactions} transaksi</div>
              </div>
              <div style={{ color: "var(--text-muted)", marginLeft: 4 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </Link>
          );
        })}
        {!loading && events.length === 0 ? (
          <div className="empty-state">
            <p style={{ marginBottom: 8 }}>Belum ada event</p>
            <Link to="/events/new" className="btn btn-primary" style={{ textDecoration: "none" }}>+ Buat Event Baru</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
