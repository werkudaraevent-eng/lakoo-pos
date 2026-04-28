import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { platformGet, platformPost, platformPatch } from "../../api/client";
import { PlatformShell, formatPlatformDate } from "./PlatformShell";
import { ConfirmModal } from "../../components/ConfirmModal";
import "./platform.css";

function formatDateInput(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toISOString().split("T")[0]; } catch { return ""; }
}

function usagePercent(used, limit) {
  if (!limit || limit <= 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

function usageBarClass(percent) {
  if (percent >= 90) return "danger";
  if (percent >= 70) return "warning";
  return "";
}

const ROLE_LABELS = { admin: "Admin", manager: "Manager", cashier: "Kasir" };

export function PlatformTenantDetailPage() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loginAsLoading, setLoginAsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginAsConfirm, setLoginAsConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState(null);

  const [name, setName] = useState("");
  const [plan, setPlan] = useState("trial");
  const [status, setStatus] = useState("active");
  const [subscriptionStart, setSubscriptionStart] = useState("");
  const [subscriptionEnd, setSubscriptionEnd] = useState("");

  // Edit user modal
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", username: "", password: "", role: "cashier", isActive: true });
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    async function fetchTenant() {
      try {
        const data = await platformGet(`/api/platform/tenants/${tenantId}`);
        setTenantData(data);
        const t = data.tenant || {};
        setName(t.name || "");
        setPlan(t.plan || "trial");
        setStatus(t.status || "active");
        setSubscriptionStart(formatDateInput(t.subscriptionStartsAt));
        // For trial, show trialEndsAt as the end date
        setSubscriptionEnd(formatDateInput(t.plan === "trial" ? t.trialEndsAt : t.subscriptionEndsAt));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTenant();
  }, [tenantId]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { name, plan, status };
      if (plan === "trial") {
        // For trial, the end date controls trialEndsAt
        if (subscriptionEnd) payload.trialEndsAt = new Date(subscriptionEnd + "T23:59:59").toISOString();
      } else {
        // For paid plans, use subscription dates
        if (subscriptionStart) payload.subscriptionStartsAt = subscriptionStart;
        if (subscriptionEnd) payload.subscriptionEndsAt = subscriptionEnd;
      }
      const data = await platformPatch(`/api/platform/tenants/${tenantId}`, payload);
      setTenantData(data);
      const t = data.tenant || {};
      setName(t.name || "");
      setPlan(t.plan || "trial");
      setStatus(t.status || "active");
      setSubscriptionStart(formatDateInput(t.subscriptionStartsAt));
      setSubscriptionEnd(formatDateInput(t.plan === "trial" ? t.trialEndsAt : t.subscriptionEndsAt));
      setSuccess("Perubahan berhasil disimpan!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLoginAs() {
    setLoginAsConfirm(true);
  }

  async function doLoginAs() {
    setLoginAsConfirm(false);
    setLoginAsLoading(true);
    try {
      const res = await platformPost(`/api/platform/login-as/${tenantId}`);
      const url = `/login?impersonate=${encodeURIComponent(res.token)}&user=${encodeURIComponent(JSON.stringify(res.user))}`;
      window.open(url, "_blank");
    } catch (err) {
      setAlertModal({ title: "Gagal", message: err.message || "Gagal login sebagai admin tenant" });
    } finally {
      setLoginAsLoading(false);
    }
  }

  function openEditUser(u) {
    setUserForm({ name: u.name, username: u.username, password: "", role: u.role, isActive: u.isActive });
    setEditUser(u);
  }

  async function handleSaveUser() {
    if (!editUser) return;
    setSavingUser(true);
    try {
      const payload = { ...userForm };
      if (!payload.password) delete payload.password;
      const data = await platformPatch(`/api/platform/tenants/${tenantId}/users/${editUser.id}`, payload);
      setTenantData(data);
      setEditUser(null);
      setSuccess("Pengguna berhasil diperbarui.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setAlertModal({ title: "Gagal", message: err.message });
    } finally {
      setSavingUser(false);
    }
  }

  // Derived data from response
  const tenant = tenantData?.tenant || null;
  const usage = tenantData?.usage || {};
  const limits = tenantData?.limits || {};
  const users = tenantData?.users || [];

  const usersUsed = usage.users ?? 0;
  const usersLimit = limits.users > 0 ? limits.users : 0;
  const productsUsed = usage.products ?? 0;
  const productsLimit = limits.products > 0 ? limits.products : 0;
  const workspacesUsed = usage.workspaces ?? 0;
  const workspacesLimit = limits.workspaces > 0 ? limits.workspaces : 0;

  const labelStyle = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 };

  return (
    <PlatformShell title="Detail Tenant">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/platform/tenants")}>← Kembali</button>
        {tenant && <span style={{ fontSize: 16, fontWeight: 800 }}>{tenant.name}</span>}
      </div>

      {loading && <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13.5 }}>Memuat detail tenant...</div>}
      {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)", fontWeight: 600, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: "var(--success-soft)", border: "1px solid var(--success)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--success)", fontWeight: 600, marginBottom: 16 }}>{success}</div>}

      {tenant && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left: Tenant Info */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Informasi Tenant</div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama Tenant</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Slug</label>
              <div style={{ fontSize: 13, color: "var(--text-soft)", fontFamily: "monospace" }}>{tenant.slug}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{tenant.email}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Paket</label>
                <select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Aktif</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: plan === "trial" ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
              {plan !== "trial" && (
                <div>
                  <label style={labelStyle}>Mulai Langganan</label>
                  <input className="input" type="date" value={subscriptionStart} onChange={(e) => setSubscriptionStart(e.target.value)} />
                </div>
              )}
              <div>
                <label style={labelStyle}>{plan === "trial" ? "Berakhir Trial" : "Berakhir Langganan"}</label>
                <input className="input" type="date" value={subscriptionEnd} onChange={(e) => setSubscriptionEnd(e.target.value)} />
                {subscriptionEnd && (() => {
                  const daysLeft = Math.ceil((new Date(subscriptionEnd) - new Date()) / (1000 * 60 * 60 * 24));
                  if (daysLeft <= 0) return <div style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600, marginTop: 4 }}>⚠️ Sudah berakhir</div>;
                  if (daysLeft <= 7) return <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>⏰ {daysLeft} hari lagi</div>;
                  return <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>✓ {daysLeft} hari tersisa</div>;
                })()}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Terdaftar</label>
              <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{formatPlatformDate(tenant.createdAt)}</div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button className="btn btn-secondary" onClick={handleLoginAs} disabled={loginAsLoading}>
                {loginAsLoading ? "Memproses..." : "🔑 Login sebagai Admin"}
              </button>
            </div>
          </div>

          {/* Right: Usage + Users */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Usage Card */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Penggunaan</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Users */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Pengguna</span>
                    <span style={{ color: "var(--text-soft)" }}>{usersUsed} / {usersLimit || "∞"}</span>
                  </div>
                  {usersLimit > 0 && (
                    <div style={{ height: 6, background: "var(--surface)", borderRadius: 3 }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${usagePercent(usersUsed, usersLimit)}%`, background: usagePercent(usersUsed, usersLimit) >= 90 ? "var(--danger)" : usagePercent(usersUsed, usersLimit) >= 70 ? "var(--accent)" : "var(--success)", transition: "width 0.3s" }} />
                    </div>
                  )}
                </div>
                {/* Products */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Produk</span>
                    <span style={{ color: "var(--text-soft)" }}>{productsUsed} / {productsLimit || "∞"}</span>
                  </div>
                  {productsLimit > 0 && (
                    <div style={{ height: 6, background: "var(--surface)", borderRadius: 3 }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${usagePercent(productsUsed, productsLimit)}%`, background: usagePercent(productsUsed, productsLimit) >= 90 ? "var(--danger)" : "var(--success)", transition: "width 0.3s" }} />
                    </div>
                  )}
                </div>
                {/* Workspaces */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>Workspace</span>
                    <span style={{ color: "var(--text-soft)" }}>{workspacesUsed} / {workspacesLimit || "∞"}</span>
                  </div>
                  {workspacesLimit > 0 && (
                    <div style={{ height: 6, background: "var(--surface)", borderRadius: 3 }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${usagePercent(workspacesUsed, workspacesLimit)}%`, background: usagePercent(workspacesUsed, workspacesLimit) >= 90 ? "var(--danger)" : "var(--success)", transition: "width 0.3s" }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Users List Card */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Daftar Pengguna ({users.length})</div>
              {users.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {users.map((u) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", opacity: u.isActive ? 1 : 0.4 }}>
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-soft)" }}>@{u.username}</div>
                      </div>
                      <span className={`badge badge-${u.isActive ? "green" : "red"}`} style={{ fontSize: 10 }}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => openEditUser(u)}>
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 16, textAlign: "center", color: "var(--text-soft)", fontSize: 13 }}>
                  Tidak ada pengguna
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={() => setEditUser(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: 440, maxWidth: "90vw", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Edit Pengguna</div>

            {/* User info strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                {editUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{editUser.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-soft)" }}>@{editUser.username}</div>
              </div>
              <span className={`badge badge-${editUser.isActive ? "green" : "red"}`} style={{ fontSize: 10 }}>
                {editUser.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama Lengkap</label>
              <input className="input" value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Username</label>
              <input className="input" value={userForm.username} onChange={(e) => setUserForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Baru (kosongkan jika tidak diubah)</label>
              <input className="input" type="password" value={userForm.password} onChange={(e) => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Role</label>
                <select className="input" value={userForm.role} onChange={(e) => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Kasir</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select className="input" value={userForm.isActive ? "active" : "inactive"} onChange={(e) => setUserForm(f => ({ ...f, isActive: e.target.value === "active" }))}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditUser(null)} disabled={savingUser}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveUser} disabled={savingUser}>
                {savingUser ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={loginAsConfirm}
        icon="warning"
        title="Login sebagai Admin?"
        message={`Anda akan masuk sebagai admin tenant "${name}". Tab baru akan dibuka dengan sesi admin tenant ini.`}
        confirmLabel="Ya, Lanjutkan"
        confirmVariant="primary"
        onConfirm={doLoginAs}
        onCancel={() => setLoginAsConfirm(false)}
      />
      <ConfirmModal
        open={!!alertModal}
        icon="danger"
        title={alertModal?.title}
        message={alertModal?.message}
        confirmLabel="OK"
        confirmVariant="primary"
        onConfirm={() => setAlertModal(null)}
      />
    </PlatformShell>
  );
}
