import { useState } from "react";

export function LoginForm({ form, authLoading, error, onChange, onSubmit }) {
  const [showPass, setShowPass] = useState(false);

  return (
    <section className="login-form-section">
      <div className="login-card">
        <div>
          <h2>Selamat datang</h2>
          <p className="login-subtitle">Masuk ke akun kasir Anda</p>
        </div>

        <form className="form-stack" onSubmit={onSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              autoFocus
              value={form.username}
              onChange={(event) => onChange("username", event.target.value)}
              placeholder="Masukkan username"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(event) => onChange("password", event.target.value)}
                placeholder="Masukkan password"
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

        <p className="login-register-link">
          Belum punya akun? <a href="/register">Daftar gratis</a>
        </p>
      </div>
    </section>
  );
}
