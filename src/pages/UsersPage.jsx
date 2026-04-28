import { useState } from "react";

import { usePosData } from "../context/PosDataContext";
import { useAuth } from "../context/AuthContext";
import { ConfirmModal } from "../components/ConfirmModal";

const ROLE_LABELS = {
  admin: "Admin Utama",
  manager: "Manager",
  cashier: "Kasir",
};

const ALL_FEATURES = [
  "Dashboard",
  "Kasir/POS",
  "Katalog Produk",
  "Manajemen Stok",
  "Riwayat Transaksi",
  "Laporan & Analitik",
  "Event & Bazar",
  "Promosi",
  "Pengaturan",
  "Pengguna",
];

const MANAGER_FEATURES = new Set([
  "Dashboard",
  "Kasir/POS",
  "Katalog Produk",
  "Manajemen Stok",
  "Riwayat Transaksi",
  "Laporan & Analitik",
  "Event & Bazar",
  "Promosi",
]);

const CASHIER_FEATURES = new Set([
  "Dashboard",
  "Kasir/POS",
  "Riwayat Transaksi",
]);

function managerHas(feature) {
  return MANAGER_FEATURES.has(feature);
}

function cashierHas(feature) {
  return CASHIER_FEATURES.has(feature);
}

function getPermissionsList(role) {
  if (role === "admin") return ALL_FEATURES.join(", ");
  if (role === "manager") return ALL_FEATURES.filter((f) => MANAGER_FEATURES.has(f)).join(", ");
  if (role === "cashier") return ALL_FEATURES.filter((f) => CASHIER_FEATURES.has(f)).join(", ");
  return "";
}

const EMPTY_FORM = {
  name: "",
  username: "",
  password: "",
  role: "cashier",
  workspaceIds: [],
};

