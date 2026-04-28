import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { platformGet, platformPost } from "../../api/client";
import { PlatformShell, formatPlatformDate, planBadgeClass, statusBadgeClass } from "./PlatformShell";
import { ConfirmModal } from "../../components/ConfirmModal";
import "./platform.css";

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "trial", label: "Trial" },
  { key: "starter", label: "Starter" },
  { key: "pro", label: "Pro" },
  { key: "business", label: "Business" },
  { key: "suspended", label: "Suspended" },
];

export function PlatformTenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ businessName: "", slug: "", email: "", password: "", ownerName: "", plan: "trial", trialDays: 14 });
  const [creating, setCreating] = useState(false);
  const [alertModal, setAlertModal] = useState(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const data = await platformGet("/api/platform/tenants");
        setTenants(data.tenants || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, []);

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleCreateTenant(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await platformPost("/api/platform/tenants", createForm);
      setTenants(res.tenants || []);
      setShowCreate(false);
      setCreateForm({ businessName: "", slug: "", email: "", password: "", ownerName: "", plan: "trial", trialDays: 14 });
    } catch (err) {
      setAlertModal({ title: "Gagal", message: err.message });
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    let list = Array.isArray(tenants) ? tenants : [];

    // Filter by plan/status
    if (filter === "suspended") {
      list = list.filter(
        (t) => t.status?.toLowerCase() === "suspended"
      );
    } else if (filter !== "all") {
      list = list.filter(
        (t) => t.plan?.toLowerCase() === filter
      );
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          t.ownerEmail?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [tenants, filter, search]);

  return (
    <PlatformShell title="Manajemen Tenant">
      {/* Filter Chips */}
      <div className="platform-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`platform-filter-chip${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search + Create Button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="platform-search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Cari nama, slug, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Tambah Tenant
        </button>
      </div>

      {loading && <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13.5 }}>Memuat data tenant...</div>}
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="platform-empty">
          <div className="empty-icon">🏪</div>
          <h3>Tidak ada tenant ditemukan</h3>
          <p>
            {search
              ? "Coba ubah kata kunci pencarian"
              : "Belum ada tenant yang terdaftar"}
          </p>
        </div>
      )}

      {/* Tenant Cards */}
      {!loading && filtered.length > 0 && (
        <div className="platform-tenant-grid">
          {filtered.map((tenant) => (
            <div
              key={tenant._id || tenant.id}
              className="platform-tenant-card"
              onClick={() =>
                navigate(`/platform/tenants/${tenant._id || tenant.id}`)
              }
            >
              <div className="platform-tenant-card-header">
                <div>
                  <h3>{tenant.name}</h3>
                  <div className="slug">{tenant.slug}</div>
                </div>
                <div className="platform-tenant-card-badges">
                  <span className={`platform-badge ${planBadgeClass(tenant.plan)}`}>
                    {tenant.plan || "trial"}
                  </span>
                  <span className={`platform-badge ${statusBadgeClass(tenant.status)}`}>
                    {tenant.status || "active"}
                  </span>
                </div>
              </div>

              <div className="platform-tenant-card-stats">
                <div className="platform-tenant-card-stat">
                  <div className="stat-num">{tenant.usersCount ?? tenant.users?.length ?? 0}</div>
                  <div className="stat-lbl">Pengguna</div>
                </div>
                <div className="platform-tenant-card-stat">
                  <div className="stat-num">{tenant.productsCount ?? 0}</div>
                  <div className="stat-lbl">Produk</div>
                </div>
                <div className="platform-tenant-card-stat">
                  <div className="stat-num">{tenant.workspacesCount ?? 0}</div>
                  <div className="stat-lbl">Workspace</div>
                </div>
              </div>

              <div className="platform-tenant-card-footer">
                <span>Terdaftar: {formatPlatformDate(tenant.createdAt)}</span>
                <span>{tenant.ownerEmail || tenant.email || ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Create Tenant Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Tambah Tenant Baru</div>
            <form onSubmit={handleCreateTenant}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Nama Bisnis *</label>
                <input className="input" required value={createForm.businessName} onChange={(e) => setCreateForm(f => ({ ...f, businessName: e.target.value, slug: slugify(e.target.value) }))} placeholder="Contoh: Warung Kopi Nusantara" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Slug URL *</label>
                <input className="input" required value={createForm.slug} onChange={(e) => setCreateForm(f => ({ ...f, slug: e.target.value }))} placeholder="warung-kopi" style={{ fontFamily: "monospace" }} />
              </div>
              <div className="grid-2" style={{ marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Nama Pemilik</label>
                  <input className="input" value={createForm.ownerName} onChange={(e) => setCreateForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="Nama admin" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Paket</label>
                  <select className="input" value={createForm.plan} onChange={(e) => setCreateForm(f => ({ ...f, plan: e.target.value }))}>
                    <option value="trial">Trial</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                  {createForm.plan === "trial" && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-soft)", marginBottom: 4 }}>Durasi Trial (hari)</label>
                      <input className="input" type="number" min="1" max="365" value={createForm.trialDays} onChange={(e) => setCreateForm(f => ({ ...f, trialDays: parseInt(e.target.value) || 14 }))} style={{ width: 100 }} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Email *</label>
                <input className="input" type="email" required value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="owner@bisnis.com" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Password Admin *</label>
                <input className="input" type="password" required value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 karakter" />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Membuat..." : "Buat Tenant"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
