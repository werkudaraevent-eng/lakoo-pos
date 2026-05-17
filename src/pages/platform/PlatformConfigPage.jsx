import { useState, useEffect } from "react";
import { platformGet, platformPatch } from "../../api/client";
import { PlatformShell } from "./PlatformShell";
import "./platform.css";

const FIELDS = [
  {
    key: "upgrade_url",
    label: "URL Upgrade Paket",
    placeholder: "https://lynk.id/your-product",
    description: "Link halaman pembayaran (Lynk.id, Stripe, dsb.). Tombol upgrade di sisi tenant akan mengarah ke URL ini.",
    type: "url",
  },
  {
    key: "support_contact",
    label: "Kontak Admin / Support",
    placeholder: "https://wa.me/628123456789",
    description: "Link WhatsApp / email / chat yang dihubungi user setelah membayar.",
    type: "url",
  },
  {
    key: "support_label",
    label: "Label Tombol Kontak",
    placeholder: "Hubungi Admin via WhatsApp",
    description: "Teks yang muncul di tombol kontak admin.",
    type: "text",
  },
];

export function PlatformConfigPage() {
  const [config, setConfig] = useState({});
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await platformGet("/api/platform/config");
        setConfig(res.config || {});
        setForm(res.config || {});
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError("");

    // Compute diff (only send changed fields)
    const updates = {};
    for (const field of FIELDS) {
      if ((form[field.key] || "") !== (config[field.key] || "")) {
        updates[field.key] = form[field.key] || "";
      }
    }

    if (Object.keys(updates).length === 0) {
      showToast("error", "Tidak ada perubahan untuk disimpan.");
      setSaving(false);
      return;
    }

    try {
      const res = await platformPatch("/api/platform/config", updates);
      setConfig(res.config || {});
      showToast("success", "Konfigurasi berhasil disimpan.");
    } catch (err) {
      setError(err.message || "Gagal menyimpan.");
      showToast("error", err.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = FIELDS.some(
    (f) => (form[f.key] || "") !== (config[f.key] || "")
  );

  return (
    <PlatformShell title="Konfigurasi Platform">
      {loading && (
        <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13.5 }}>
          Memuat konfigurasi...
        </div>
      )}
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {!loading && (
        <div className="card" style={{ padding: 24, maxWidth: 720 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Upgrade & Kontak</h3>
            <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
              Konfigurasi yang ditampilkan ke semua tenant. Setiap perubahan langsung berlaku tanpa perlu deploy ulang.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {FIELDS.map((field) => (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  className="input"
                  value={form[field.key] || ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width: "100%" }}
                />
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  {field.description}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setForm(config)}
              disabled={!isDirty || saving}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "14px 22px", borderRadius: 10,
          background: toast.type === "success" ? "var(--success, #4a9066)" : "var(--danger, #b54343)",
          color: "#fff", fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)", maxWidth: 420,
        }}>
          {toast.type === "success" ? "\u2713 " : "\u2717 "}
          {toast.message}
        </div>
      )}
    </PlatformShell>
  );
}
