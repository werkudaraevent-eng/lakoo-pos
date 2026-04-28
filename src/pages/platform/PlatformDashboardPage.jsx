import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { platformGet } from "../../api/client";
import { PlatformShell, formatPlatformDate, planBadgeClass, statusBadgeClass } from "./PlatformShell";
import "./platform.css";

export function PlatformDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await platformGet("/api/platform/stats");
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <PlatformShell title="Dashboard">
      {loading && <div style={{ padding: 24, color: "var(--text-soft)", fontSize: 13.5 }}>Memuat data...</div>}
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {stats && (
        <>
          {/* KPI Cards */}
          <div className="platform-stats-grid">
            <div className="platform-stat-card">
              <div className="stat-icon blue">🏢</div>
              <div className="stat-label">Total Tenant</div>
              <div className="stat-value">{stats.totalTenants ?? 0}</div>
            </div>
            <div className="platform-stat-card">
              <div className="stat-icon green">✅</div>
              <div className="stat-label">Tenant Aktif</div>
              <div className="stat-value">{stats.activeTenants ?? 0}</div>
            </div>
            <div className="platform-stat-card">
              <div className="stat-icon amber">⏳</div>
              <div className="stat-label">Tenant Trial</div>
              <div className="stat-value">{stats.trialTenants ?? 0}</div>
            </div>
            <div className="platform-stat-card">
              <div className="stat-icon red">🚫</div>
              <div className="stat-label">Tenant Suspended</div>
              <div className="stat-value">{stats.suspendedTenants ?? 0}</div>
            </div>
          </div>

          {/* Recent Tenants Table */}
          <div className="platform-detail-card">
            <h3>Tenant Terbaru</h3>
            {stats.recentTenants && stats.recentTenants.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Slug</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTenants.map((tenant) => (
                    <tr
                      key={tenant._id || tenant.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(
                          `/platform/tenants/${tenant._id || tenant.id}`
                        )
                      }
                    >
                      <td style={{ fontWeight: 600 }}>{tenant.name}</td>
                      <td style={{ color: "var(--text-soft)" }}>
                        {tenant.slug}
                      </td>
                      <td>
                        <span
                          className={`platform-badge ${planBadgeClass(tenant.plan)}`}
                        >
                          {tenant.plan || "trial"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`platform-badge ${statusBadgeClass(tenant.status)}`}
                        >
                          {tenant.status || "active"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-soft)", fontSize: 13 }}>
                        {formatPlatformDate(tenant.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="platform-empty">
                <div className="empty-icon">📋</div>
                <h3>Belum ada tenant</h3>
                <p>Tenant baru akan muncul di sini</p>
              </div>
            )}
          </div>
        </>
      )}
    </PlatformShell>
  );
}
