import { useState, useEffect } from "react";
import { usePosData } from "../context/PosDataContext";
import { ConfirmModal } from "../components/ConfirmModal";
import "../features/dashboard/dashboard.css";

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
      getAuditLogs({ limit: 100 })
        .then(setLogs)
        .catch(() => {})
        .finally(() => setLoadingLogs(false));
    }
  }, [tab]);

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
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
          {loadingLogs ? (
            <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13 }}>Memuat...</div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              {logs.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--text-soft)",
                    fontSize: 13,
                  }}
                >
                  Belum ada aktivitas tercatat.
                </div>
              ) : (
                <div style={{ maxHeight: 500, overflowY: "auto" }}>
                  {logs.map((log, i) => (
                    <div
                      key={log.id || i}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line)",
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                          color: "var(--text-soft)",
                        }}
                      >
                        {(log.user_name || log.userName || "S").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div>
                          <strong>{log.user_name || log.userName || "System"}</strong>
                          <span style={{ color: "var(--text-soft)", marginLeft: 6 }}>
                            {log.action}
                          </span>
                        </div>
                        {(log.entity_type || log.entityType) && (
                          <div
                            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
                          >
                            {log.entity_type || log.entityType}
                            {(log.entity_id || log.entityId)
                              ? ` · ${(log.entity_id || log.entityId).substring(0, 12)}...`
                              : ""}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                        {new Date(log.created_at || log.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
