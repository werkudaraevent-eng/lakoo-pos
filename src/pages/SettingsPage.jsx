import { useEffect, useState } from "react";

import { apiGet } from "../api/client";
import { usePosData } from "../context/PosDataContext";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
}

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

const PLAN_LABELS = { trial: "Trial", starter: "Starter — Rp 99rb/bln", pro: "Pro — Rp 249rb/bln", business: "Business" };

const TABS = ["Info Toko", "Struk & Print", "Metode Bayar", "Pajak"];

const BUILTIN_IDS = ["cash", "qris", "transfer", "card", "ewallet"];

const DEFAULT_PAYMENT_METHODS = [
  { id: "cash", label: "Cash", desc: "Uang tunai", enabled: true },
  { id: "qris", label: "QRIS", desc: "Scan QR Code", enabled: true },
  { id: "transfer", label: "Transfer Bank", desc: "BCA / Mandiri / BNI", enabled: false },
  { id: "card", label: "Kartu Debit/Kredit", desc: "Visa / Mastercard", enabled: false },
  { id: "ewallet", label: "E-Wallet", desc: "GoPay / OVO / Dana", enabled: false },
];

function normalizePaymentMethods(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_PAYMENT_METHODS.map(m => ({ ...m }));
  // Old format: string array like ["cash", "qris"]
  if (typeof raw[0] === "string") {
    return DEFAULT_PAYMENT_METHODS.map(m => ({ ...m, enabled: raw.includes(m.id) }));
  }
  // New format: object array — merge with defaults to ensure all built-ins exist
  const existingIds = new Set(raw.map(m => m.id));
  const merged = [...raw];
  for (const def of DEFAULT_PAYMENT_METHODS) {
    if (!existingIds.has(def.id)) merged.push({ ...def });
  }
  return merged;
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12, border: "none",
      background: value ? "var(--accent)" : "var(--surface-2)",
      position: "relative", cursor: "pointer", transition: "background 0.2s",
      flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
      }} />
    </button>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, loading, loadError } = usePosData();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tab, setTab] = useState("Info Toko");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet("/api/tenant").then((res) => setTenantInfo(res)).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    // Info Toko
    storeName: "",
    storeCode: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    instagram: "",
    attribute1Label: "Size",
    attribute2Label: "Color",
    // Struk & Print
    receiptHeader: "",
    receiptFooter: "",
    showLogo: true,
    showBarcode: true,
    // Metode Bayar
    paymentMethods: DEFAULT_PAYMENT_METHODS.map(m => ({ ...m })),
    // Pajak
    taxEnabled: false,
    taxName: "Pajak Layanan",
    taxRate: 0,
  });

  useEffect(() => {
    setForm({
      storeName: settings.storeName || "",
      storeCode: settings.storeCode || "",
      tagline: settings.tagline || "",
      address: settings.address || "",
      phone: settings.phone || "",
      email: settings.email || "",
      instagram: settings.instagram || "",
      attribute1Label: settings.attribute1Label ?? "Size",
      attribute2Label: settings.attribute2Label ?? "Color",
      receiptHeader: settings.receiptHeader || "",
      receiptFooter: settings.receiptFooter || "",
      showLogo: settings.showLogo ?? true,
      showBarcode: settings.showBarcode ?? true,
      paymentMethods: normalizePaymentMethods(settings.paymentMethods),
      taxEnabled: settings.taxEnabled ?? (settings.taxRate > 0),
      taxName: settings.taxName || "Pajak Layanan",
      taxRate: settings.taxRate ?? 0,
    });
  }, [settings]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateMethod(index, changes) {
    setForm((prev) => {
      const next = [...prev.paymentMethods];
      next[index] = { ...next[index], ...changes };
      return { ...prev, paymentMethods: next };
    });
  }

  function removeMethod(index) {
    setForm((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((_, i) => i !== index),
    }));
  }

  function addCustomMethod() {
    setForm((prev) => {
      const existingCustom = prev.paymentMethods.filter(m => m.id.startsWith("custom_"));
      const nextNum = existingCustom.length + 1;
      return {
        ...prev,
        paymentMethods: [
          ...prev.paymentMethods,
          { id: `custom_${nextNum}`, label: "Metode Baru", desc: "", enabled: true },
        ],
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({
        storeName: form.storeName,
        storeCode: form.storeCode,
        tagline: form.tagline,
        address: form.address,
        phone: form.phone,
        email: form.email,
        instagram: form.instagram,
        attribute1Label: form.attribute1Label || "Size",
        attribute2Label: form.attribute2Label || "Color",
        receiptHeader: form.receiptHeader,
        receiptFooter: form.receiptFooter,
        showLogo: form.showLogo,
        showBarcode: form.showBarcode,
        paymentMethods: form.paymentMethods,
        taxEnabled: form.taxEnabled,
        taxName: form.taxName,
        taxRate: form.taxEnabled ? (Number(form.taxRate) || 0) : 0,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error handled by context
    } finally {
      setSaving(false);
    }
  }

  const taxCalc = Math.round(100000 * (Number(form.taxRate) || 0) / 100);

  return (
    <div className="page-stack" style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* ── Subscription Info Panel ── */}
      {tenantInfo?.tenant ? (
        <article className="panel-card">
          <div className="panel-head">
            <h2>Langganan</h2>
          </div>
          <div className="panel-body form-stack" style={{ marginTop: 0 }}>
            <div className="dual-fields">
              <div className="field">
                <span className="muted-text">Paket</span>
                <strong>{PLAN_LABELS[tenantInfo.tenant.plan] || tenantInfo.tenant.plan}</strong>
              </div>
              <div className="field">
                <span className="muted-text">Status</span>
                <strong style={{ textTransform: "capitalize" }}>{tenantInfo.tenant.status}</strong>
              </div>
            </div>
            {tenantInfo.tenant.plan !== "trial" && tenantInfo.tenant.subscriptionEndsAt && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  Langganan: {formatDate(tenantInfo.tenant.subscriptionStartsAt)} — {formatDate(tenantInfo.tenant.subscriptionEndsAt)}
                </p>
                {(() => {
                  const daysLeft = Math.ceil((new Date(tenantInfo.tenant.subscriptionEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                  if (daysLeft <= 0) {
                    return <p style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>⚠️ Langganan sudah berakhir!</p>;
                  }
                  if (daysLeft <= 30) {
                    return <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>⏰ {daysLeft} hari lagi sebelum berakhir</p>;
                  }
                  return <p style={{ fontSize: 13, color: "var(--success)" }}>✓ {daysLeft} hari tersisa</p>;
                })()}
              </div>
            )}
            {tenantInfo.tenant.plan === "trial" && tenantInfo.tenant.trialEndsAt ? (
              <div style={{ marginTop: 8 }}>
                <p className="muted-text">Trial berakhir: {formatDate(tenantInfo.tenant.trialEndsAt)}</p>
                {(() => {
                  const daysLeft = Math.ceil((new Date(tenantInfo.tenant.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                  if (daysLeft <= 0) {
                    return <p style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>⚠️ Masa trial sudah berakhir!</p>;
                  }
                  return (
                    <p style={{ fontSize: 13, color: daysLeft <= 7 ? "var(--accent)" : "var(--text-soft)" }}>
                      {daysLeft <= 7 ? "⏰ " : ""}{daysLeft} hari tersisa dari masa trial
                    </p>
                  );
                })()}
              </div>
            ) : null}
            {tenantInfo.usage && tenantInfo.limits ? (
              <div className="dual-fields" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div className="field">
                  <span className="muted-text">Produk</span>
                  <span>{tenantInfo.usage.products} / {tenantInfo.limits.products === -1 ? "\u221E" : tenantInfo.limits.products}</span>
                </div>
                <div className="field">
                  <span className="muted-text">Pengguna</span>
                  <span>{tenantInfo.usage.users} / {tenantInfo.limits.users === -1 ? "\u221E" : tenantInfo.limits.users}</span>
                </div>
                <div className="field">
                  <span className="muted-text">Workspace</span>
                  <span>{tenantInfo.usage.workspaces} / {tenantInfo.limits.workspaces === -1 ? "\u221E" : tenantInfo.limits.workspaces}</span>
                </div>
              </div>
            ) : null}
          </div>
        </article>
      ) : null}

      {/* ── Settings Card ── */}
      <article className="panel-card">
        {loading ? <p className="info-text" style={{ marginBottom: 12 }}>Memuat pengaturan...</p> : null}
        {loadError ? <p className="error-text" style={{ marginBottom: 12 }}>{loadError}</p> : null}

        {/* ── Tab Switcher ── */}
        <div style={{
          display: "flex", background: "var(--surface)", borderRadius: 10,
          padding: 4, gap: 2, marginBottom: 24,
        }}>
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600,
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "var(--text)" : "var(--text-soft)",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "inherit",
            }}>{t}</button>
          ))}
        </div>

        {/* ── Tab 1: Info Toko ── */}
        {tab === "Info Toko" && (
          <div className="form-stack">
            <label className="field">
              <span>Nama Toko</span>
              <input
                value={form.storeName}
                onChange={(e) => updateField("storeName", e.target.value)}
                placeholder="Nama toko Anda"
              />
            </label>

            <label className="field">
              <span>Kode Toko</span>
              <input
                value={form.storeCode}
                onChange={(e) => updateField("storeCode", e.target.value)}
                placeholder="Kode unik toko"
              />
            </label>

            <label className="field">
              <span>Tagline</span>
              <input
                value={form.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="Deskripsi singkat toko"
              />
            </label>

            <label className="field">
              <span>Alamat</span>
              <textarea
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Alamat lengkap toko"
              />
            </label>

            <div className="dual-fields">
              <label className="field">
                <span>Nomor Telepon</span>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="toko@email.com"
                />
              </label>
            </div>

            <label className="field">
              <span>Instagram</span>
              <input
                value={form.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                placeholder="@namatoko"
              />
            </label>

            <div style={{ borderTop: "1px solid var(--line)", margin: "8px 0", paddingTop: 16 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>
                Label Varian Produk
              </p>
              <div className="dual-fields">
                <label className="field">
                  <span>Label Varian 1 (cth: Ukuran, Berat)</span>
                  <input
                    value={form.attribute1Label}
                    onChange={(e) => updateField("attribute1Label", e.target.value)}
                    placeholder="Size"
                  />
                </label>
                <label className="field">
                  <span>Label Varian 2 (cth: Warna, Rasa)</span>
                  <input
                    value={form.attribute2Label}
                    onChange={(e) => updateField("attribute2Label", e.target.value)}
                    placeholder="Color"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Struk & Print ── */}
        {tab === "Struk & Print" && (
          <div className="form-stack">
            <label className="field">
              <span>Teks Header Struk</span>
              <input
                value={form.receiptHeader}
                onChange={(e) => updateField("receiptHeader", e.target.value)}
                placeholder="Terima kasih telah berbelanja!"
              />
            </label>

            <label className="field">
              <span>Teks Footer Struk</span>
              <input
                value={form.receiptFooter}
                onChange={(e) => updateField("receiptFooter", e.target.value)}
                placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
              />
            </label>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 0", borderTop: "1px solid var(--line)",
            }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Tampilkan Logo di Struk</p>
                <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>Logo toko akan muncul di bagian atas struk</p>
              </div>
              <ToggleSwitch value={form.showLogo} onChange={(v) => updateField("showLogo", v)} />
            </div>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 0", borderTop: "1px solid var(--line)",
            }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Tampilkan Barcode Transaksi</p>
                <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>Barcode ID transaksi di bagian bawah struk</p>
              </div>
              <ToggleSwitch value={form.showBarcode} onChange={(v) => updateField("showBarcode", v)} />
            </div>
          </div>
        )}

        {/* ── Tab 3: Metode Bayar ── */}
        {tab === "Metode Bayar" && (
          <div className="form-stack">
            <p style={{ fontSize: 12.5, color: "var(--text-soft)", marginBottom: 8 }}>
              Aktifkan, nonaktifkan, atau ubah label metode pembayaran yang tersedia di kasir.
            </p>
            {form.paymentMethods.map((method, i) => (
              <div key={method.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(247, 249, 251, 0.96)",
                border: "1px solid rgba(23, 33, 43, 0.06)",
              }}>
                <ToggleSwitch value={method.enabled} onChange={(v) => updateMethod(i, { enabled: v })} />
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    value={method.label}
                    onChange={(e) => updateMethod(i, { label: e.target.value })}
                    style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4, width: "100%" }}
                  />
                  <input
                    className="input"
                    value={method.desc}
                    onChange={(e) => updateMethod(i, { desc: e.target.value })}
                    style={{ fontSize: 12.5, color: "var(--text-soft)", width: "100%" }}
                    placeholder="Deskripsi (opsional)"
                  />
                </div>
                {!BUILTIN_IDS.includes(method.id) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => removeMethod(i)}
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={addCustomMethod}
              style={{ marginTop: 12, alignSelf: "flex-start" }}
            >
              + Tambah Metode Bayar
            </button>
          </div>
        )}

        {/* ── Tab 4: Pajak ── */}
        {tab === "Pajak" && (
          <div className="form-stack">
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(247, 249, 251, 0.96)",
              border: "1px solid rgba(23, 33, 43, 0.06)",
            }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Pajak & Biaya Layanan</p>
                <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>Aktifkan pengenaan pajak pada setiap transaksi</p>
              </div>
              <ToggleSwitch value={form.taxEnabled} onChange={(v) => updateField("taxEnabled", v)} />
            </div>

            {form.taxEnabled && (
              <>
                <label className="field">
                  <span>Nama Pajak</span>
                  <input
                    value={form.taxName}
                    onChange={(e) => updateField("taxName", e.target.value)}
                    placeholder="Pajak Layanan"
                  />
                </label>

                <label className="field">
                  <span>Persentase (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.taxRate}
                    onChange={(e) => updateField("taxRate", e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </label>

                <div style={{
                  padding: "12px 16px", borderRadius: 10,
                  background: "var(--accent-soft)", color: "var(--accent-deep)",
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  Contoh: Pembelian <strong>Rp 100.000</strong> akan dikenakan pajak <strong>{form.taxName || "Pajak"}</strong> sebesar <strong>{form.taxRate || 0}%</strong> = <strong>{formatRupiah(taxCalc)}</strong>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Save Button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 140, height: 42 }}
          >
            {saved ? "✓ Tersimpan!" : saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </article>
    </div>
  );
}
