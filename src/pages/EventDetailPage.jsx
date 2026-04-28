import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { formatDate } from "../utils/formatters";

const ROLE_LABELS = {
  admin: "Admin Utama",
  manager: "Manager",
  cashier: "Kasir",
};

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "amber" },
  active: { label: "Aktif", color: "green" },
  closed: { label: "Ditutup", color: "gray" },
  archived: { label: "Diarsipkan", color: "gray" },
};

const labelStyle = { fontSize: 12, color: "var(--text-soft)", marginBottom: 4, fontWeight: 500 };

function toInputDatetime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const {
    loadError,
    loading,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    updateWorkspaceAssignments,
    users,
    workspaces,
  } = usePosData();

  const event = workspaces.find((ws) => ws.id === eventId && ws.type === "event") ?? null;

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamUserIds, setTeamUserIds] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const assignedUsers = useMemo(() => {
    if (!event) return [];
    return users.filter((u) => (event.assignedUserIds || []).includes(u.id));
  }, [event, users]);

  const isAdmin = currentUser?.role === "admin";
  const canEdit = event && (event.status === "draft" || event.status === "active");
  const statusCfg = STATUS_CONFIG[event?.status] || { label: "Unknown", color: "gray" };

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (editing && event) {
      setEditForm({
        name: event.name || "",
        locationLabel: event.locationLabel || "",
        startsAt: toInputDatetime(event.startsAt),
        endsAt: toInputDatetime(event.endsAt),
        stockMode: event.stockMode || "manual",
      });
    }
  }, [editing, event?.id]);

  // Initialize team user IDs when opening team modal
  useEffect(() => {
    if (editingTeam && event) {
      setTeamUserIds([...(event.assignedUserIds || [])]);
    }
  }, [editingTeam, event?.id]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(type, message) {
    setToast({ type, message });
  }

  async function handleSaveInfo() {
    if (!event) return;
    setSaving(true);
    try {
      const payload = {
        name: editForm.name,
        locationLabel: editForm.locationLabel,
        startsAt: editForm.startsAt ? new Date(editForm.startsAt).toISOString() : event.startsAt,
        endsAt: editForm.endsAt ? new Date(editForm.endsAt).toISOString() : event.endsAt,
        stockMode: editForm.stockMode,
      };
      const result = await updateEvent(eventId, payload);
      if (!result.ok) {
        showToast("error", result.message || "Gagal menyimpan perubahan.");
      } else {
        showToast("success", "Informasi event berhasil diperbarui.");
        setEditing(false);
      }
    } catch (err) {
      showToast("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function saveTeam() {
    if (!event) return;
    setSaving(true);
    try {
      const result = await updateWorkspaceAssignments(eventId, teamUserIds);
      if (!result.ok) {
        showToast("error", result.message || "Gagal menyimpan tim.");
      } else {
        showToast("success", "Tim event berhasil diperbarui.");
        setEditingTeam(false);
      }
    } catch (err) {
      showToast("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    if (!event) return;
    setSaving(true);
    try {
      const result = await updateEventStatus(eventId, nextStatus);
      if (!result.ok) {
        showToast("error", result.message || "Gagal mengubah status.");
      } else {
        const label = STATUS_CONFIG[nextStatus]?.label || nextStatus;
        showToast("success", `Status event diubah ke ${label}.`);
      }
    } catch (err) {
      showToast("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setSaving(true);
    try {
      const result = await deleteEvent(eventId);
      if (!result.ok) {
        showToast("error", result.message || "Gagal mengarsipkan event.");
        setDeleteConfirm(false);
      } else {
        navigate("/events");
      }
    } catch (err) {
      showToast("error", err.message || "Terjadi kesalahan.");
      setDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleTeamUser(userId) {
    setTeamUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  // --- Loading / Error / Not Found ---

  if (loading && !event) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-soft)" }}>
        Memuat event...
      </div>
    );
  }

  if (loadError && !event) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--danger)" }}>
        {loadError}
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Event tidak ditemukan</div>
        <div style={{ fontSize: 14, color: "var(--text-soft)", marginBottom: 20 }}>
          Event yang diminta tidak tersedia atau sudah dihapus.
        </div>
        <Link to="/events" className="btn btn-primary">
          Kembali ke Event
        </Link>
      </div>
    );
  }

  // --- Main Render ---

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 860, width: "100%" }}>
      {/* Header */}
      <div>
        <Link
          to="/events"
          style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}
        >
          <span style={{ fontSize: 16 }}>&larr;</span> Kembali ke Event
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "var(--text)" }}>
              {event.name}
            </h1>
            <span className={`badge badge-${statusCfg.color}`}>{statusCfg.label}</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canEdit && !editing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            )}
            {isAdmin && event.status !== "archived" && (
              <button
                className="btn btn-sm"
                style={{ background: "var(--danger-soft, #fde8e8)", color: "var(--danger, #b54343)", border: "1px solid transparent" }}
                onClick={() => setDeleteConfirm(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Arsipkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event Info Panel */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Informasi Event</div>

        {!editing ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={labelStyle}>Nama Event</div>
                <div style={{ fontWeight: 600 }}>{event.name}</div>
              </div>
              <div>
                <div style={labelStyle}>Lokasi</div>
                <div>{event.locationLabel || "-"}</div>
              </div>
              <div>
                <div style={labelStyle}>Mulai</div>
                <div>{formatDate(event.startsAt)}</div>
              </div>
              <div>
                <div style={labelStyle}>Selesai</div>
                <div>{formatDate(event.endsAt)}</div>
              </div>
              <div>
                <div style={labelStyle}>Mode Stok</div>
                <div>{event.stockMode === "allocate" ? "Alokasi Stok" : "Manual"}</div>
              </div>
              <div>
                <div style={labelStyle}>Status</div>
                <span className={`badge badge-${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={() => setEditing(true)}>
                Edit Informasi
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nama Event</label>
                <input
                  type="text"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Lokasi</label>
                <input
                  type="text"
                  value={editForm.locationLabel || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, locationLabel: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Mulai</label>
                <input
                  type="datetime-local"
                  value={editForm.startsAt || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, startsAt: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Selesai</label>
                <input
                  type="datetime-local"
                  value={editForm.endsAt || ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, endsAt: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Mode Stok</label>
                <select
                  value={editForm.stockMode || "manual"}
                  onChange={(e) => setEditForm((f) => ({ ...f, stockMode: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  <option value="manual">Manual</option>
                  <option value="allocate">Alokasi Stok</option>
                </select>
              </div>
              <div>
                <div style={labelStyle}>Status</div>
                <span className={`badge badge-${statusCfg.color}`}>{statusCfg.label}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveInfo}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Status Actions Panel */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Aksi Status</div>

        {event.status === "draft" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleStatusChange("active")}
              disabled={saving}
            >
              {saving ? "Memproses..." : "Aktifkan Event"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleStatusChange("archived")}
              disabled={saving}
            >
              Arsipkan
            </button>
          </div>
        )}

        {event.status === "active" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              to={`/events/${event.id}/close`}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Buka Review Penutupan
            </Link>
          </div>
        )}

        {event.status === "closed" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleStatusChange("archived")}
              disabled={saving}
            >
              {saving ? "Memproses..." : "Arsipkan"}
            </button>
          </div>
        )}

        {event.status === "archived" && (
          <div style={{ fontSize: 13, color: "var(--text-muted, var(--text-soft))", fontStyle: "italic", padding: "4px 0" }}>
            Event telah diarsipkan.
          </div>
        )}
      </div>

      {/* Tim / User Assignment Panel */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Tim Event ({assignedUsers.length} orang)</div>
          {canEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingTeam(true)}>
              Kelola Tim
            </button>
          )}
        </div>

        {assignedUsers.length > 0 ? (
          assignedUsers.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {u.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-soft)" }}>
                  @{u.username} &middot; {ROLE_LABELS[u.role] || u.role}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-muted, var(--text-soft))", fontStyle: "italic", padding: "12px 0" }}>
            Belum ada anggota tim. Klik &quot;Kelola Tim&quot; untuk menambahkan.
          </div>
        )}
      </div>

      {/* Team Edit Modal */}
      {editingTeam && (
        <div className="modal-overlay" onClick={() => setEditingTeam(false)}>
          <div className="modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Kelola Tim Event</div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {users.map((u) => (
                <label
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 8px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={teamUserIds.includes(u.id)}
                    onChange={() => toggleTeamUser(u.id)}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-soft)" }}>
                      @{u.username} &middot; {ROLE_LABELS[u.role] || u.role}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setEditingTeam(false)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={saveTeam}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Tim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div
            className="modal"
            style={{ width: 380, textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--danger-soft, #fde8e8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger, #b54343)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Arsipkan Event?</div>
            <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 20 }}>
              Event <strong>{event.name}</strong> akan diarsipkan dan tidak bisa diakses lagi.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirm(false)}
                disabled={saving}
              >
                Batal
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: "var(--danger, #b54343)", color: "#fff" }}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Memproses..." : "Arsipkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 200,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.type === "success" ? "var(--success, #4a9066)" : "var(--danger, #b54343)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            maxWidth: 400,
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.type === "success" ? "\u2713 " : "\u2717 "}
          {toast.message}
        </div>
      )}
    </div>
  );
}
