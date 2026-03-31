export function LoginForm({ form, authLoading, error, onChange, onSubmit }) {
  return (
    <section className="login-form-shell">
      <div className="login-card">
        <div>
          <p className="eyebrow">Sign In</p>
          <h2>Masuk ke workspace POS</h2>
          <p className="muted-text">Gunakan akun demo di samping untuk mencoba role berbeda.</p>
        </div>

        <form className="form-stack" onSubmit={onSubmit}>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={(event) => onChange("username", event.target.value)} />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="primary-button" disabled={authLoading} type="submit">
            {authLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
}
