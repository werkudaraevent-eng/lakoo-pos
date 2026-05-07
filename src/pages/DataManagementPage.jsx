import { useState, useEffect } from "react";
import { usePosData } from "../context/PosDataContext";
import { ConfirmModal } from "../components/ConfirmModal";
import "../features/dashboard/dashboard.css";

const ACTION_LABELS = {
  "sale.create": "Membuat transaksi baru",
  "sale.bulk_delete": "Menghapus semua riwayat transaksi",
  "sale.restore": "Memulihkan transaksi dari tempat sampah",
  "sale.permanent_delete": "Menghapus transaksi secara permanen",
  "product.create": "Menambah produk baru",
  "product.update": "Mengubah data produk",
  "product.bulk_delete": "Menghapus semua produk",
  "product.restore": "Memulihkan produk dari tempat sampah",
  "product.permanent_delete": "Menghapus produk secara permanen",
  "user.create": "Menambah pengguna baru",
  "user.update": "Mengubah data pengguna",
  "settings.update": "Mengubah pengaturan toko",
  "event.create": "Membuat event baru",
  "event.status_change": "Mengubah status event",
  "event.close": "Menutup event",
  "inventory.adjust": "Menyesuaikan stok",
  "inventory.reset_all": "Mereset semua stok ke 0",
  "promotion.create": "Membuat promosi baru",
  "promotion.restore": "Memulihkan promosi dari tempat sampah",
  "promotion.permanent_delete": "Menghapus promosi secara permanen",
};

function getActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

function formatAuditDetail(log) {
  const d = log.details || log.detail;
  if (!d || (typeof d === "object" && Object.keys(d).length === 0)) return "-";

  const details = typeof d === "string" ? (() => { try { return JSON.parse(d); } catch { return null; } })() : d;
  if (!details) return String(d);

  const parts = [];
  if (details.name) parts.push(`"${details.name}"`);
  if (details.receiptNumber) parts.push(`#${details.receiptNumber}`);
  if (details.code) parts.push(`Kode: ${details.code}`);
  if (details.username) parts.push(`@${details.username}`);
  if (details.role) parts.push(`Role: ${details.role}`);
  if (details.category) parts.push(`Kategori: ${details.category}`);
  if (details.price || details.total) parts.push(`Rp ${(details.price || details.total || 0).toLocaleString("id-ID")}`);
  if (details.paymentMethod) parts.push(`via ${details.paymentMethod}`);
  if (details.items) parts.push(`${details.items} item`);
  if (details.quantity) parts.push(`${details.mode === "restock" ? "+" : ""}${details.quantity} unit`);
  if (details.mode) parts.push(details.mode === "restock" ? "Restock" : "Adjustment");
  if (details.status) parts.push(`→ ${details.status}`);
  if (details.count) parts.push(`${details.count} item`);
  if (details.fields) parts.push(details.fields);
  if (details.location) parts.push(details.location);
  if (details.stockMode) parts.push(`Mode: ${details.stockMode}`);

  return parts.length > 0 ? parts.join(" · ") : "-";
}

