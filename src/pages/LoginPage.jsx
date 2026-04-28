import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { setAuthToken } from "../api/client";
import "../features/login/login.css";

export function LoginPage() {
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const destination = location.state?.from || "/dashboard";

  // Handle impersonation from platform admin
  // AuthContext already picks up the impersonate token from URL params,
  // but we need to set the user data and impersonation flag, then redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const impersonateToken = params.get("impersonate");
    const impersonateUser = params.get("user");

    if (impersonateToken && impersonateUser) {
      try {
        const user = JSON.parse(impersonateUser);
        localStorage.setItem("pos-user", JSON.stringify(user));
        localStorage.setItem("pos-impersonating", "true");
        // Clean URL and redirect — AuthContext will handle session restore with the new token
        window.history.replaceState({}, "", "/workspace/select");
        navigate("/workspace/select", { replace: true });
      } catch (e) {
        console.error("Impersonation failed:", e);
      }
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (authLoading) return;
    setError("");

    const result = await login(form);
    if (!result.ok) {
      const message = result.message || "";

      // Detect blocked account reason from error message and redirect
      if (message.includes("trial") || message.includes("Trial")) {
        navigate("/account-blocked", { state: { reason: "trial_expired", message } });
      } else if (message.includes("langganan") || message.includes("Langganan")) {
        navigate("/account-blocked", { state: { reason: "subscription_expired", message } });
      } else if (message.includes("suspend") || message.includes("Suspend")) {
        navigate("/account-blocked", { state: { reason: "suspended", message } });
      } else if (message.includes("batal") || message.includes("Batal")) {
        navigate("/account-blocked", { state: { reason: "cancelled", message } });
      } else {
        setError(message);
      }
      return;
    }
    navigate(destination, { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-wrapper">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-text">Lakoo.</div>
          <div className="login-logo-sub">Point of Sale System</div>
        </div>

        {/* Card */}
        <div className="login-card">
          <h2>Selamat datang</h2>
          <p className="login-subtitle">Masuk ke akun kasir Anda</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label>Username</label>
              <input
                autoFocus
                placeholder="Masukkan username"
                value={form.username}
                onChange={(e) => { setForm((c) => ({ ...c, username: e.target.value })); setError(""); }}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => { setForm((c) => ({ ...c, password: e.target.value })); setError(""); }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPass((v) => !v)}
                >
                  {showPass ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button className="primary-button" disabled={authLoading} type="submit">
              {authLoading ? "Memverifikasi..." : "Masuk →"}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div className="login-demo-hint">
          Demo: <code>admin</code> / <code>admin123</code>
        </div>

        <p className="login-register-link">
          Belum punya akun? <a href="/register">Daftar gratis</a>
        </p>
      </div>
    </div>
  );
}
