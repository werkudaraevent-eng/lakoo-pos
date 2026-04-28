import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { platformGet, setPlatformToken } from "../../api/client";
import { LoadingScreen } from "../../components/LoadingScreen";
import "./platform.css";

export function PlatformShell({ children, title }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("platform-admin") || "null");
    } catch {
      return null;
    }
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("platform-token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    setPlatformToken(token);

    // Validate token with server
    platformGet("/api/platform/me")
      .then((res) => {
        setAdmin(res.admin);
        localStorage.setItem("platform-admin", JSON.stringify(res.admin));
        setAuthChecked(true);
      })
      .catch(() => {
        // Token expired or invalid
        localStorage.removeItem("platform-token");
        localStorage.removeItem("platform-admin");
        navigate("/platform/login");
      });
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("platform-token");
    localStorage.removeItem("platform-admin");
    setPlatformToken("");
    navigate("/platform/login");
  }

  if (!authChecked) {
    return <LoadingScreen message="Memverifikasi akses..." variant="platform" />;
  }

  return (
    <div className="platform-layout">
      <aside className="platform-sidebar">
        <div className="platform-sidebar-brand">
          <h1>Lakoo.</h1>
          <span>Platform Admin</span>
        </div>
        <nav className="platform-nav">
          <NavLink
            to="/platform"
            end
            className={({ isActive }) =>
              `platform-nav-item${isActive ? " active" : ""}`
            }
          >
            📊 <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/platform/tenants"
            className={({ isActive }) =>
              `platform-nav-item${isActive ? " active" : ""}`
            }
          >
            🏪 <span>Tenant</span>
          </NavLink>
        </nav>
        {admin && (
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--sidebar-text)",
              }}
            >
              {admin.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--sidebar-muted)" }}>
              {admin.email}
            </div>
            <button
              onClick={handleLogout}
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--sidebar-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              Keluar
            </button>
          </div>
        )}
      </aside>
      <div className="platform-main">
        <div className="platform-topbar">
          <div className="platform-topbar-title">{title}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: "var(--text-soft)" }}>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="platform-content">{children}</div>
      </div>
    </div>
  );
}

// Shared helpers
export function formatPlatformDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function planBadgeClass(plan) {
  const map = {
    trial: "trial",
    starter: "starter",
    pro: "pro",
    business: "business",
  };
  return map[plan?.toLowerCase()] || "trial";
}

export function statusBadgeClass(status) {
  const map = {
    active: "active",
    suspended: "suspended",
    cancelled: "cancelled",
  };
  return map[status?.toLowerCase()] || "active";
}
