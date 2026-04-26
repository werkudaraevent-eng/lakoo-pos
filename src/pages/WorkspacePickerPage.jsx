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

function getStatusColor(status) {
  if (status === "active" || status === "Active") return "var(--success)";
  if (status === "draft" || status === "Draft") return "var(--warning)";
  if (status === "closed" || status === "Closed") return "var(--danger)";
  return "var(--text-soft)";
}

export function WorkspacePickerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { workspaces, loading, hasLoaded, loadError } = usePosData();
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

    if (!workspace) {
      return;
    }

    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }, [accessibleWorkspaces, autoWorkspaceId, loading, navigate, nextPath, selectWorkspace]);

  function handleSelect(workspace) {
    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }

  return (
    <div className="wsp-page">
      {/* Sidebar brand */}
      <aside className="wsp-sidebar">
        <div className="wsp-sidebar-brand">
          <div className="wsp-logo">L</div>
          <span className="wsp-logo-text">Lakoo</span>
        </div>

        <div className="wsp-sidebar-features">
          <div className="wsp-sidebar-feature">
            <span>⚡</span>
            <span>Checkout cepat</span>
          </div>
          <div className="wsp-sidebar-feature">
            <span>📊</span>
            <span>Laporan real-time</span>
          </div>
          <div className="wsp-sidebar-feature">
            <span>🏪</span>
            <span>Multi-outlet</span>
          </div>
          <div className="wsp-sidebar-feature">
            <span>🎪</span>
            <span>Event management</span>
          </div>
        </div>

        <div className="wsp-sidebar-footer">
          <p>© 2026 Lakoo POS</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="wsp-main">
        <div className="wsp-content">
          {/* User header */}
          <div className="wsp-user-bar">
            <div className="wsp-user-info">
              <div className="wsp-avatar">{getUserInitial(user)}</div>
              <div>
                <p className="wsp-user-name">{user?.name || user?.username || "User"}</p>
                <p className="wsp-user-role">{user?.role || "user"}</p>
              </div>
            </div>
            <button className="wsp-logout-btn" onClick={logout} type="button">
              Keluar
            </button>
          </div>

          {/* Title */}
          <div className="wsp-title-section">
            <h1>Pilih Workspace</h1>
            <p>Pilih toko atau event yang ingin Anda kelola saat ini.</p>
          </div>

          {/* Workspace list */}
          <div className="wsp-list-section">
            {loading ? (
              <div className="wsp-empty">
                <div className="wsp-empty-icon">⏳</div>
                <p>Memuat workspace...</p>
              </div>
            ) : null}

            {!loading && loadError ? (
              <div className="wsp-empty wsp-empty-error">
                <div className="wsp-empty-icon">⚠️</div>
                <p>{loadError}</p>
              </div>
            ) : null}

            {!loading && !loadError && pickerOptions.length === 0 ? (
              <div className="wsp-empty">
                <div className="wsp-empty-icon">📭</div>
                <p>Tidak ada workspace yang tersedia untuk akun Anda.</p>
              </div>
            ) : null}

            {!loading && !loadError && pickerOptions.length > 0 ? (
              <div className="wsp-grid">
                {pickerOptions.map((workspace) => {
                  const isEvent = workspace.typeLabel === "Event";
                  return (
                    <button
                      className={`wsp-card${workspace.isCurrent ? " is-current" : ""}${isEvent ? " is-event" : ""}`}
                      key={workspace.id}
                      onClick={() => handleSelect(workspace.id)}
                      type="button"
                    >
                      <div className="wsp-card-icon">
                        {isEvent ? "🎪" : "🏪"}
                      </div>
                      <div className="wsp-card-body">
                        <div className="wsp-card-head">
                          <strong className="wsp-card-name">{workspace.name}</strong>
                          {workspace.isCurrent ? (
                            <span className="wsp-card-current">Aktif</span>
                          ) : null}
                        </div>
                        <div className="wsp-card-meta">
                          <span className={`wsp-card-type${isEvent ? " is-event" : ""}`}>
                            {workspace.typeLabel}
                          </span>
                          {workspace.statusLabel ? (
                            <span
                              className="wsp-card-status"
                              style={{ color: getStatusColor(workspace.statusLabel) }}
                            >
                              ● {workspace.statusLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="wsp-card-arrow">→</div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
