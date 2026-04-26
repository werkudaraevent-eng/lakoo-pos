import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { usePosData } from "../context/PosDataContext";
import { formatCurrency } from "../utils/formatters";
import "../features/dashboard/dashboard.css";

const statusMeta = {
  draft: { label: "Mendatang", cls: "badge-blue" },
  active: { label: "Aktif", cls: "badge-green" },
  closed: { label: "Selesai", cls: "badge-gray" },
  archived: { label: "Arsip", cls: "badge-gray" },
};

export function EventsPage() {
  const navigate = useNavigate();
  const { workspaces, products, sales, loading, loadError, createEvent } = usePosData();
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [stockTab, setStockTab] = useState("list");

  const events = useMemo(() => {
    return (workspaces || [])
      .filter((w) => w.type === "event")
      .map((ev) => {
        const evSales = (sales || []).filter((s) => s.workspaceId === ev.id);
        const revenue = evSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
        return { ...ev, revenue, transactions: evSales.length };
      });
  }, [workspaces, sales]);

  // Create form
  const [form, setForm] = useState({ name: "", location: "", dateStart: "", dateEnd: "", stockMode: "allocate" });

  async function handleCreate() {
    if (!form.name || !form.dateStart) return;
    const result = await createEvent({
      name: form.name,
      code: form.name.substring(0, 6).toUpperCase().replace(/\s/g, ""),
      locationLabel: form.location,
      startsAt: form.dateStart,
      endsAt: form.dateEnd || form.dateStart,
      stockMode: form.stockMode === "inherit" ? "manual" : "allocate",
      assignedUserIds: [],
    });
    if (result.ok) {
      setForm({ name: "", location: "", dateStart: "", dateEnd: "", stockMode: "allocate" });
      setView("list");
    }
  }

  // ── Create View ──
  if (view === "create") return (
    <div className="content" style={{ maxWidth: 640 }}>
      <div className="row" style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setView("list")}>← Kembali</button>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Buat Event Baru</div>
      </div>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Nama Event / Bazar *</label>
          <input className="input" placeholder="mis: Bazar D — Summarecon" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Lokasi</label>
          <input className="input" placeholder="Nama mall, gedung, alamat..." value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="grid-2">
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tanggal Mulai *</label>
            <input className="input" type="date" value={form.dateStart} onChange={(e) => setForm({ ...form, dateStart: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tanggal Selesai</label>
            <input className="input" type="date" value={form.dateEnd} onChange={(e) => setForm({ ...form, dateEnd: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pengaturan Stok</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { val: "inherit", title: "Ambil dari Toko Utama", desc: "Stok event menggunakan dan memotong stok toko utama secara langsung." },
              { val: "custom", title: "Alokasi Stok Sendiri", desc: "Tentukan jumlah stok khusus yang dibawa ke event ini (tidak mempengaruhi toko utama sampai disesuaikan)." },
            ].map((opt) => (
              <div key={opt.val} onClick={() => setForm({ ...form, stockMode: opt.val })} style={{
                padding: "14px 16px", border: `1.5px solid ${form.stockMode === opt.val ? "var(--accent)" : "var(--line)"}`,
                borderRadius: 10, cursor: "pointer", background: form.stockMode === opt.val ? "var(--accent-light)" : "#fff",
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${form.stockMode === opt.val ? "var(--accent)" : "var(--line)"}`, background: form.stockMode === opt.val ? "var(--accent)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {form.stockMode === opt.val ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /> : null}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{opt.title}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-soft)", paddingLeft: 24 }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setView("list")}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2, height: 44 }} onClick={handleCreate}>Buat Event →</button>
        </div>
      </div>
    </div>
  );

  // ── Detail View ──
  if (view === "detail" && selected) {
    const ev = events.find((e) => e.id === selected);
    if (!ev) { setView("list"); return null; }
    const meta = statusMeta[ev.status] || statusMeta.draft;
    const allProducts = products || [];

    return (
      <div className="content">
        <div className="row" style={{ marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setView("list")}>← Kembali</button>
          <div style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>{ev.name}</div>
          <span className={`badge ${meta.cls}`}>{meta.label}</span>
          {ev.status === "draft" ? <button className="btn btn-primary btn-sm">Aktifkan</button> : null}
        </div>

        <div className="grid-3" style={{ marginBottom: 16 }}>
          {[
            { label: "Pendapatan", value: formatCurrency(ev.revenue) },
            { label: "Transaksi", value: ev.transactions },
            { label: "Mode Stok", value: ev.stockMode === "manual" ? "Dari Toko Utama" : "Alokasi Sendiri" },
          ].map((k, i) => (
            <div key={i} className="card"><div className="kpi-label">{k.label}</div><div className="kpi-value" style={{ fontSize: 20 }}>{k.value}</div></div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "var(--surface)", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {["list", "allocate"].map((t) => (
            <button key={t} onClick={() => setStockTab(t)} className="btn" style={{
              padding: "6px 16px", fontSize: 13, borderRadius: 7,
              background: stockTab === t ? "#fff" : "transparent",
              boxShadow: stockTab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              color: stockTab === t ? "var(--text)" : "var(--text-soft)", fontWeight: 600, border: "none",
            }}>
              {t === "list" ? "Produk & Stok" : "Alokasi Stok"}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Produk</th><th>SKU</th><th>Stok Toko</th><th>Alokasi Event</th><th>Sisa Toko</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.slice(0, 8).map((p) => {
                const tokoStock = (p.variants || []).reduce((s, v) => s + (v.quantityOnHand || 0), 0);
                const sku = (p.variants || [])[0]?.sku || "-";
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="tag">{sku}</span></td>
                    <td>{tokoStock}</td>
                    <td>
                      {ev.stockMode === "allocate"
                        ? <input type="number" style={{ width: 70, padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13, fontFamily: "inherit" }} defaultValue={0} min={0} max={tokoStock} />
                        : <span className="text-muted text-sm">Mengikuti toko</span>
                      }
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{tokoStock}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ev.stockMode === "allocate" ? (
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary">Simpan Alokasi Stok</button>
          </div>
        ) : null}
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="content">
      {loading ? <p className="text-sm text-muted" style={{ padding: 16 }}>Memuat data...</p> : null}
      {loadError ? <p style={{ padding: 16, color: "var(--danger)" }}>{loadError}</p> : null}

      <div className="row-between mb-16">
        <div>
          <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{events.length} event terdaftar</div>
        </div>
        <button className="btn btn-primary" onClick={() => setView("create")}>
          <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {" "}Buat Event Baru
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {events.map((ev) => {
          const meta = statusMeta[ev.status] || statusMeta.draft;
          return (
            <div
              key={ev.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onClick={() => { setSelected(ev.id); setView("detail"); }}
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
            </div>
          );
        })}
        {!loading && events.length === 0 ? (
          <div className="empty-state">
            <p style={{ marginBottom: 12 }}>Belum ada event</p>
            <button className="btn btn-primary" onClick={() => setView("create")}>
              <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {" "}Buat Event Baru
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
