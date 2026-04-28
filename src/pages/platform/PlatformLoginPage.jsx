import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { platformGet, platformPost, setPlatformToken } from "../../api/client";
import { LoadingScreen } from "../../components/LoadingScreen";
import "./platform.css";

export function PlatformLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

  // Try to restore existing platform session
  useEffect(() => {
    const token = localStorage.getItem("platform-token");
    if (!token) {
      setRestoring(false);
      return;
    }
    setPlatformToken(token);
    platformGet("/api/platform/me")
      .then((res) => {
        localStorage.setItem("platform-admin", JSON.stringify(res.admin));
        navigate("/platform", { replace: true });
      })
      .catch(() => {
        // Token expired or invalid — stay on login
        localStorage.removeItem("platform-token");
        localStorage.removeItem("platform-admin");
        setRestoring(false);
      });
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await platformPost("/api/platform/login", { email, password });
      localStorage.setItem("platform-token", res.token);
      localStorage.setItem("platform-admin", JSON.stringify(res.admin));
      setPlatformToken(res.token);
      navigate("/platform");
    } catch (err) {
      setError(err.message || "Login gagal. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  }

  if (restoring) {
    return <LoadingScreen message="Memulihkan sesi..." variant="platform" />;
  }

  return (
    <div className="platform-login-page">
      <div className="platform-login-wrapper">
        <div className="platform-login-logo">
          <h1>Lakoo.</h1>
          <p>Platform Admin</p>
        </div>

        <div className="platform-login-card">
          <h2>Masuk</h2>
          <p className="login-subtitle">Masuk ke panel administrasi platform</p>

          <form onSubmit={handleSubmit}>
            <div className="form-stack">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lakoo.id"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                />
              </div>

              {error && <div className="error-text">{error}</div>}

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
