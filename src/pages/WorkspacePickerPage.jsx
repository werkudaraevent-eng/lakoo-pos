import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { buildWorkspacePickerOptions } from "../features/workspaces/workspacePicker";
import {
  filterAccessibleWorkspaces,
  getRoleLandingPath,
  shouldClearWorkspaceSelection,
} from "../features/workspaces/workspaceGuards";
import "../features/workspaces/workspace-picker.css";

function getNextPath(locationState, user) {
  const requestedPath = typeof locationState?.from === "string" ? locationState.from : "";
  if (requestedPath && !requestedPath.startsWith("/workspace/select")) {
    return requestedPath;
  }
  return getRoleLandingPath(user?.role);
}

function getUserInitial(user) {
  const source = user?.name || user?.username || "U";
  return source.charAt(0).toUpperCase();
}

export function WorkspacePickerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { workspaces, sales, loading, hasLoaded, loadError } = usePosData();
  const { activeWorkspaceId, selectWorkspace, clearWorkspace } = useWorkspace();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
  const pickerOptions = buildWorkspacePickerOptions(accessibleWorkspaces, activeWorkspaceId);
  const autoWorkspaceId = searchParams.get("auto");
  const nextPath = getNextPath(location.state, user);

  useEffect(() => {
    if (
      shouldClearWorkspaceSelection({
        activeWorkspaceId,
        accessibleWorkspaces,
        hasLoaded,
        loadError,
      })
    ) {
      clearWorkspace();
    }
  }, [accessibleWorkspaces, activeWorkspaceId, clearWorkspace, hasLoaded, loadError]);

  useEffect(() => {
    if (loading || !autoWorkspaceId || accessibleWorkspaces.length !== 1) {
      return;
    }
    const workspace = accessibleWorkspaces.find((item) => item.id === autoWorkspaceId);
    if (!workspace) return;
    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }, [accessibleWorkspaces, autoWorkspaceId, loading, navigate, nextPath, selectWorkspace]);

  function handleSelect(workspace) {
    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }

  // Count today's sales per workspace (simple heuristic)
  const today = new Date().toISOString().slice(0, 10);
  const todaySalesCount = (sales || []).filter(
    (s) => s.createdAt && s.createdAt.slice(0, 10) === today
  ).length;

  return (
    <div className="wsp-page">
      {/* Top bar */}
      <header className="wsp-topbar">
        <div className="wsp-topbar-brand">
          <div className="wsp-topbar-logo">L</div>
          <span className="wsp-topbar-name">Lakoo</span>
        </div>
        <div className="wsp-topbar-right">
          <div className="wsp-topbar-user">
            <div className="wsp-topbar-avatar">{getUserInitial(user)}</div>
            <div className="wsp-topbar-user-info">
              <span className="wsp-topbar-user-name">{user?.name || user?.username}</span>
              <span className="wsp-topbar-user-role">{user?.role}</span>
            </div>
          </div>
          <button className="wsp-topbar-logout" onClick={logout} type="button">
            Keluar
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="wsp-center">
        <div className="wsp-hero">
          <h1>Selamat datang kembali 👋</h1>
          <p>Pilih outlet atau event untuk memulai sesi kerja Anda.</p>
        </div>

        {/* Stats bar */}
        <div className="wsp-stats-bar">
          <div className="wsp-stat">
            <span className="wsp-stat-value">{pickerOptions.length}</span>
            <span className="wsp-stat-label">Workspace</span>
          </div>
          <div className="wsp-stat-divider" />
          <div className="wsp-stat">
            <span className="wsp-stat-value">{todaySalesCount}</span>
            <span className="wsp-stat-label">Transaksi Hari Ini</span>
          </div>
          <div className="wsp-stat-divider" />
          <div className="wsp-stat">
            <span className="wsp-stat-value">
              {pickerOptions.filter((w) => w.typeLabel === "Event").length}
            </span>
            <span className="wsp-stat-label">Event Aktif</span>
          </div>
        </div>

        {/* Workspace grid */}
        <div className="wsp-section">
          {loading ? (
            <div className="wsp-loading">
              <div className="wsp-loading-spinner" />
              <p>Memuat workspace...</p>
            </div>
          ) : null}

          {!loading && loadError ? (
            <div className="wsp-empty-state">
              <div className="wsp-empty-icon">⚠️</div>
              <h3>Gagal memuat</h3>
              <p>{loadError}</p>
            </div>
          ) : null}

          {!loading && !loadError && pickerOptions.length === 0 ? (
            <div className="wsp-empty-state">
              <div className="wsp-empty-icon">📭</div>
              <h3>Belum ada workspace</h3>
              <p>Tidak ada workspace yang tersedia untuk akun Anda.</p>
            </div>
          ) : null}

          {!loading && !loadError && pickerOptions.length > 0 ? (
            <div className="wsp-grid">
              {pickerOptions.map((workspace) => {
                const isEvent = workspace.typeLabel === "Event";
                const statusLower = (workspace.statusLabel || "").toLowerCase();
                return (
                  <button
                    className={`wsp-tile${workspace.isCurrent ? " is-active" : ""}${isEvent ? " is-event" : ""}`}
                    key={workspace.id}
                    onClick={() => handleSelect(workspace.id)}
                    type="button"
                  >
                    {workspace.isCurrent ? (
                      <div className="wsp-tile-active-badge">Sesi Aktif</div>
                    ) : null}

                    <div className="wsp-tile-icon-wrap">
                      <div className="wsp-tile-icon">
                        {isEvent ? "🎪" : "🏪"}
                      </div>
                    </div>

                    <div className="wsp-tile-content">
                      <h3 className="wsp-tile-name">{workspace.name}</h3>
                      <div className="wsp-tile-tags">
                        <span className={`wsp-tile-type${isEvent ? " is-event" : ""}`}>
                          {isEvent ? "Event" : "Toko"}
                        </span>
                        {workspace.statusLabel ? (
                          <span className={`wsp-tile-status status-${statusLower}`}>
                            {workspace.statusLabel}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="wsp-tile-arrow">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
