import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../features/login/login.css";

export function LoginPage() {
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const destination = location.state?.from || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    if (authLoading) return;
    setError("");

    const result = await login(form);
    if (!result.ok) {
      setError(result.message);
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
              <input
                type="password"
                placeholder="Masukkan password"
                value={form.password}
                onChange={(e) => { setForm((c) => ({ ...c, password: e.target.value })); setError(""); }}
              />
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