export function DataManagementPage() {
  const {
    getAuditLogs,
    getRecycleBin,
    restoreFromBin,
    permanentDeleteFromBin,
    bulkDeleteProducts,
    bulkDeleteSales,
    bulkResetStock,
  } = usePosData();

  const [tab, setTab] = useState("bin"); // "bin" | "bulk" | "audit"
  const [bin, setBin] = useState({ products: [], sales: [], promotions: [] });
  const [logs, setLogs] = useState([]);
  const [loadingBin, setLoadingBin] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // "products" | "sales" | "stock"
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { entityType, ids }
  const [restoreConfirm, setRestoreConfirm] = useState(null); // { entityType, ids }
  const [processing, setProcessing] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    if (tab === "bin") {
      setLoadingBin(true);
      getRecycleBin()
        .then(setBin)
        .catch(() => {})
        .finally(() => setLoadingBin(false));
    } else if (tab === "audit") {
      setLoadingLogs(true);
      getAuditLogs({ limit: 200, entityType: auditFilter || undefined })
        .then(setLogs)
        .catch(() => {})
        .finally(() => setLoadingLogs(false));
    }
  }, [tab, auditFilter]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleRestore() {
    if (!restoreConfirm) return;
    setProcessing(true);
    try {
      await restoreFromBin(restoreConfirm.entityType, restoreConfirm.ids);
      setBin(await getRecycleBin());
      showToast("success", "Item berhasil dipulihkan.");
      setRestoreConfirm(null);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handlePermanentDelete() {
    if (!deleteConfirm) return;
    setProcessing(true);
    try {
      await permanentDeleteFromBin(deleteConfirm.entityType, deleteConfirm.ids);
      setBin(await getRecycleBin());
      showToast("success", "Item berhasil dihapus permanen.");
      setDeleteConfirm(null);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleBulkAction() {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      if (confirmAction === "products") {
        const count = await bulkDeleteProducts();
        showToast("success", `${count} produk dipindahkan ke tempat sampah.`);
      } else if (confirmAction === "sales") {
        const count = await bulkDeleteSales();
        showToast("success", `${count} transaksi dipindahkan ke tempat sampah.`);
      } else if (confirmAction === "stock") {
        await bulkResetStock();
        showToast("success", "Semua stok berhasil di-reset ke 0.");
      }
      setConfirmAction(null);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          background: "var(--surface)",
          borderRadius: 10,
          padding: 4,
          gap: 2,
          marginBottom: 24,
        }}
      >
        {[
          { key: "bin", label: "Tempat Sampah" },
          { key: "bulk", label: "Aksi Masal" },
          { key: "audit", label: "Riwayat Aktivitas" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 7,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? "var(--text)" : "var(--text-soft)",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Tempat Sampah */}
      {tab === "bin" && (
        <div>
          {loadingBin ? (
            <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13 }}>Memuat...</div>
          ) : (
            <>
              {/* Products in bin */}
              {bin.products.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                    Produk ({bin.products.length})
                  </div>
                  {bin.products.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-soft)" }}>
                          Dihapus:{" "}
                          {new Date(p.deleted_at || p.deletedAt).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRestoreConfirm({ entityType: "product", ids: [p.id] })}
                      >
                        Pulihkan
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => setDeleteConfirm({ entityType: "product", ids: [p.id] })}
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sales in bin */}
              {bin.sales.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                    Transaksi ({bin.sales.length})
                  </div>
                  {bin.sales.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {s.receipt_number || s.receiptNumber}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-soft)" }}>
                          Total: Rp{" "}
                          {(s.grand_total || s.grandTotal || 0).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setRestoreConfirm({ entityType: "sale", ids: [s.id] })}
                      >
                        Pulihkan
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() => setDeleteConfirm({ entityType: "sale", ids: [s.id] })}
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Promotions in bin */}
              {bin.promotions.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>
                    Promosi ({bin.promotions.length})
                  </div>
                  {bin.promotions.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.code}</div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          setRestoreConfirm({ entityType: "promotion", ids: [p.id] })
                        }
                      >
                        Pulihkan
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--danger)" }}
                        onClick={() =>
                          setDeleteConfirm({ entityType: "promotion", ids: [p.id] })
                        }
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {bin.products.length === 0 &&
                bin.sales.length === 0 &&
                bin.promotions.length === 0 && (
                  <div
                    className="card"
                    style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-soft)" }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Tempat sampah kosong</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      Item yang dihapus akan muncul di sini.
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {/* Tab: Aksi Masal */}
      {tab === "bulk" && (
        <div>
          <div
            className="card"
            style={{
              marginBottom: 16,
              background: "var(--danger-soft)",
              border: "1px solid var(--danger)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>
              ⚠️ Zona Berbahaya
            </div>
            <div style={{ fontSize: 12, color: "var(--danger)" }}>
              Aksi di bawah ini akan memindahkan data ke tempat sampah. Data bisa dipulihkan dari
              tab &quot;Tempat Sampah&quot;.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              className="card"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Kosongkan Katalog</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                  Semua produk akan dipindahkan ke tempat sampah.
                </div>
              </div>
              <button
                className="btn"
                style={{ background: "var(--danger)", color: "#fff" }}
                onClick={() => setConfirmAction("products")}
              >
                Kosongkan
              </button>
            </div>

            <div
              className="card"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Kosongkan Riwayat Transaksi</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                  Semua data penjualan akan dipindahkan ke tempat sampah.
                </div>
              </div>
              <button
                className="btn"
                style={{ background: "var(--danger)", color: "#fff" }}
                onClick={() => setConfirmAction("sales")}
              >
                Kosongkan
              </button>
            </div>

            <div
              className="card"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Reset Semua Stok ke 0</div>
                <div style={{ fontSize: 12, color: "var(--text-soft)" }}>
                  Semua stok produk akan di-set ke 0. Produk tetap ada.
                </div>
              </div>
              <button
                className="btn"
                style={{ background: "var(--danger)", color: "#fff" }}
                onClick={() => setConfirmAction("stock")}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Riwayat Aktivitas */}
      {tab === "audit" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
            {/* By type */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Tipe</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { key: "", label: "Semua" },
                  { key: "product", label: "Produk" },
                  { key: "sale", label: "Transaksi" },
                  { key: "inventory", label: "Stok" },
                  { key: "user", label: "Pengguna" },
                  { key: "event", label: "Event" },
                  { key: "settings", label: "Pengaturan" },
                  { key: "promotion", label: "Promosi" },
                ].map(f => (
                  <div key={f.key} className={`cat-chip${auditFilter === f.key ? " active" : ""}`}
                    style={{ fontSize: 12, padding: "4px 12px" }}
                    onClick={() => setAuditFilter(f.key)}>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
            {/* By date */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Periode</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="date" className="input" value={auditDateFrom} onChange={e => setAuditDateFrom(e.target.value)}
                  style={{ width: 130, fontSize: 12, padding: "4px 8px" }} />
                <span style={{ fontSize: 12, color: "var(--text-soft)" }}>—</span>
                <input type="date" className="input" value={auditDateTo} onChange={e => setAuditDateTo(e.target.value)}
                  style={{ width: 130, fontSize: 12, padding: "4px 8px" }} />
                {(auditDateFrom || auditDateTo) && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => { setAuditDateFrom(""); setAuditDateTo(""); }}>Reset</button>
                )}
              </div>
            </div>
          </div>

          {loadingLogs ? (
            <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13 }}>Memuat...</div>
          ) : (() => {
            const filteredLogs = logs.filter(log => {
              const logDate = new Date(log.created_at || log.createdAt);
              if (auditDateFrom && logDate < new Date(auditDateFrom)) return false;
              if (auditDateTo && logDate > new Date(auditDateTo + "T23:59:59")) return false;
              return true;
            });
            return (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {filteredLogs.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-soft)", fontSize: 13 }}>
                  Belum ada aktivitas tercatat.
                </div>
              ) : (
                <div className="table-wrap" style={{ maxHeight: 500, overflowY: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Pengguna</th>
                        <th>Aktivitas</th>
                        <th>Tipe</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, i) => (
                          <tr key={log.id || i}>
                            <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                              {new Date(log.created_at || log.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td style={{ fontWeight: 600 }}>{log.user_name || log.userName || "System"}</td>
                            <td>{getActionLabel(log.action)}</td>
                            <td><span className="badge badge-gray" style={{ fontSize: 10 }}>{log.entity_type || log.entityType || "-"}</span></td>
                            <td style={{ fontSize: 12, color: "var(--text-soft)", maxWidth: 280 }}>
                              {formatAuditDetail(log)}
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            );
          })()}
        </div>
      )}

      {/* Confirm Modal for bulk actions */}
      <ConfirmModal
        open={!!confirmAction}
        icon="danger"
        title={
          confirmAction === "products"
            ? "Kosongkan Katalog?"
            : confirmAction === "sales"
              ? "Kosongkan Riwayat?"
              : "Reset Stok?"
        }
        message={
          confirmAction === "stock"
            ? "Semua stok akan di-set ke 0. Aksi ini tidak bisa dibatalkan."
            : "Data akan dipindahkan ke tempat sampah dan bisa dipulihkan nanti."
        }
        confirmLabel={confirmAction === "stock" ? "Ya, Reset" : "Ya, Kosongkan"}
        confirmVariant="danger"
        loading={processing}
        onConfirm={handleBulkAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Confirm Modal for permanent delete */}
      <ConfirmModal
        open={!!deleteConfirm}
        icon="danger"
        title="Hapus Permanen?"
        message="Data yang dihapus permanen tidak bisa dikembalikan lagi."
        confirmLabel="Ya, Hapus Permanen"
        confirmVariant="danger"
        loading={processing}
        onConfirm={handlePermanentDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Confirm Modal for restore */}
      <ConfirmModal
        open={!!restoreConfirm}
        icon="success"
        title="Pulihkan Item?"
        message="Item akan dikembalikan ke daftar aktif."
        confirmLabel="Ya, Pulihkan"
        confirmVariant="success"
        loading={processing}
        onConfirm={handleRestore}
        onCancel={() => setRestoreConfirm(null)}
      />

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 200,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.type === "success" ? "var(--success)" : "var(--danger)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            maxWidth: 400,
          }}
        >
          {toast.type === "success" ? "✓ " : "✗ "}
          {toast.message}
        </div>
      )}
    </div>
  );
}