export function UsersPage() {
  const { users, workspaces, createUser, updateUser, updateWorkspaceAssignments } = usePosData();
  const { user: currentUser } = useAuth();
  const [modal, setModal] = useState(null); // null | 'create' | user object (edit)
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const activeCount = users.filter((u) => u.isActive).length;
  const isEdit = modal !== null && modal !== "create";
  const editUser = isEdit ? modal : null;

  function openCreate() {
    // Pre-check all active store workspaces (server auto-assigns to stores)
    const storeIds = (workspaces || [])
      .filter(ws => ws.type === "store" && ws.status === "active" && ws.isVisible !== false)
      .map(ws => ws.id);
    setForm({ ...EMPTY_FORM, workspaceIds: storeIds });
    setModal("create");
  }

  function openEdit(u) {
    const assignedWsIds = (workspaces || [])
      .filter(ws => ws.assignedUserIds?.includes(u.id))
      .map(ws => ws.id);
    setForm({
      name: u.name,
      username: u.username,
      password: "",
      role: u.role,
      workspaceIds: assignedWsIds,
    });
    setModal(u);
  }

  async function toggleActive(u) {
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      showToast("success", `${u.name} berhasil ${u.isActive ? "dinonaktifkan" : "diaktifkan"}.`);
    } catch (error) {
      showToast("error", error.message);
    }
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);

    try {
      let targetUserId;
      if (isEdit) {
        const payload = { ...form };
        delete payload.workspaceIds;
        if (!payload.password) delete payload.password;
        await updateUser(editUser.id, payload);
        targetUserId = editUser.id;
      } else {
        const result = await createUser({ name: form.name, username: form.username, password: form.password, role: form.role });
        targetUserId = result.userId;
      }

      // Update workspace assignments for each workspace
      if (targetUserId && form.workspaceIds) {
        for (const ws of (workspaces || [])) {
          const currentlyAssigned = ws.assignedUserIds?.includes(targetUserId) || false;
          const shouldBeAssigned = form.workspaceIds.includes(ws.id);

          if (currentlyAssigned !== shouldBeAssigned) {
            const newUserIds = shouldBeAssigned
              ? [...(ws.assignedUserIds || []), targetUserId]
              : (ws.assignedUserIds || []).filter(id => id !== targetUserId);
            await updateWorkspaceAssignments(ws.id, newUserIds);
          }
        }
      }

      showToast("success", isEdit
        ? `Pengguna "${form.name}" berhasil diperbarui.`
        : `Pengguna "${form.name}" berhasil ditambahkan.`
      );
      setModal(null);
      setForm({ ...EMPTY_FORM });
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!isEdit || editUser.role === "admin") return;
    setDeleteConfirm(true);
  }

  async function doDelete() {
    setDeleteConfirm(false);
    setSaving(true);
    try {
      await updateUser(editUser.id, { isActive: false });
      setModal(null);
      setForm({ ...EMPTY_FORM });
      showToast("success", `${editUser.name} berhasil dihapus.`);
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setSaving(false);
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: 12.5,
    fontWeight: 700,
    color: "var(--text-2, var(--text-soft))",
    marginBottom: 6,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-soft)" }}>
          {activeCount} pengguna aktif
        </span>
        <button className="btn btn-primary" onClick={openCreate}>
          Tambah Pengguna
        </button>
      </div>

      {/* User Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map((u) => {
          const roleLabel = ROLE_LABELS[u.role] || u.role;
          return (
            <div
              className="card card-sm"
              key={u.id}
              style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  opacity: u.isActive ? 1 : 0.4,
                }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{u.name}</span>
                  <span className="badge badge-gray">{roleLabel}</span>
                  <span className={`badge badge-${u.isActive ? "green" : "red"}`}>
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-2, var(--text-soft))" }}>
                  @{u.username}
                </div>
                {/* Assigned workspaces */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {(workspaces || [])
                    .filter((ws) => ws.assignedUserIds?.includes(u.id))
                    .map((ws) => (
                      <span
                        key={ws.id}
                        className={`badge badge-${ws.type === "store" ? "amber" : "blue"}`}
                        style={{ fontSize: 10 }}
                      >
                        {ws.name}
                      </span>
                    ))}
                  {!(workspaces || []).some((ws) => ws.assignedUserIds?.includes(u.id)) && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Belum ada sesi
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                  Edit
                </button>
                {u.role !== "admin" && (
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                    {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permissions Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>Hak Akses per Role</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fitur</th>
                <th>Admin Utama</th>
                <th>Manager</th>
                <th>Kasir</th>
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((feature) => (
                <tr key={feature}>
                  <td style={{ fontWeight: 600 }}>{feature}</td>
                  <td style={{ color: "var(--green, var(--success))", fontSize: 16 }}>✓</td>
                  <td
                    style={{
                      color: managerHas(feature)
                        ? "var(--green, var(--success))"
                        : "var(--text-3, var(--text-muted))",
                      fontSize: managerHas(feature) ? 16 : 14,
                    }}
                  >
                    {managerHas(feature) ? "✓" : "—"}
                  </td>
                  <td
                    style={{
                      color: cashierHas(feature)
                        ? "var(--green, var(--success))"
                        : "var(--text-3, var(--text-muted))",
                      fontSize: cashierHas(feature) ? 16 : 14,
                    }}
                  >
                    {cashierHas(feature) ? "✓" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
          {toast.type === "success" ? "✓ " : "✗ "}
          {toast.message}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div
            className="modal"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title">
              {isEdit ? "Edit Pengguna" : "Tambah Pengguna"}
            </div>

            {/* Edit mode: user info strip */}
            {isEdit && editUser && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "var(--surface)",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {editUser.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{editUser.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2, var(--text-soft))" }}>
                    @{editUser.username}
                  </div>
                </div>
                <span
                  className={`badge badge-${editUser.isActive ? "green" : "red"}`}
                  style={{ marginLeft: "auto" }}
                >
                  {editUser.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            )}

            {/* Fields */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama Lengkap *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Username *</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                {isEdit ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}
              </label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="cashier">Kasir</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin Utama</option>
              </select>
            </div>

            {/* Role access preview */}
            <div
              style={{
                padding: "10px 14px",
                background: "var(--surface)",
                borderRadius: 8,
                fontSize: 12.5,
                color: "var(--text-2, var(--text-soft))",
                marginBottom: 20,
              }}
            >
              Akses {ROLE_LABELS[form.role] || form.role}: {getPermissionsList(form.role)}
            </div>

            {/* Workspace Assignment */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Akses Workspace</label>
              <div style={{
                border: '1px solid var(--line, var(--border))',
                borderRadius: 8,
                maxHeight: 200,
                overflowY: 'auto',
                padding: 8,
              }}>
                {(workspaces || []).filter(ws => ws.isVisible !== false).map((ws) => (
                  <label
                    key={ws.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.workspaceIds?.includes(ws.id) || false}
                      onChange={(e) => {
                        setForm(f => ({
                          ...f,
                          workspaceIds: e.target.checked
                            ? [...(f.workspaceIds || []), ws.id]
                            : (f.workspaceIds || []).filter(id => id !== ws.id),
                        }));
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{ws.name}</span>
                    <span className={`badge badge-${ws.type === 'store' ? 'amber' : 'blue'}`} style={{ fontSize: 10 }}>
                      {ws.type === 'store' ? 'Toko' : 'Bazar'}
                    </span>
                    {ws.status !== 'active' && (
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{ws.status}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              {isEdit && editUser && editUser.role !== "admin" && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--red, var(--danger))" }}
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Hapus
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={saving}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {isEdit ? "Simpan Perubahan" : "Tambah Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteConfirm}
        icon="danger"
        title="Hapus Pengguna?"
        message={`Yakin ingin menghapus pengguna "${editUser?.name}"? Pengguna akan dinonaktifkan.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        onConfirm={doDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
}
