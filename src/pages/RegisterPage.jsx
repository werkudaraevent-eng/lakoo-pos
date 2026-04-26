import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import "../features/login/login.css";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, authLoading } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    slug: "",
    email: "",
    password: "",
    ownerName: "",
  });
  const [message, setMessage] = useState("");

  function handleSlugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleBusinessNameChange(value) {
    setForm((current) => ({
      ...current,
      businessName: value,
      slug: handleSlugify(value),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!form.businessName || !form.email || !form.password) {
      setMessage("Semua field wajib diisi.");
      return;
    }

    const result = await register({
      businessName: form.businessName,
      slug: form.slug,
      email: form.email,
      password: form.password,
      ownerName: form.ownerName || form.businessName,
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage("Registrasi berhasil! Silakan login.");
    setTimeout(() => navigate("/login"), 2000);
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-hero-section">
          <div className="login-hero-content">
            <h1 className="login-hero-title">Lakoo</h1>
            <p className="login-hero-subtitle">Daftar gratis, trial 14 hari</p>
          </div>
        </div>

        <div className="login-form-section">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Daftar Bisnis Baru</h2>

            {message ? <p className="login-error">{message}</p> : null}

            <label className="field">
              <span>Nama Bisnis</span>
              <input
                autoFocus
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="Contoh: Toko Saya"
                value={form.businessName}
              />
            </label>

            <label className="field">
              <span>Slug (URL)</span>
              <input
                onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
                placeholder="toko-saya"
                value={form.slug}
              />
              <small className="muted-text">lakoo.app/{form.slug || "..."}</small>
            </label>

            <label className="field">
              <span>Nama Pemilik</span>
              <input
                onChange={(e) => setForm((c) => ({ ...c, ownerName: e.target.value }))}
                placeholder="Nama lengkap"
                value={form.ownerName}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="email@contoh.com"
                type="email"
                value={form.email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                placeholder="Min. 6 karakter"
                type="password"
                value={form.password}
              />
            </label>

            <Button disabled={authLoading} type="submit">
              {authLoading ? "Mendaftar..." : "Daftar Sekarang"}
            </Button>

            <p className="muted-text" style={{ textAlign: "center", marginTop: "1rem" }}>
              Sudah punya akun? <Link to="/login">Login di sini</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
