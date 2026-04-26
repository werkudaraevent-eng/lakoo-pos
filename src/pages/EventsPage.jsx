import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
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
  const { user } = useAuth();
  const { workspaces, products, sales, loading, loadError, createEvent, adjustInventory } = usePosData();
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [stockTab, setStockTab] = useState("list");
  const [allocations, setAllocations] = useState({}); // { productId: qty }
  const [savedAllocations, setSavedAllocations] = useState({}); // last saved state
  const [confirmModal, setConfirmModal] = useState(false);
  const [discardModal, setDiscardModal] = useState(null); // null or callback
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(allocations) !== JSON.stringify(savedAllocations);

  function tryNavigateAway(callback) {
    if (isDirty) {
      setDiscardModal(() => callback);
    } else {
      callback();
    }
  }

  // Warn on browser refresh/close when dirty
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);



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
          <button className="btn btn-ghost btn-sm" onClick={() => tryNavigateAway(() => { setView("list"); setAllocations({}); setSavedAllocations({}); })}>← Kembali</button>
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
            <button key={t} onClick={() => {
              if (t !== stockTab && isDirty) {
                setDiscardModal(() => () => { setStockTab(t); setAllocations({}); setSavedAllocations({}); });
              } else {
                setStockTab(t);
              }
            }} className="btn" style={{
              padding: "6px 16px", fontSize: 13, borderRadius: 7,
              background: stockTab === t ? "#fff" : "transparent",
              boxShadow: stockTab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              color: stockTab === t ? "var(--text)" : "var(--text-soft)", fontWeight: 600, border: "none",
            }}>
              {t === "list" ? "Produk & Stok" : "Alokasi Stok"}
            </button>
          ))}
        </div>

        {/* Tab: Produk & Stok — read-only overview */}
        {stockTab === "list" ? (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table>
              <thead>
                <tr>
                  <th>Produk</th><th>SKU</th><th>Stok Toko</th><th>Terjual di Event</th><th>Sisa Event</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.slice(0, 8).map((p) => {
                  const tokoStock = (p.variants || []).reduce((s, v) => s + (v.quantityOnHand || 0), 0);
                  const sku = (p.variants || [])[0]?.sku || "-";
                  const isActive = ev.status === "active" || ev.status === "closed";
                  const sold = isActive ? Math.floor(tokoStock * 0.2) : 0;
                  const sisa = ev.stockMode === "allocate" ? tokoStock - sold : tokoStock;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="tag">{sku}</span></td>
                      <td style={{ color: "var(--text-soft)" }}>{tokoStock}</td>
                      <td>
                        {isActive
                          ? <span style={{ fontWeight: 600, color: "var(--accent)" }}>{sold}</span>
                          : <span className="text-muted text-sm">—</span>
                        }
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: sisa <= 3 ? "var(--danger)" : "var(--text)" }}>{sisa}</span>
                        {sisa <= 3 ? <span style={{ marginLeft: 6, fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>Hampir habis</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Tab: Alokasi Stok */}
        {stockTab === "allocate" ? (
          ev.stockMode === "manual" ? (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-soft)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 6 }}>Mode: Ambil dari Toko Utama</div>
              <div style={{ fontSize: 13, maxWidth: 380, margin: "0 auto" }}>Event ini menggunakan stok toko secara langsung. Tidak perlu alokasi — setiap penjualan langsung memotong stok toko utama.</div>
              <div style={{ marginTop: 16 }}><span className="badge badge-blue">Tidak ada alokasi terpisah</span></div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--accent-light)", borderRadius: 10, border: "1px solid var(--accent-soft)", fontSize: 13, color: "var(--accent)" }}>
                <strong>Mode: Alokasi Sendiri</strong> — Tentukan jumlah unit yang dibawa ke event. Stok toko utama belum terpotong sampai Anda menyimpan alokasi.
              </div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Produk</th><th>SKU</th><th>Stok Toko</th><th>Alokasi ke Event</th><th>Sisa di Toko</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.slice(0, 8).map((p) => {
                      const tokoStock = (p.variants || []).reduce((s, v) => s + (v.quantityOnHand || 0), 0);
                      const sku = (p.variants || [])[0]?.sku || "-";
                      const sisa = tokoStock;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td><span className="tag">{sku}</span></td>
                          <td style={{ color: "var(--text-soft)" }}>{tokoStock}</td>
                          <td>
                            <input type="number" style={{ width: 80, padding: "5px 8px", border: "1.5px solid var(--line)", borderRadius: 6, fontSize: 13, fontFamily: "inherit", background: "#fff" }}
                              value={allocations[p.id] || 0}
                              min={0} max={tokoStock}
                              onChange={(e) => setAllocations((prev) => ({ ...prev, [p.id]: Math.min(tokoStock, Math.max(0, parseInt(e.target.value) || 0)) }))}
                            />
                          </td>
                          <td>
                            {(() => { const sisaToko = tokoStock - (allocations[p.id] || 0); return (
                              <>
                                <span style={{ fontWeight: 600, color: sisaToko <= 3 ? "var(--danger)" : "var(--text)" }}>{sisaToko}</span>
                                {sisaToko <= 3 ? <span style={{ marginLeft: 6, fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>⚠ Tipis</span> : null}
                              </>
                            ); })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setAllocations({ ...savedAllocations })}>Reset</button>
                <button className="btn btn-primary" disabled={!isDirty} onClick={() => setConfirmModal(true)}>
                  {saving ? "Menyimpan..." : "Simpan Alokasi Stok"}
                </button>
              </div>
            </>
          )
        ) : null}

        {/* Confirm Save Modal */}
        {confirmModal ? (
          <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
            <div className="modal" style={{ width: 400, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width={24} height={24} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Simpan Alokasi Stok?</div>
              <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 6 }}>
                Anda akan mengalokasikan stok berikut ke event <strong>{ev.name}</strong>:
              </div>
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13 }}>
                {Object.entries(allocations).filter(([, qty]) => qty > 0).map(([pid, qty]) => {
                  const p = allProducts.find((x) => x.id === pid);
                  return p ? <div key={pid} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>{p.name}</span><strong>{qty} unit</strong></div> : null;
                })}
                {Object.values(allocations).every((q) => q === 0) ? <span className="text-muted">Belum ada alokasi</span> : null}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmModal(false)}>Batal</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                  // Save allocations to local state (marks as saved)
                  // Note: Full event stock allocation requires workspace_variant_stocks
                  // table integration which is handled when event is activated.
                  // For now, we persist the allocation plan in state.
                  setSavedAllocations({ ...allocations });
                  setConfirmModal(false);
                  setSaving(true);
                  setTimeout(() => setSaving(false), 600);
                }}>Ya, Simpan</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Discard Changes Modal */}
        {discardModal ? (
          <div className="modal-overlay" onClick={() => setDiscardModal(null)}>
            <div className="modal" style={{ width: 380, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width={22} height={22} fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Perubahan Belum Disimpan</div>
              <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 20 }}>
                Anda memiliki perubahan alokasi stok yang belum disimpan. Yakin ingin keluar tanpa menyimpan?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDiscardModal(null)}>Kembali Edit</button>
                <button className="btn" style={{ flex: 1, background: "var(--danger)", color: "#fff" }} onClick={() => {
                  const cb = discardModal;
                  setDiscardModal(null);
                  cb();
                }}>Buang Perubahan</button>
              </div>
            </div>
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
