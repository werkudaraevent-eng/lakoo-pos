import { useLocation, useNavigate } from "react-router-dom";
import "../features/login/login.css";

const REASONS = {
  trial_expired: {
    icon: "⏰",
    title: "Masa Trial Telah Berakhir",
    message: "Masa percobaan Anda telah habis. Hubungi tim Lakoo untuk upgrade ke paket berbayar dan lanjutkan menggunakan sistem.",
    color: "var(--accent)",
  },
  subscription_expired: {
    icon: "📅",
    title: "Langganan Telah Berakhir",
    message: "Masa langganan Anda telah habis. Hubungi tim Lakoo untuk memperpanjang langganan.",
    color: "var(--accent)",
  },
  suspended: {
    icon: "🚫",
    title: "Akun Disuspend",
    message: "Akun bisnis Anda sedang disuspend. Hubungi tim support Lakoo untuk informasi lebih lanjut.",
    color: "var(--danger)",
  },
  cancelled: {
    icon: "❌",
    title: "Akun Dibatalkan",
    message: "Akun bisnis Anda telah dibatalkan. Hubungi tim Lakoo jika ini adalah kesalahan.",
    color: "var(--danger)",
  },
};

export function AccountBlockedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Support both route state (from login redirect) and query params (from API 403 redirect)
  const params = new URLSearchParams(location.search);
  const reason = location.state?.reason || params.get("reason") || "trial_expired";
  const serverMessage = location.state?.message || params.get("message") || "";
  const info = REASONS[reason] || REASONS.trial_expired;

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-text">Lakoo.</div>
          <div className="login-logo-sub">Point of Sale System</div>
        </div>

        <div className="login-card" style={{ textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{info.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: info.color }}>
            {info.title}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-soft)", lineHeight: 1.6, marginBottom: 24 }}>
            {serverMessage || info.message}
          </div>

          {/* Contact info */}
          <div style={{
            background: "var(--surface)",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
            fontSize: 13,
            color: "var(--text-soft)",
            lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>Hubungi Kami</div>
            Email: support@lakoo.id<br />
            WhatsApp: +62 812-xxxx-xxxx
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ width: "100%", height: 44, fontSize: 14 }}
              onClick={() => window.open("https://wa.me/62812xxxx?text=Halo%20Lakoo%2C%20saya%20ingin%20perpanjang%20langganan", "_blank")}
            >
              💬 Hubungi via WhatsApp
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={() => navigate("/login")}
            >
              Coba Login Kembali
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Sudah perpanjang langganan? Klik "Coba Login Kembali" untuk masuk ke akun Anda.
          </div>
        </div>
      </div>
    </div>
  );
}
