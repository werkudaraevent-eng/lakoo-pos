export function LoginForm({ form, authLoading, error, onChange, onSubmit }) {
  return (
    <section className="login-form-section">
      <div className="login-card">
        <div>
          <h2>Masuk ke akun Anda</h2>
          <p className="muted-text" style={{ marginTop: 6 }}>
            Masukkan username dan password untuk melanjutkan.
          </p>
        </div>

        <form className="form-stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              autoFocus
              value={form.username}
              onChange={(event) => onChange("username", event.target.value)}
              placeholder="Masukkan username"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="Masukkan password"
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="primary-button" disabled={authLoading} type="submit">
            {authLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="login-register-link">
          Belum punya akun? <a href="/register">Daftar gratis</a>
        </p>
      </div>
    </section>
  );
}
