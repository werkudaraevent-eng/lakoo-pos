import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../features/login/login.css";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    ownerName: "",
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function slugify(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function handleBusinessNameChange(value) {
    setForm((f) => ({ ...f, businessName: value, slug: slugify(value) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.businessName || !form.email || !form.password) {
      setError("Nama bisnis, email, dan password wajib diisi.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        businessName: form.businessName,
        slug: form.slug,
        email: form.email,
        password: form.password,
        ownerName: form.ownerName || form.businessName,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: 12.5,
    fontWeight: 700,
    color: "var(--text-soft)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
  };

  return (
    <div className="login-page">
      <div className="login-wrapper" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-text">Lakoo.</div>
          <div className="login-logo-sub">Point of Sale System</div>
        </div>

        {/* Card */}
        <div className="login-card">
          {success ? (
            /* Success State */
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Registrasi Berhasil!</div>
              <div style={{ fontSize: 14, color: "var(--text-soft)", lineHeight: 1.6, marginBottom: 8 }}>
                Akun bisnis <strong>{form.businessName}</strong> telah dibuat.
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Mengalihkan ke halaman login...
              </div>
            </div>
          ) : (
            /* Register Form */
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Daftar Bisnis Baru</h2>
              <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginBottom: 24 }}>
                Buat akun gratis dan mulai kelola bisnis Anda
              </div>

              {error && (
                <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Nama Bisnis */}
                  <div className="field">
                    <label style={labelStyle}>Nama Bisnis *</label>
                    <input
                      className="input"
                      autoFocus
                      value={form.businessName}
                      onChange={(e) => handleBusinessNameChange(e.target.value)}
                      placeholder="Contoh: Warung Kopi Nusantara"
                    />
                  </div>

                  {/* Slug */}
                  <div className="field">
                    <label style={labelStyle}>Slug URL</label>
                    <input
                      className="input"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="warung-kopi"
                      style={{ fontFamily: "monospace", fontSize: 13 }}
                    />
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                      lakoo.app/<strong>{form.slug || "..."}</strong>
                    </div>
                  </div>

                  {/* Nama Pemilik */}
                  <div className="field">
                    <label style={labelStyle}>Nama Pemilik</label>
                    <input
                      className="input"
                      value={form.ownerName}
                      onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                      placeholder="Nama lengkap pemilik"
                    />
                  </div>

                  {/* Email */}
                  <div className="field">
                    <label style={labelStyle}>Email *</label>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="email@bisnis.com"
                    />
                  </div>

                  {/* Password */}
                  <div className="field">
                    <label style={labelStyle}>Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        className="input"
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 6 karakter"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: "100%", height: 46, fontSize: 14, fontWeight: 700, marginTop: 6 }}
                  >
                    {loading ? "Mendaftar..." : "Daftar Sekarang →"}
                  </button>
                </div>
              </form>

              <p className="login-register-link">
                Sudah punya akun? <Link to="/login">Login di sini</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
