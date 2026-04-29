import { useCallback, useEffect, useRef } from "react";

/**
 * Reusable confirmation/alert modal matching the warm earthy design system.
 *
 * Usage (confirmation):
 *   <ConfirmModal
 *     open={showConfirm}
 *     title="Hapus Produk?"
 *     message="Produk ini akan dihapus dari katalog."
 *     confirmLabel="Hapus"
 *     confirmVariant="danger"
 *     onConfirm={() => handleDelete()}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 *
 * Usage (alert / info — no cancel button):
 *   <ConfirmModal
 *     open={showAlert}
 *     title="Berhasil!"
 *     message="Data telah disimpan."
 *     confirmLabel="OK"
 *     onConfirm={() => setShowAlert(false)}
 *   />
 *
 * Props:
 *   open           - boolean, show/hide
 *   title          - string, modal title
 *   message        - string | ReactNode, body text
 *   icon           - "danger" | "warning" | "success" | "info" | null (default: inferred from confirmVariant)
 *   confirmLabel   - string (default: "Ya, Lanjutkan")
 *   cancelLabel    - string (default: "Batal")
 *   confirmVariant - "primary" | "danger" | "success" (default: "primary")
 *   onConfirm      - function, called when confirm clicked
 *   onCancel       - function | null, called when cancel clicked or overlay clicked. If null, no cancel button shown.
 *   loading        - boolean, show loading state on confirm button
 */
export function ConfirmModal({
  open,
  title,
  message,
  icon,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  loading = false,
}) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape" && onCancel) onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  // Infer icon from variant if not specified
  const resolvedIcon = icon ?? (confirmVariant === "danger" ? "danger" : confirmVariant === "success" ? "success" : null);

  const iconConfig = {
    danger: {
      bg: "var(--danger-soft, #fbeaea)",
      color: "var(--danger, #b54343)",
      svg: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
    warning: {
      bg: "var(--accent-soft, #f5ead8)",
      color: "var(--accent, #c07a3b)",
      svg: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    success: {
      bg: "var(--success-soft, #ebf5ef)",
      color: "var(--success, #4a9066)",
      svg: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
    info: {
      bg: "#e8f0f8",
      color: "var(--blue, #3a6ea8)",
      svg: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      ),
    },
  };

  const confirmBtnStyle = {
    primary: { background: "var(--accent)", color: "#fff" },
    danger: { background: "var(--danger, #b54343)", color: "#fff" },
    success: { background: "var(--success, #4a9066)", color: "#fff" },
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && onCancel) onCancel(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.15s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 400,
          maxWidth: "90vw",
          padding: "28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          textAlign: "center",
          animation: "confirmModalIn 0.2s cubic-bezier(0.23, 1, 0.32, 1) both",
        }}
      >
        {/* Icon */}
        {resolvedIcon && iconConfig[resolvedIcon] && (
          <div style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: iconConfig[resolvedIcon].bg,
            color: iconConfig[resolvedIcon].color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            {iconConfig[resolvedIcon].svg}
          </div>
        )}

        {/* Title */}
        {title && (
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
            {title}
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{ fontSize: 13.5, color: "var(--text-soft, #8a8279)", lineHeight: 1.5, marginBottom: 24 }}>
            {message}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid var(--line, #e2dbd1)",
                background: "var(--surface, #f4efe8)",
                color: "var(--text)",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background-color 0.15s ease, border-color 0.15s ease",
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
              transition: "background-color 0.15s ease, opacity 0.15s ease",
              ...(confirmBtnStyle[confirmVariant] || confirmBtnStyle.primary),
            }}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
