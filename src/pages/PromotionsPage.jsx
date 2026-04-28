import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ConfirmModal } from "../components/ConfirmModal";
import "../features/dashboard/dashboard.css";
import "../features/promotions/promotions.css";

const statusMeta = {
  active: { label: "Aktif", cls: "badge-green" },
  upcoming: { label: "Mendatang", cls: "badge-blue" },
  ended: { label: "Selesai", cls: "badge-gray" },
};

const typeMeta = {
  percentage: "Diskon %",
  fixed: "Diskon Rp",
};

const FILTERS = ["Semua", "Aktif", "Mendatang", "Selesai"];

const EMPTY_FORM = {
  code: "",
  type: "percentage",
  value: "",
  minPurchase: "",
  startAt: "",
  endAt: "",
};

function getPromoStatus(promo) {
  const now = new Date();
  if (new Date(promo.startAt) > now) return "upcoming";
  if (!promo.isActive || new Date(promo.endAt) < now) return "ended";
  return "active";
}

function toLocalDatetimeValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PromotionsPage() {
  const { user } = useAuth();
  const { promotions, sales, loading, loadError, createPromotion } = usePosData();
  const [filter, setFilter] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  // Count promo usage from sales
  const promoUsage = useMemo(() => {
    const counts = {};
    (sales || []).forEach((s) => {
      if (s.promotion?.promotionId) {
        counts[s.promotion.promotionId] = (counts[s.promotion.promotionId] || 0) + 1;
      }
    });
    return counts;
  }, [sales]);

  const promoList = useMemo(() => {
    return (promotions || []).map((p) => ({
      ...p,
      status: getPromoStatus(p),
      used: promoUsage[p.id] || 0,
    }));
  }, [promotions, promoUsage]);

  const filtered = promoList.filter((p) => {
    if (filter === "Semua") return true;
    const meta = statusMeta[p.status];
    return meta && meta.label === filter;
  });

  // Modal helpers
  function openCreate() {
    setEditPromo(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(promo) {
    setEditPromo(promo);
    setForm({
      code: promo.code || "",
      type: promo.type || "percentage",
      value: promo.value ?? "",
      minPurchase: promo.minPurchase ?? "",
      startAt: toLocalDatetimeValue(promo.startAt),
      endAt: toLocalDatetimeValue(promo.endAt),
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.startAt) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value) || 0,
        minPurchase: Number(form.minPurchase) || 0,
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : new Date(form.startAt).toISOString(),
        isActive: true,
      };
      if (editPromo) {
        payload.id = editPromo.id;
      }
      await createPromotion(payload, user);
      setShowModal(false);
      setEditPromo(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Gagal menyimpan promo:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(promo) {
    setDeactivateTarget(promo);
  }

  function doDeactivate() {
    if (!deactivateTarget) return;
    createPromotion({ ...deactivateTarget, isActive: false }, user).catch(console.error);
    setDeactivateTarget(null);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="content">
      {loading && <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p>}
      {loadError && <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p>}

      {/* Header: Filter chips + Create button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="cat-filter" style={{ margin: 0 }}>
          {FILTERS.map((f) => (
            <div key={f} className={`cat-chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Buat Promo
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Promo</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{promoList.length}</div>
        </div>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Promo Aktif</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{promoList.filter((p) => p.status === "active").length}</div>
        </div>
        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="kpi-label">Total Penggunaan</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{promoList.reduce((s, p) => s + p.used, 0)}</div>
        </div>
      </div>

      {/* Promo Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((promo) => {
          const status = promo.status;
          const meta = statusMeta[status] || statusMeta.ended;
          const iconBg =
            status === "active"
              ? "var(--accent-soft)"
              : status === "upcoming"
                ? "var(--blue-bg)"
                : "var(--surface)";
          const iconStroke =
            status === "active"
              ? "var(--accent)"
              : status === "upcoming"
                ? "var(--blue)"
                : "var(--text-soft)";

          return (
            <div
              key={promo.id}
              className="card card-sm"
              style={{ display: "flex", alignItems: "flex-start", gap: 16 }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke={iconStroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{promo.code}</span>
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  <span className="badge badge-gray">{typeMeta[promo.type] || promo.type}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.5 }}>
                  {promo.type === "percentage" ? `Diskon ${promo.value}%` : `Diskon ${formatCurrency(promo.value)}`}
                  {promo.minPurchase > 0 && ` · Min. pembelian ${formatCurrency(promo.minPurchase)}`}
                  {` · ${formatDate(promo.startAt)} – ${formatDate(promo.endAt)}`}
                </div>
              </div>

              {/* Usage count */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{promo.used}×</div>
                <div style={{ fontSize: 11, color: "var(--text-soft)" }}>digunakan</div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(promo)}>
                  Edit
                </button>
                {status !== "ended" && (
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: "var(--danger)" }}
                    onClick={() => handleDelete(promo)}
                    title="Nonaktifkan"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-soft)", fontSize: 13 }}>
            Tidak ada promo
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{editPromo ? "Edit Promo" : "Buat Promo Baru"}</div>

            {/* Kode Promo */}
            <div style={{ marginBottom: 14 }}>
              <label className="promo-field-label">Nama/Kode Promo *</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => updateField("code", e.target.value)}
                style={{ textTransform: "uppercase" }}
                placeholder="Contoh: DISKON10"
              />
            </div>

            {/* Jenis + Nilai */}
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div>
                <label className="promo-field-label">Jenis Diskon</label>
                <select
                  className="input promo-select"
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  <option value="percentage">Diskon %</option>
                  <option value="fixed">Diskon Rp</option>
                </select>
              </div>
              <div>
                <label className="promo-field-label">Nilai</label>
                <input
                  className="input"
                  type="number"
                  value={form.value}
                  onChange={(e) => updateField("value", e.target.value)}
                  placeholder={form.type === "percentage" ? "10" : "50000"}
                  min="0"
                />
              </div>
            </div>

            {/* Min Pembelian */}
            <div style={{ marginBottom: 14 }}>
              <label className="promo-field-label">Min. Pembelian</label>
              <input
                className="input"
                type="number"
                value={form.minPurchase}
                onChange={(e) => updateField("minPurchase", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Tanggal */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div>
                <label className="promo-field-label">Tanggal Mulai *</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => updateField("startAt", e.target.value)}
                />
              </div>
              <div>
                <label className="promo-field-label">Tanggal Selesai</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => updateField("endAt", e.target.value)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : editPromo ? "Simpan Perubahan" : "Buat Promo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deactivateTarget}
        icon="warning"
        title="Nonaktifkan Promo?"
        message={`Yakin ingin menonaktifkan promo "${deactivateTarget?.code}"?`}
        confirmLabel="Ya, Nonaktifkan"
        confirmVariant="danger"
        onConfirm={doDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
